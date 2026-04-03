import duckdb


DB_FILE = "db_files/analytics.duckdb"

# 1. Подключение к файлу. Если файла нет — DuckDB создаст его автоматически.
con = duckdb.connect(DB_FILE)

try:
    # 2. Создание таблицы (синтаксис максимально близок к PostgreSQL)
    con.execute("""
        CREATE TABLE IF NOT EXISTS symbol (
            id BIGINT PRIMARY KEY,
            name VARCHAR NOT NULL,
            price DOUBLE,
            volume BIGINT,
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print(f" Таблица готова. База сохранена в: {DB_FILE}")

    # 3. Вставка данных (поддерживает VALUES, COPY FROM, pandas DataFrame, CSV, Parquet)
    # con.execute("""
    #     INSERT INTO symbol (id, name, price, volume) VALUES
    #     (1, 'BTC', 42500.50, 15000000000),
    #     (2, 'ETH', 2250.00, 8000000000),
    #     (3, 'SOL', 105.75, 3000000000),
    #     (4, 'BTC', 43100.00, 16000000000);  -- Дубль для демонстрации
    # """)
    print(" Данные вставлены")

    # 4. Чтение + оконная функция
    # cur = con.execute("""
    # SELECT name, price, volume
    # FROM symbol
    # ORDER BY volume DESC
    # """)
    result = con.execute("""
        SELECT
            name,
            price,
            volume,
            ROW_NUMBER() OVER (PARTITION BY name ORDER BY price DESC) as price_rank,
            LAG(price) OVER (PARTITION BY name ORDER BY updated_at) as prev_price
        FROM symbol
        ORDER BY name, price_rank;
    """).fetchall()

    print("\n Результат запроса:")
    for i in result:
        print(i)
    

finally:
    # 5. Закрытие соединения гарантирует сброс кэша и корректную запись файла
    con.close()
    print(f"\n Файл {DB_FILE} сохранён и готов к повторному открытию.")
