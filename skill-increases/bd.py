"""
    Единичные запросы query к БД

"""
import duckdb

DB_FILE = "db_files/analytics.duckdb"


query = """ SELECT * FROM symbol """

query = """ SELECT * FROM raw_candles WHERE symbol_id = 1 """

query = """
SELECT s.name, rc.timestamp, rc.close
FROM raw_candles AS rc
JOIN symbol AS s ON rc.symbol_id = s.id
WHERE s.name = 'ETH-USDT'
"""

query = "DESCRIBE raw_candles;"

query = """
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'raw_candles';
"""


query = """
-- Уникальные по DISTINCT
SELECT DISTINCT
    s.name AS symbol,
    (rc.timestamp // 3600) * 3600 AS timestamp
FROM raw_candles AS rc
JOIN symbol AS s ON rc.symbol_id = s.id
WHERE s.name = 'BTC-USDT' AND s.timestamp_type = 60
"""

query = """
-- аггрегированные часовые свечи
SELECT
    s.name AS symbol,
    (rc.timestamp // 3600) * 3600 AS time,
    FIRST(rc.open) AS open,
    MAX(rc.high) AS high,
    MIN(rc.low) AS low,
    LAST(rc.close) AS close,
    SUM(rc.volume) AS volume
FROM raw_candles AS rc
JOIN symbol AS s ON rc.symbol_id = s.id
WHERE s.name = 'BTC-USDT' AND s.timestamp_type = 60
GROUP BY symbol, time
ORDER BY time ASC
"""

# создаем часовой каледнарь без пропусков
query = """
-- Временная таблица с непрерывным рядом часов
CREATE TEMP TABLE temp_hours AS
SELECT (generate_series::BIGINT) * 3600 AS hour_start
FROM generate_series(
    (SELECT MIN(timestamp) // 3600 FROM raw_candles),
    (SELECT MAX(timestamp) // 3600 FROM raw_candles)
) AS generate_series;

SELECT * FROM temp_hours ORDER BY hour_start;
"""


query = """

--DROP TABLE IF EXISTS eth_hour_mart;

CREATE TABLE IF NOT EXISTS eth_hour_mart (
    time TIMESTAMP,
    price DOUBLE,
    volume DOUBLE,
    ma_7 DOUBLE,
    ma_14 DOUBLE
);

WITH time_range AS (
    SELECT
        COALESCE(
            (SELECT MAX(CAST(EPOCH(time) AS BIGINT))FROM eth_hour_mart),
            MIN(rc.timestamp)
        ) as min_ts,
        MAX(rc.timestamp) as max_ts
    FROM raw_candles AS rc
    JOIN symbol AS s ON rc.symbol_id = s.id
    WHERE s.name = 'ETH-USDT' AND s.timestamp_type  = 60
),
hourly_series AS (
    SELECT
        (generate_series::BIGINT) * 3600 AS time
    FROM generate_series(
        (SELECT min_ts // 3600+1 FROM time_range),
        (SELECT (max_ts // 3600) - 1 FROM time_range)
    ) AS generate_series
),
real_hourly AS (
    SELECT
        (rc.timestamp // 3600) * 3600 as time,
        LAST(rc.close ORDER BY rc.timestamp) AS price,
        SUM(rc.volume) AS volume
    FROM raw_candles AS rc
    JOIN symbol AS s ON rc.symbol_id = s.id
    WHERE s.name = 'ETH-USDT' AND s.timestamp_type  = 60
    GROUP BY time
),
filled_data AS (
    SELECT
        --strftime(to_timestamp(hs.time), '%Y-%m-%d %H:%M') AS time,
        hs.time AS time,
        COALESCE (rh.price,
            LAST_VALUE(rh.price IGNORE NULLS) OVER (
                ORDER BY hs.time
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
        ) AS price,
        rh.volume AS volume

    FROM hourly_series as hs
    LEFT JOIN real_hourly AS rh ON hs.time = rh.time
),
-- НУЖЕН ПОДСЧЕТ AVG НА ДРУГИХ ДАННЫХ
data_to_insert AS(
    SELECT
        to_timestamp(time-10800) AS time,
        price AS price,
        volume AS volume,
        -- Скользящая средняя за 7 часов (по price)
        AVG(price) OVER (ORDER BY time ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma_7,
        -- Скользящая средняя за 14 часов
        AVG(price) OVER (ORDER BY time ROWS BETWEEN 13 PRECEDING AND CURRENT ROW) AS ma_14
    FROM filled_data
)
INSERT INTO eth_hour_mart SELECT * FROM data_to_insert;

SELECT
    strftime(time + INTERVAL '3 hours', '%Y-%m-%d %H:%M'),
    price,
    ma_7,
    ma_14
FROM eth_hour_mart
"""

query1 = """
    SELECT
        strftime(time + INTERVAL '3 hours', '%Y-%m-%d %H:%M'),
        CAST(EPOCH(time)-10800 AS BIGINT)
    FROM eth_hour_mart
"""

query1 = """
    SELECT
        --MIN(rc.timestamp) as min_ts,
        COALESCE(
            (
                SELECT
                    MAX(
                        CAST(
                            EPOCH(time) AS BIGINT
                            )
                        )
                FROM eth_hour_mart
            ),
            MIN(rc.timestamp)
        ) as min_ts,
        MAX(rc.timestamp) as max_ts
    FROM raw_candles AS rc
    JOIN symbol AS s ON rc.symbol_id = s.id
    WHERE s.name = 'ETH-USDT' AND s.timestamp_type  = 60
    """

with duckdb.connect(DB_FILE) as conn:
    result = conn.execute(query).fetchall()

for data in result[:]:
    print(data)

print(f'\nКоличество строк: {len(result)}')
