---

# PostgreSQL

## Содержание

1. [Чем PostgreSQL отличается от SQLite?](#1-чем-postgresql-отличается-от-sqlite)
2. [Основы SQL (CRUD, фильтрация, JOIN)](#2-основы-sql-crud-фильтрация-join)
3. [Оконные функции (Window Functions)](#3-оконные-функции-window-functions)
4. [Пример сложного запроса: «Найти производителя машины лучшего работника месяца»](#4-пример-сложного-запроса-найти-производителя-машины-лучшего-работника-месяца)
5. [Проектирование схемы](#5-проектирование-схемы)
6. [Управление пользователями и правами](#6-управление-пользователями-и-правами)
7. [Запуск PostgreSQL на сервере (кратко)](#7-запуск-postgresql-на-сервере-кратко)
8. [Полезные ресурсы](#8-полезные-ресурсы)
9. [Индексы](#9-индексы)
10. [Транзакции и ACID](#10-транзакции-и-acid)
11. [Резервное копирование и восстановление](#11-резервное-копирование-и-восстановление)
12. [Оконные функции (Window Functions) — подробно](#12-оконные-функции-window-functions--подробно)
    - 12.1. Агрегатные оконные функции
    - 12.2. Ранжирующие функции (ranking)
    - 12.3. Функции смещения (value)
    - 12.4. Рамка окна (window frame)
13. [Сравнение PostgreSQL, MySQL, Oracle](#13-сравнение-postgresql-mysql-oracle)

## 1. Чем PostgreSQL отличается от SQLite?

| Характеристика | SQLite | PostgreSQL |
|----------------|--------|------------|
| **Архитектура** | Встраиваемая (библиотека) | Клиент-серверная |
| **Пользователи** | Нет системы пользователей | Есть роли, логины, пароли, права доступа |
| **Масштабируемость** | Легковесная, для одного приложения | Промышленная, многопользовательская, высокие нагрузки |
| **Сложные типы** | Базовые | Массивы, JSON, геоданные, полнотекстовый поиск |
| **Оконные функции** | Нет (только агрегаты) | Да |
| **Хранимые процедуры** | Ограниченно | PL/pgSQL, Python, etc. |

PostgreSQL — это полноценная серверная СУБД, которая требует установки, настройки и управления подключениями. Это даёт больше возможностей для администрирования и масштабирования.

---

## 2. Основы SQL (CRUD, фильтрация, JOIN)

### Базовые операции с таблицами
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,        -- автоинкремент
    name TEXT NOT NULL,
    age INTEGER
);

DROP TABLE users;
```

### CRUD (Create, Read, Update, Delete)
```sql
-- INSERT
INSERT INTO users (name, age) VALUES ('Алексей', 30);

-- SELECT
SELECT name, age FROM users WHERE age > 18;

-- UPDATE
UPDATE users SET age = 31 WHERE name = 'Алексей';

-- DELETE
DELETE FROM users WHERE age IS NULL;
```

### JOIN — объединение таблиц
```sql
SELECT 
    e.name AS employee,
    c.model AS car,
    p.name AS producer
FROM employees e
JOIN emp_cars ec ON e.id = ec.emp_id
JOIN cars c ON ec.car_id = c.id
JOIN producers p ON c.producer_id = p.id;
```

Типы JOIN:
- `INNER JOIN` — только совпадающие строки
- `LEFT JOIN` — все строки из левой таблицы, даже если нет совпадения
- `RIGHT JOIN` — все строки из правой
- `FULL OUTER JOIN` — все строки из обеих

---

## 3. Оконные функции (Window Functions)

Оконные функции есть в PostgreSQL, MySQL 8+, MS SQL Server, Oracle. Они позволяют выполнять расчёты по группе строк без группировки (сохраняя детальные записи).

Синтаксис: `функция() OVER (PARTITION BY колонка ORDER BY колонка)`

**Примеры часто используемых оконных функций:**

- `ROW_NUMBER()` — номер строки в разбиении
- `RANK()` — ранг с пропусками
- `DENSE_RANK()` — ранг без пропусков
- `LAG(column)` — значение из предыдущей строки
- `LEAD(column)` — значение из следующей строки
- `SUM() OVER()` — накопительная сумма

```sql
-- Для каждого работника покажем его место по сумме продаж за месяц
SELECT 
    e.name,
    s.sale_amount,
    ROW_NUMBER() OVER (PARTITION BY s.date_trunc ORDER BY s.sale_amount DESC) AS rank_in_day
FROM employees e
JOIN sales s ON e.id = s.emp_id;
```

---

## 4. Пример сложного запроса: «Найти производителя машины лучшего работника месяца»

```sql
WITH monthly_stats AS (
    SELECT 
        e.id,
        e.name,
        SUM(s.sale_amount) AS total_sales,
        ROW_NUMBER() OVER (ORDER BY SUM(s.sale_amount) DESC) AS rn
    FROM employees e
    JOIN sales s ON e.id = s.emp_id
    WHERE s.sale_date >= '2025-03-01' AND s.sale_date < '2025-04-01'
    GROUP BY e.id, e.name
),
best_employee AS (
    SELECT id FROM monthly_stats WHERE rn = 1
)
SELECT 
    p.name AS producer_name
FROM best_employee be
JOIN emp_cars ec ON be.id = ec.emp_id
JOIN cars c ON ec.car_id = c.id
JOIN producers p ON c.producer_id = p.id;
```

Здесь:
- `WITH` (CTE) — временное именованное выражение
- оконная функция `ROW_NUMBER` определяет лучшего по продажам
- далее обычные JOIN-ы связывают с таблицами машин и производителей

---

## 5. Проектирование схемы

- **Диаграмма «сущность-связь» (ERD)** — помогает визуализировать таблицы и связи (1:1, 1:N, N:N).
- **Первичный ключ (PRIMARY KEY)** — уникальный идентификатор строки.
- **Внешний ключ (FOREIGN KEY)** — ссылка на первичный ключ другой таблицы, обеспечивает целостность.

Пример создания связанных таблиц:
```sql
CREATE TABLE producers (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE
);

CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    model TEXT,
    producer_id INTEGER REFERENCES producers(id)
);
```

---

## 6. Управление пользователями и правами

```sql
-- Создание пользователя
CREATE USER analyst WITH PASSWORD 'strongpass';

-- Дать право только на чтение всех таблиц в схеме public
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyst;

-- Дать право на вставку/обновление конкретной таблицы
GRANT INSERT, UPDATE ON sales TO analyst;

-- Полный доступ (владелец)
GRANT ALL PRIVILEGES ON DATABASE mydb TO admin;

-- Забрать право
REVOKE INSERT ON sales FROM analyst;
```

Права можно настраивать на уровне базы данных, схемы, таблицы, столбца.

---

## 7. Запуск PostgreSQL на сервере (кратко)

- Установка: `sudo apt install postgresql` (Ubuntu) или через официальный дистрибутив.
- Стандартный порт: 5432
- Подключение через `psql`:
  ```bash
  sudo -u postgres psql
  ```
- Создание базы данных: `CREATE DATABASE mydb;`
- Подключение к ней: `\c mydb`

Для удалённого доступа нужно править `pg_hba.conf` и `postgresql.conf`.

---

## 8. Полезные ресурсы

- [Официальная документация PostgreSQL](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Оконные функции — подробно](https://www.postgresql.org/docs/current/tutorial-window.html)

---

Дополняю ваш конспект PostgreSQL разделами, которые вы запросили: индексы, транзакции, бэкапы, углублённое описание оконных функций, а также сравнение с MySQL и Oracle.

---

## 9. Индексы

Индексы ускоряют поиск строк по определённым столбцам. Это как предметный указатель в книге: без него приходится читать всю книгу, с ним — сразу переходишь к нужной странице.

### Основные типы индексов в PostgreSQL

- **B‑tree** — стандартный, подходит для `=`, `<`, `>`, `BETWEEN`, `LIKE 'abc%'`.
- **Hash** — только для равенства (`=`), реже используется.
- **GIN (Generalized Inverted Index)** — для массивов, JSON, полнотекстового поиска.
- **GiST (Generalized Search Tree)** — для геоданных, диапазонов.
- **BRIN (Block Range Index)** — для очень больших таблиц с естественным упорядочением (например, временные ряды).

```sql
-- Создать индекс
CREATE INDEX idx_users_age ON users(age);

-- Составной индекс (порядок важен!)
CREATE INDEX idx_users_name_age ON users(name, age);

-- Уникальный индекс
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Удалить индекс
DROP INDEX idx_users_age;
```

Когда индексы не помогают:
- если выборка охватывает более ~5–10% строк (планировщик может предпочесть последовательное сканирование);
- если таблица маленькая;
- при частых массовых вставках/обновлениях (индексы замедляют запись).

Проверить план запроса: `EXPLAIN ANALYZE SELECT ...`

---

## 10. Транзакции и ACID

Транзакция — группа операций, которая выполняется как единое целое: либо все успешно, либо ни одна.

### ACID — свойства, обеспечивающие надёжность:

- **Atomicity** (атомарность) — транзакция либо полностью выполняется, либо откатывается (ROLLBACK).
- **Consistency** (согласованность) — данные переходят из одного корректного состояния в другое (ограничения, триггеры).
- **Isolation** (изоляция) — параллельные транзакции не мешают друг другу.
- **Durability** (долговечность) — зафиксированные изменения сохраняются при сбое.

### Уровни изоляции (от слабой к сильной):

1. **READ UNCOMMITTED** (в PostgreSQL фактически READ COMMITTED) — может читать незафиксированные данные (грязное чтение).
2. **READ COMMITTED** — по умолчанию в PostgreSQL. Читает только зафиксированные данные, но возможны неповторяемые чтения.
3. **REPEATABLE READ** — гарантирует, что повторное чтение тех же строк даст тот же результат (но могут появляться фантомные строки в PostgreSQL? в Postgres REPEATABLE READ предотвращает фантомы, но не полностью изолирует от сериализационных аномалий).
4. **SERIALIZABLE** — максимальная изоляция, транзакции выполняются так, как если бы они шли последовательно.

```sql
-- Начать транзакцию
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Если ошибок нет
COMMIT;

-- При ошибке
ROLLBACK;
```

Можно устанавливать уровень изоляции:
```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
...
COMMIT;
```

---

## 11. Резервное копирование и восстановление

### 1. Логическое копирование (pg_dump)

Сохраняет структуру и данные в виде SQL-скрипта или архива.

```bash
# Дамп одной базы
pg_dump -U postgres -F c mydb > mydb.dump

# Восстановление
pg_restore -U postgres -d mydb mydb.dump
```

### 2. Физическое копирование (PITR — Point‑in‑Time Recovery)

Позволяет восстановить базу на любой момент времени. Состоит из:
- базовой копии файлов данных (pg_basebackup)
- архивов WAL (журналов предзаписи)

Настраивается через параметры в postgresql.conf. Подходит для крупных БД, где важна минимальная потеря данных.

### 3. SQL-дамп (простой)

```bash
pg_dump -U postgres mydb > mydb.sql
psql -U postgres -d mydb < mydb.sql
```

### 4. Резервное копирование отдельных таблиц

```bash
pg_dump -U postgres -t mytable mydb > mytable.sql
```

**Советы:**
- Регулярно проверяйте возможность восстановления.
- Храните бэкапы в другом месте.
- Для автоматизации используйте cron или планировщик задач.

---

## 12. Оконные функции (Window Functions) — подробно

Оконные функции выполняют вычисления по группе строк (окну), но **не сворачивают** результат в одну строку — каждая строка сохраняется, а к ней добавляется вычисленное значение.

Синтаксис:  
`функция() OVER (PARTITION BY колонка ORDER BY колонка [frame])`

### 12.1. Агрегатные оконные функции

Работают как обычные агрегаты (SUM, AVG, COUNT, MAX, MIN), но применяются к окну.

```sql
SELECT 
    name,
    salary,
    SUM(salary) OVER () AS total_salary,                -- сумма по всем
    AVG(salary) OVER (PARTITION BY department) AS avg_dept_salary
FROM employees;
```

### 12.2. Ранжирующие функции (ranking)

- `ROW_NUMBER()` — порядковый номер строки в окне (уникальный, даже при одинаковых значениях).
- `RANK()` — номер с пропусками (если одинаковые значения, получают одинаковый ранг, следующий пропускается).
- `DENSE_RANK()` — номер без пропусков (после одинаковых значений следующий ранг на 1 больше).
- `PERCENT_RANK()` — относительный ранг (0..1).
- `CUME_DIST()` — кумулятивное распределение.

```sql
SELECT 
    name,
    department,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank
FROM employees;
```

### 12.3. Функции смещения (value)

- `LAG(column [, offset [, default]])` — значение из строки, отстоящей на offset назад.
- `LEAD(...)` — значение из строки вперёд.
- `FIRST_VALUE(column)` — первое значение в окне.
- `LAST_VALUE(column)` — последнее значение в окне (нужно указывать рамку `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`).
- `NTH_VALUE(column, n)` — n-е значение.

```sql
SELECT 
    date,
    amount,
    LAG(amount, 1) OVER (ORDER BY date) AS prev_day_amount,
    amount - LAG(amount, 1) OVER (ORDER BY date) AS diff,
    FIRST_VALUE(amount) OVER (ORDER BY date) AS first_amount
FROM sales;
```

### 12.4. Рамка окна (window frame)

По умолчанию `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Можно изменить:

```sql
SUM(amount) OVER (ORDER BY date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_3days
```

Опции:
- `ROWS` — физическое количество строк
- `RANGE` — логический диапазон значений
- `GROUPS` (PG 11+) — группы строк с одинаковыми значениями

---

## 13. Сравнение PostgreSQL, MySQL, Oracle

| Характеристика | PostgreSQL | MySQL | Oracle |
|----------------|------------|-------|--------|
| **Лицензия** | Open Source (PostgreSQL License) | Open Source (GPL) | Коммерческая |
| **Стандарт SQL** | Высокое соответствие | Меньше соответствия, много расширений | Полное соответствие, свои расширения |
| **Оконные функции** | Полноценные (с 8.4) | С 8.0 (ограниченные), с 8.4+ полноценные | Полноценные |
| **JSON / NoSQL** | Отлично (JSONB, индексы GIN) | Хорошо (JSON, но медленнее) | Есть (JSON), но не так продвинуто |
| **Производительность чтения** | Очень хорошо | Очень хорошо, особенно MyISAM (но InnoDB стандарт) | Очень хорошо (с дорогим железом) |
| **Производительность записи** | Хорошо, но может быть медленнее MySQL при больших INSERT | Высокая, особенно с InnoDB | Очень высокая, но зависит от конфигурации |
| **Репликация** | Стриминг репликация, логическая репликация | Асинхронная, групповая, полусинхронная | Advanced (RAC, Data Guard) |
| **Администрирование** | Средняя сложность | Проще (особенно на хостингах) | Высокая сложность, нужен DBA |
| **Стоимость** | Бесплатно | Бесплатно (корпоративные платные версии) | Дорого (лицензирование) |
| **Популярность в DE** | Очень высокая (аналитика, DWH) | Высокая (OLTP, веб) | Высокая (корпоративный сектор) |

### Когда что выбирать?

- **PostgreSQL** — когда нужна аналитика, сложные запросы, JSON, оконные функции, строгое соответствие стандарту. Лучший выбор для Data Engineer, если нет жёстких требований к горизонтальному масштабированию.
- **MySQL** — когда нужна простота, высокая скорость записи, массовое веб-приложение, много реплик, а сложная аналитика не требуется. Хорош для OLTP.
- **Oracle** — когда есть бюджет, требования к высокой доступности, сертификация, уже существующая инфраструктура Oracle, сложные транзакции и огромные объёмы. В России его использование сокращается, но в крупных компаниях ещё встречается.

---

## Заключение

PostgreSQL — мощная, бесплатная и открытая СУБД, идеально подходящая для роли Data Engineer. Она даёт:
- строгое соблюдение стандартов,
- продвинутые возможности (оконные функции, JSON, индексы),
- надёжность (ACID, PITR),
- гибкость (хранимые процедуры на разных языках).