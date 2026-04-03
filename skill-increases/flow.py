"""
Имитация DAG из airflow
"""
import asyncio
import aiohttp
import duckdb
from datetime import datetime

from funcs_api import (
    validate_response,
    async_fetch_candles
    )

# START_TIMESTAMP = 1774990800 # 01.04.2026, 00:00:00
START_TIMESTAMP = 1775204400 # 03.04.2026, 11:21:00
GRANULARITY = 60  # секунды

params = [
    {
    'symbol': 'ETH-USDT',
    'time_start': START_TIMESTAMP,
    'time_end': None,
    'granularity': GRANULARITY
    },
    {
    'symbol': 'BTC-USDT',
    'time_start': START_TIMESTAMP,
    'time_end': None,
    'granularity': GRANULARITY
    },
]

# Список символов для загрузки
SYMBOLS = [
    {'name': 'ETH-USDT', 'timestamp_type': GRANULARITY},
    {'name': 'BTC-USDT', 'timestamp_type': GRANULARITY},
]

# data:
# api_fetch_time: {actual: bool, time: timestamp, flow_round: 1}

# 1 запрос последней даты из БД
# if setting['data']['api_fetch']['actual']:
#     print('Данные актуальны, запрос к БД будет пропущен')
# else:
#     pass
    # db_fetch_last_time()

# 2 скачиваем данные из api и сразу загружаем в БД

async def fetch_multiple(params):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for setting in params:

            tasks.append(async_fetch_candles(setting, session=session))
        results = await asyncio.gather(*tasks)
    return results

results = asyncio.run(fetch_multiple(params))

print(len(results))




# 4 запуск dbt -> построение витрин
# 1775200800
# 1775200680
#
# 1775200320 - 03.04.2026, 10:12:00
# 1775200380 - 03.04.2026, 10:13:00
# 1775200500 - 03.04.2026, 10:15:00
#
#
# 1775155560 - 02.04.2026, 21:46:00
# 1775155620 - 02.04.2026, 21:47:00
