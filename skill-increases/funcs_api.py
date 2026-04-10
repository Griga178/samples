import requests
import asyncio
import aiohttp
from typing import List, Optional
import numbers
import time
from collections import defaultdict

def api_fetch_candles(setting: dict) -> List[List] :
    """Обязтельные: symbol и granularity
        возвращает "сырой" список списков - рыночные свечи
        [int, float, float, float, float, float]

        Особенности:
        - timezone - отправителя запроса (+3 UTC)
        - задержка около 4 минут
        - часто есть пропуски свечей, повторный точечный запрос не помогает
        - ответ содержит time_start и time_end
        - сортировка от time_end до time_start
        - если time_end из будущего ошибок нет
    """

    symbol = setting.get('symbol')
    time_start = setting.get('time_start')
    time_end = setting.get('time_end')
    granularity = setting.get('granularity')

    if not symbol:
        raise ValueError("api_fetch: не указан 'symbol'")

    if not granularity:
        raise ValueError("api_fetch: не указан 'granularity'")

    params = {"granularity": granularity}

    if time_start:
        params["start"] = time_start
    if time_end:
        params["end"] = time_end

    session = requests.Session()
    response = session.get(
        f"https://api.exchange.coinbase.com/products/{symbol}/candles",
        params=params
        )
    response.raise_for_status()
    data = response.json()
    return data

async def async_fetch_candles(setting: dict, session: aiohttp.ClientSession) -> dict:
    """
    Асинхронная версия api_fetch_candles.
    Обязательные параметры в setting: symbol, granularity.
    Опционально: time_start, time_end.

    v2: 1 Добавляем semaphore, что бы ограничить кол-во одновременных
        запросов до 10 шт (MAX_CONCURRENT)
        2

    """
    MAX_CONCURRENT = 10
    MAX_RETRIES = 5
    BASE_DELAY = 1

    async with asyncio.Semaphore(MAX_CONCURRENT):
        id = setting.get('id')
        symbol = setting.get('symbol')
        time_start = setting.get('time_start')
        time_end = setting.get('time_end')
        granularity = setting.get('granularity')

        if not symbol:
            raise ValueError("async_fetch_candles: не указан 'symbol'")
        if not granularity:
            raise ValueError("async_fetch_candles: не указан 'granularity'")

        params = {"granularity": granularity}
        if time_start is not None:
            params["start"] = time_start
        if time_end is not None:
            params["end"] = time_end

        url = f"https://api.exchange.coinbase.com/products/{symbol}/candles"
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with session.get(url, params=params) as resp:
                    if resp.status == 429:
                        # Получаем время ожидания из заголовка или используем экспоненту
                        retry_after = resp.headers.get('Retry-After')
                        print(retry_after)
                        if retry_after:
                            wait = int(retry_after)
                        else:
                            wait = BASE_DELAY * (2 ** (attempt - 1))
                        print(f"429 для {symbol}, попытка {attempt}, ждём {wait} сек...")
                        await asyncio.sleep(wait)
                        continue  # повторяем запрос
                    resp.raise_for_status()
                    data = await resp.json()
                    return {
                        'id': setting.get('id'),
                        'symbol': symbol,
                        'candles': data
                    }
            except aiohttp.ClientError as e:
                # Другие ошибки (сеть, таймаут) тоже можно повторить, но для простоты пробрасываем
                if attempt == MAX_RETRIES:
                    raise
                wait = BASE_DELAY * (2 ** (attempt - 1))
                print(f"Ошибка {e} для {symbol}, повтор через {wait} сек...")
                await asyncio.sleep(wait)
        # async with session.get(url, params=params) as response:
        #     response.raise_for_status()
        #     data = await response.json()
        #     return {'id': id, 'symbol': symbol, 'candles': data}


def validate_response(data: list, setting: dict):
    """ Сортировка, проверка на заполнение """
    time_start = setting.get('time_start')
    time_end = setting.get('time_end')
    granularity = setting.get('granularity')

    if not time_start or not time_end or not granularity:
        raise ValueError(f"check_miss_timestamp не хватает аргументов {setting}")

    data = filter_invalid_candles(data)
    if data:
        # сортировка от time_start -> time_end
        data.sort(key=lambda x: x[0])

        return data
    else:
        return False

def check_miss_timestamp(data: list, setting: dict):
    """проверка на пропуски свечей - не используем"""
    time_start = setting.get('time_start')
    time_end = setting.get('time_end')
    granularity = setting.get('granularity')

    if not time_start or not time_end or not granularity:
        raise ValueError(f"check_miss_timestamp не хватает аргументов {setting}")

    # генерируем список ожидаемых дат
    current_timestamp = time_start
    expected_timestamps = set()
    while current_timestamp <= time_end:
        expected_timestamps.add(current_timestamp)
        current_timestamp += granularity

    # проверяем наличие этих дат в response
    # полученные даты
    response_timestamps = set([i[0] for i in data])
    # пропущенные даты
    miss_timestaps = expected_timestamps - response_timestamps

    return miss_timestaps

def fill_missing_candles(data: List[List], granularity: int) -> List[List]:
    """
    Заполняет пропуски между свечами, интерполируя значения.
    data: список свечей [timestamp, open, high, low, close, volume]
    granularity: шаг времени в секундах между свечами
    возвращает новый список свечей с заполненными пропусками
    """
    if len(data) < 2:
        return data

    filled = []
    for i in range(len(data) - 1):
        curr = data[i]
        next_ = data[i + 1]
        curr_ts, curr_o, curr_h, curr_l, curr_c, curr_v = curr
        next_ts, next_o, next_h, next_l, next_c, next_v = next_

        # Добавляем текущую свечу
        filled.append(curr)

        # Вычисляем количество пропущенных интервалов
        delta = next_ts - curr_ts
        if delta <= granularity:
            continue

        # Количество шагов, которые нужно вставить (исключая границы)
        steps = delta // granularity
        # Если деление не целое, округлим вниз (обычно timestamp должны быть кратны шагу)
        # Вставим steps-1 свечей между curr и next
        for step in range(1, steps):
            t = curr_ts + step * granularity
            # Линейная интерполяция
            ratio = step / steps
            o = curr_o + (next_o - curr_o) * ratio
            h = curr_h + (next_h - curr_h) * ratio
            l = curr_l + (next_l - curr_l) * ratio
            c = curr_c + (next_c - curr_c) * ratio
            v = curr_v + (next_v - curr_v) * ratio
            filled.append([t, o, h, l, c, v])

    # Добавляем последнюю свечу
    filled.append(data[-1])
    return filled

def filter_invalid_candles(candles):
    """
    Проверяет список свечей на корректность.
    Удаляет строки с неверной длиной, неправильными типами или отсутствующими значениями.
    Печатает информацию об удалённых строках.

    Параметры:
        candles: list of lists, каждая свеча = [timestamp, open, high, low, close, volume]

    Возвращает:
        list: отфильтрованный список свечей
    """
    valid_candles = []
    for i, candle in enumerate(candles):
        if len(candle) != 6:
            print(f"Удалена свеча #{i} (неверная длина: {len(candle)}): {candle}")
            continue

        # Проверяем каждый элемент
        valid = True
        # timestamp может быть int или float
        if not isinstance(candle[0], (int, float)) or candle[0] is None:
            print(f"Удалена свеча #{i} (timestamp не число или None): {candle}")
            continue

        # Проверяем open, high, low, close, volume - должны быть числами (int или float) и не None
        for j, val in enumerate(candle[1:], start=1):
            if not isinstance(val, numbers.Number) or val is None:
                print(f"Удалена свеча #{i} (элемент {j} не число или None: {val}): {candle}")
                valid = False
                break

        if valid:
            valid_candles.append(candle)

    return valid_candles


def calculate_intervals(symbols_data, current_time=None, limit=300):
    """
    Рассчитывает интервалы для загрузки данных с биржи с учётом лимита в 300 свечей.

    Параметры:
    - symbols_data: список словарей, каждый содержит:
        'name' (str), 'timestamp_type' (int, гранулярность в секундах),
        'id' (int), 'time_start' (int, время последней свечи в БД)
    - current_time: текущее время в Unix секундах (если None, берётся текущее)

    Возвращает:
    Список словарей с полями:
        'symbol', 'time_start', 'time_end', 'granularity'
    """
    if current_time is None:
        current_time = int(time.time())

    intervals = []
    for sym in symbols_data:
        id = sym['id']
        name = sym['name']
        gran = sym['timestamp_type']
        last = sym['time_start']          # время последней свечи в БД
        next_start = last + gran          # первая свеча, которой ещё нет

        while next_start < current_time:
            start = next_start
            end = start + limit * gran      # добавляем 300 свечей
            if end > current_time:
                end = current_time
            intervals.append({
                'id': id,
                'symbol': name,
                'time_start': start,
                'time_end': end,
                'granularity': gran
            })
            next_start = end

    return intervals

def prepare_candles_for_db(responses):
    """
    responses: список словарей, каждый содержит:
        - 'id': int (symbol_id)
        - 'candles': list[list] — свечи [timestamp, open, high, low, close, volume]
    Возвращает список кортежей для вставки в БД, отсортированных по (symbol_id, timestamp).
    """
    # Собираем свечи по symbol_id
    data = defaultdict(list)
    for resp in responses:
        sid = resp['id']
        candles = resp['candles']
        data[sid].extend(candles)

    # Сортируем свечи для каждого symbol_id по timestamp (первый элемент)
    for sid in data:
        data[sid].sort(key=lambda x: x[0])

    # Формируем плоский список кортежей
    result = []
    for sid, candles in data.items():
        for candle in candles:
            # candle = [timestamp, open, high, low, close, volume]
            result.append((sid, candle[0], candle[1], candle[2], candle[3], candle[4], candle[5]))

    return result
