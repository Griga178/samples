import requests
from datetime import datetime
from typing import List, Dict, Optional, Tuple

class CoinbaseAPI:
    """Минимальный клиент для публичных данных Coinbase

    1 получение списка всех инструментов
    2 получение свечей инструмента -> [ [1,2,3,4,5], ...]

    https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/
    """


    BASE_URL = "https://api.exchange.coinbase.com"

    def __init__(self):
        self.session = requests.Session()

    # ------------------------------------------------------------------
    # 1. Список доступных торговых пар (символов)
    # ------------------------------------------------------------------
    def get_available_products(self, base_currency: Optional[str] = None, quote_currency: Optional[str] = None) -> List[Dict]:
        """
        Возвращает список всех торговых пар (продуктов) Coinbase.
        Если указан base_currency/quote_currency (например 'USD'),
        фильтрует по валюте котировки.
        """

        url = f"{self.BASE_URL}/products"
        response = self.session.get(url)
        response.raise_for_status()
        data = response.json()

        products = []
        for item in data:
            # данные приходят как {"id": "BTC-USD", "base_currency": "BTC", "quote_currency": "...", ...}
            products.append({
                "symbol": f"{item['id']}",
                "base_currency": item['base_currency'],
                "quote_currency": item['quote_currency']
            })

        if quote_currency:
            products = [p for p in products if p["quote_currency"] == quote_currency.upper()]

        if base_currency:
            products = [p for p in products if p["base_currency"] == base_currency.upper()]

        return products

    # ------------------------------------------------------------------
    # 2. Текущая цена символа
    # ------------------------------------------------------------------
    def get_current_price(self, symbol: str) -> float:
        """
        Получает текущую цену для торговой пары (например 'BTC-USD').
        """
        # Публичный эндпоинт для спот-цены
        url = f"{self.BASE_URL}/products/{symbol}/book"
        response = self.session.get(url)
        response.raise_for_status()
        price = float(response.json()["bids"][0][0])
        return price

    # ------------------------------------------------------------------
    # 3. Исторические свечи (OHLC) за период
    # ------------------------------------------------------------------
    def get_historical_prices(self, symbol: str,
                              granularity: int = 3600,
                              start: Optional[str] = None,
                              end: Optional[str] = None) -> List[Dict]:
        """
        Возвращает исторические свечи для символа.
        granularity: 60 (1min), 300 (5min), 900 (15min), 3600 (1hour), 21600 (6hour), 86400 (1day)
        start, end: ISO даты, например '2024-01-01T00:00:00Z'
        """
        # Используем Advanced API эндпоинт (публичный, не требует ключей)
        url = f"{self.BASE_URL}/products/{symbol}/candles"
        params = {"granularity": granularity}
        if start:
            params["start"] = start
        if end:
            params["end"] = end

        response = self.session.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        # Формируем список свечей в привычном формате
        candles = []
        for candle in data:
            candles.append({
                "timestamp": candle[0],
                "low": float(candle[1]),
                "high": float(candle[2]),
                "open": float(candle[3]),
                "close": float(candle[4]),
                "volume": float(candle[5])
            })
        return candles

# ------------------------------------------------------------------
# Пример использования
# ------------------------------------------------------------------
if __name__ == "__main__":
    api = CoinbaseAPI()

    # # 1. Получить все пары
    # products = api.get_available_products()
    # print(f"Доступно пар всего: {len(products)}")
    # print("Первые 5:", [p["symbol"] for p in products[:5]])
    # # 1.1 Получить все пары, измеряемые в USD
    # products = api.get_available_products(quote_currency="USD")
    # print(f"Доступно пар в валюте USD: {len(products)}")
    # print("Первые 5:", [p["symbol"] for p in products[:5]])
    # # 1.2 Получить все пары в USD
    # products = api.get_available_products(base_currency="BTC")
    # print(f"Доступно пар с базой BTC: {len(products)}")
    # print("Первые 5:", [p["symbol"] for p in products[:5]])


    # 2. Получить часовые свечи за последние 24 часа
    candles = api.get_historical_prices("BTC-USD", granularity=60, start='1775000040', end='1775001040')
    print(f"\nЗагружено свечей: {len(candles)}")
    if candles:
        print(datetime.fromtimestamp(candles[0]['timestamp']), candles[0])
        print(datetime.fromtimestamp(candles[-1]['timestamp']), candles[-1])
        # print("Последняя свеча:", candles[-1])
        # for c in candles[:5]:
        #     print(datetime.fromtimestamp(c['timestamp']), c['close'])

    print(api.get_current_price("BTC-USD"))
