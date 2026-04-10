"""
Имитация DAG из airflow
    0 настройка обновляемых символов
    1 регистрация символов,
        получение последней скачанной даты
    2 формирование параметров для ассинхронной загрузки с api,
        направление запросов, обработка ошибок
    3 сортировка и вставка в БД

"""
import os
from datetime import datetime
import asyncio
import aiohttp
import duckdb
from funcs_api import (
    validate_response,
    async_fetch_candles,
    calculate_intervals,
    prepare_candles_for_db
    )


DB_FILE = "db_files/analytics.duckdb"
DB_INIT_SQL = "sql/ddl/create_tables.sql"

START_TIMESTAMP = 1774990800 # 01.04.2026, 00:00:00
GRANULARITY = 60  # секунды

# Список символов для загрузки
SYMBOLS = [
    {'name': 'ETH-USDT', 'timestamp_type': GRANULARITY},
    {'name': 'BTC-USDT', 'timestamp_type': GRANULARITY},
]

# 1.1 получаем id существующих символов из БД
db_symb_ids = {}
new_symb = set()
with duckdb.connect(DB_FILE) as conn:
    s_quer = '''SELECT * FROM symbol'''
    result = conn.execute(s_quer).fetchall()
    for data in result:
        db_symb_ids[(data[1], data[2])] = data[0] # (name, timestamp_type): id
        new_symb.add((data[1], data[2]))

# 1.2 соотносим символы из БД с символами в запросе
for symb in SYMBOLS:
    key = (symb['name'], symb['timestamp_type'])
    if key in db_symb_ids:
        symb['id'] = db_symb_ids[key]
        new_symb.remove(key)

# 1.3 Вставка новых символов в БД
if new_symb:
    with duckdb.connect(DB_FILE) as conn:
        insert_symb_script = "sql/dml/insert_symbol.sql"
        with open(insert_symb_script, 'r', encoding='utf-8') as f:
            sql_insert_script = f.read()

        for data in SYMBOLS:
            if not data.get('id'):
                result = conn.execute(sql_insert_script, data).fetchone()
                data['id'] = result[0]

# 1.4 запрос последней даты из БД по всем символам
with duckdb.connect(DB_FILE) as conn:
    DB_LAST_TIMESTAMP_SQL = "sql/queries/select_last_timestamp.sql"
    with open(DB_LAST_TIMESTAMP_SQL, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    conn.execute(sql_script)
    result = conn.fetchall()
    res_id = {i[0]:i[2] for i in result} # id: timestamp

    # добавляем последнюю дату из БД в параметры символа
    for symb in SYMBOLS:
        if symb['id'] in res_id:
            symb['time_start'] = res_id[symb['id']]


# 1.5 подготовка параметров к передаче парсеру - установка даты начала парсинга
for s in SYMBOLS:
    if not s.get('time_start'):
        s['time_start'] = START_TIMESTAMP

# 2.1 формируем params для ассинхронного api запроса с учетом лимита в 300 свечей
params = calculate_intervals(SYMBOLS)

# 2.2 скачиваем данные из api
async def fetch_multiple(params):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for setting in params:

            tasks.append(async_fetch_candles(setting, session=session))
        results = await asyncio.gather(*tasks, return_exceptions=True)
    return results

results = asyncio.run(fetch_multiple(params))

# 2.3 обрабатываем исключения
successful = []
failed = []
for res in results:
    if isinstance(res, Exception):
        failed.append(res)
    else:
        successful.append(res)
print(f"Успешно: {len(successful)}, ошибок: {len(failed)}")


print()
for i in failed:
    print(i)
print()
# 3.1 подготовка результатов для вставкик в БД объединение сортировка форматирование в tuple
ms_res = prepare_candles_for_db(successful)


# 3.2 Вставка результатов в БД -> to do: вставка пачками по 5000 шт (22 тыс вставил норм)
if ms_res:
    with duckdb.connect(DB_FILE) as conn:
        insert_candle_sql = "sql/dml/insert_candle.sql"
        with open(insert_candle_sql, 'r', encoding='utf-8') as f:
            sql_insert_script = f.read()

        conn.execute("BEGIN")
        conn.executemany(sql_insert_script, ms_res)
        conn.execute("COMMIT")

print('вставлено', len(ms_res))


# 4 запуск dbt -> построение витрин
