"""
flow.py
Имитация DAG из airflow
Запуск: python flow.py
"""

import asyncio
import aiohttp
import duckdb
from datetime import datetime
from funcs_api import async_fetch_candles   # предполагается, что эта функция определена

# Конфигурация
DB_FILE = "db_files/analytics.duckdb"
START_TIMESTAMP = 1775204400  # 03.04.2026, 11:21:00 (пример)
GRANULARITY = 60  # секунды

# Список символов для загрузки
SYMBOLS = [
    {'name': 'ETH-USDT', 'timestamp_type': 1},
    {'name': 'BTC-USDT', 'timestamp_type': 1},
]

# -------------------------------------------------------------------
# Работа с базой данных
# -------------------------------------------------------------------

def init_db(conn):
    """Создаёт таблицы, если они не существуют."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS symbol (
            id INTEGER PRIMARY KEY,
            name VARCHAR NOT NULL UNIQUE,
            timestamp_type INTEGER NOT NULL
        );
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS raw_candles (
            symbol_id INTEGER NOT NULL,
            timestamp BIGINT NOT NULL,
            open DOUBLE NOT NULL,
            high DOUBLE NOT NULL,
            low DOUBLE NOT NULL,
            close DOUBLE NOT NULL,
            volume DOUBLE NOT NULL,
            PRIMARY KEY (symbol_id, timestamp)
        );
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS temp (
            symbol_id INTEGER PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            open DOUBLE NOT NULL,
            high DOUBLE NOT NULL,
            low DOUBLE NOT NULL,
            close DOUBLE NOT NULL,
            volume DOUBLE NOT NULL
        );
    """)

def get_symbol_id(conn, symbol_name, timestamp_type=1):
    """Возвращает id символа. Если символа нет, создаёт запись."""
    result = conn.execute("SELECT id FROM symbol WHERE name = ?", (symbol_name,)).fetchone()
    if result:
        return result[0]
    else:
        # Получаем следующий id (можно использовать AUTOINCREMENT, но DuckDB требует явного max)
        max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM symbol").fetchone()[0]
        new_id = max_id + 1
        conn.execute("INSERT INTO symbol (id, name, timestamp_type) VALUES (?, ?, ?)",
                     (new_id, symbol_name, timestamp_type))
        return new_id

def get_last_timestamp(conn, symbol_id):
    """Возвращает максимальный timestamp из temp (если есть), иначе из raw_candles."""
    # Сначала пробуем temp
    res = conn.execute("SELECT timestamp FROM temp WHERE symbol_id = ?", (symbol_id,)).fetchone()
    if res:
        return res[0]
    # Иначе максимум из raw_candles
    res = conn.execute("SELECT MAX(timestamp) FROM raw_candles WHERE symbol_id = ?", (symbol_id,)).fetchone()
    return res[0] if res[0] is not None else None

def insert_candles(conn, symbol_id, candles):
    """
    Вставляет список свечей в raw_candles и обновляет temp последней свечой.
    candles: список списков [timestamp, open, high, low, close, volume]
    """
    if not candles:
        return

    # Вставка всех свечей (игнорируем конфликты)
    for c in candles:
        ts, o, h, l, c_, v = c
        conn.execute("""
            INSERT INTO raw_candles (symbol_id, timestamp, open, high, low, close, volume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (symbol_id, timestamp) DO NOTHING
        """, (symbol_id, ts, o, h, l, c_, v))

    # Обновляем temp последней свечой (самый большой timestamp)
    last_candle = max(candles, key=lambda x: x[0])
    ts, o, h, l, c_, v = last_candle
    conn.execute("""
        INSERT INTO temp (symbol_id, timestamp, open, high, low, close, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (symbol_id) DO UPDATE SET
            timestamp = EXCLUDED.timestamp,
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume
    """, (symbol_id, ts, o, h, l, c_, v))

# -------------------------------------------------------------------
# Основная логика
# -------------------------------------------------------------------

async def fetch_and_store(symbol_name, start_ts, conn, session):
    """Загружает свечи для одного символа и сохраняет в БД."""
    symbol_id = get_symbol_id(conn, symbol_name, timestamp_type=1)
    last_ts = get_last_timestamp(conn, symbol_id)

    # Определяем start_ts для запроса
    if last_ts is not None:
        # Запрашиваем свечи, начиная со следующей минуты после последней
        request_start = last_ts + GRANULARITY
    else:
        request_start = start_ts

    # Если последняя свеча уже актуальна (например, свеча за текущую минуту есть), пропускаем
    # Здесь можно добавить проверку, что request_start > текущего времени, но оставим API самому решать.

    setting = {
        'symbol': symbol_name,
        'time_start': request_start,
        'time_end': None,          # до текущего момента
        'granularity': GRANULARITY
    }

    candles = await async_fetch_candles(setting, session=session)
    if candles:
        # Здесь можно дополнительно отфильтровать свечи, которые уже есть в БД (на случай дублей)
        insert_candles(conn, symbol_id, candles)
        print(f"[{symbol_name}] Загружено {len(candles)} свечей, начиная с {request_start}")
    else:
        print(f"[{symbol_name}] Новых свечей нет (последняя запись: {last_ts})")

async def main():
    # Подключаемся к DuckDB
    conn = duckdb.connect(DB_FILE)
    init_db(conn)

    async with aiohttp.ClientSession() as session:
        tasks = []
        for sym_info in SYMBOLS:
            tasks.append(fetch_and_store(sym_info['name'], START_TIMESTAMP, conn, session))
        await asyncio.gather(*tasks)

    conn.close()
    print("Готово.")

if __name__ == "__main__":
    asyncio.run(main())
