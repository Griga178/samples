-- Файл: create_tables.sql

-- 0. Удаление, при необходимости
-- DROP TABLE IF EXISTS symbol;
-- DROP TABLE IF EXISTS raw_candles;

CREATE SEQUENCE IF NOT EXISTS symbol_id_seq START 1;

-- 1. Таблица символов
CREATE TABLE IF NOT EXISTS symbol (
    id INTEGER DEFAULT nextval('symbol_id_seq') PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    timestamp_type INTEGER NOT NULL -- 1 = секунды, 2 = миллисекунды, и т.д.
);

-- 2. Таблица сырых свечей - будут пропуски
CREATE TABLE IF NOT EXISTS raw_candles (
    symbol_id INTEGER NOT NULL,
    timestamp BIGINT NOT NULL,          -- универсальное целое (секунды)
    open DOUBLE NOT NULL,
    high DOUBLE NOT NULL,
    low DOUBLE NOT NULL,
    close DOUBLE NOT NULL,
    volume DOUBLE NOT NULL,
    PRIMARY KEY (symbol_id, timestamp)
);
