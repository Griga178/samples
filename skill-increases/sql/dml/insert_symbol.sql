INSERT INTO symbol (name, timestamp_type)
VALUES ($name, $timestamp_type)
RETURNING id;
