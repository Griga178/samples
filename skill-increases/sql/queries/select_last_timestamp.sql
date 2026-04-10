WITH ranked_candles AS (
  SELECT
    s.id,
    s.name,
    s.name,
    c.timestamp,
    c.close,
    ROW_NUMBER() OVER (PARTITION BY c.symbol_id ORDER BY c.timestamp DESC) AS rn
  FROM symbol s
  JOIN raw_candles c ON s.id = c.symbol_id
)
SELECT id, name, timestamp, close
FROM ranked_candles
WHERE rn = 1;
