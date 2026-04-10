# duck_db_test_init

import duckdb
import os

# путь до БД
DB_FILE = "../db_files/analytics.duckdb"

# 1. проверка есть ли папка "db_files" - создаем
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

# путь до кода создающего таблицы
DB_INIT_SQL = "../sql/ddl/create_tables.sql"

# 2. подключение к БД или создание
conn = duckdb.connect(DB_FILE)

# 3. вызываем код создающий таблицы (если файл существует)
if os.path.exists(DB_INIT_SQL):
    with open(DB_INIT_SQL, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    conn.execute(sql_script)  # выполняем весь скрипт (можно несколько операторов)
else:
    print(f"Файл {DB_INIT_SQL} не найден, пропускаем инициализацию")

# 4. выводим схему БД (список таблиц и колонки)
print("=== Схема базы данных ===")
tables = conn.execute("SHOW TABLES").fetchall()
if not tables:
    print("Нет таблиц в базе данных")
else:
    for table_row in tables:
        table_name = table_row[0]
        print(f"\nТаблица: {table_name}")
        # описание столбцов
        desc = conn.execute(f"DESCRIBE {table_name}").fetchall()
        for col in desc:
            col_name, col_type, nullable, key, default, extra = col
            print(f"  {col_name}: {col_type} (nullable={nullable})")

# закрываем соединение
conn.close()
