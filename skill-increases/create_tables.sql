-- Файл: create_tables.sql

-- 1. Таблица символов
CREATE TABLE IF NOT EXISTS symbol (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    timestamp_type INTEGER NOT NULL   -- 1 = секунды, 2 = миллисекунды, и т.д.
);

-- 2. Основная таблица сырых свечей (колоночная)
CREATE TABLE IF NOT EXISTS raw_candles (
    symbol_id INTEGER NOT NULL,
    timestamp BIGINT NOT NULL,          -- универсальное целое (секунды/мс)
    open DOUBLE NOT NULL,
    high DOUBLE NOT NULL,
    low DOUBLE NOT NULL,
    close DOUBLE NOT NULL,
    volume DOUBLE NOT NULL,
    PRIMARY KEY (symbol_id, timestamp)
);

-- 3. Служебная таблица для быстрого доступа к последней свече каждого символа
CREATE TABLE IF NOT EXISTS temp (
    symbol_id INTEGER PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    open DOUBLE NOT NULL,
    high DOUBLE NOT NULL,
    low DOUBLE NOT NULL,
    close DOUBLE NOT NULL,
    volume DOUBLE NOT NULL
);
