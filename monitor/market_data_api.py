#!/usr/bin/env python3
"""
Market Data API using Polygon
Provides historical market data for indices (SPY, QQQ, DIA, IWM)
"""
import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
import logging

# Add engine path to import common
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'engine'))
try:
    from data.common import POLYGON_API_KEY
except ImportError:
    print("Warning: Could not import POLYGON_API_KEY from data.common")
    POLYGON_API_KEY = os.getenv('POLYGON_API_KEY', '')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Angular frontend

POLYGON_BASE_URL = "https://api.polygon.io/v2"


def get_date_range(timeframe):
    """Get start and end dates based on timeframe"""
    from datetime import timezone
    import pytz

    # Get current time in ET
    et_tz = pytz.timezone('America/New_York')
    now_et = datetime.now(et_tz)
    end_date = datetime.now()

    if timeframe == '1d':
        # Get today's date at market open (9:30 AM ET)
        today_et = now_et.replace(hour=9, minute=30, second=0, microsecond=0)

        # If before market open, use previous trading day
        if now_et.hour < 9 or (now_et.hour == 9 and now_et.minute < 30):
            today_et = today_et - timedelta(days=1)

        # Convert to UTC for API
        start_date = today_et.astimezone(timezone.utc).replace(tzinfo=None)
        multiplier = 5  # 5-minute bars
        timespan = 'minute'
    elif timeframe == '5d':
        start_date = end_date - timedelta(days=5)
        multiplier = 15  # 15-minute bars
        timespan = 'minute'
    elif timeframe == '30d':
        start_date = end_date - timedelta(days=30)
        multiplier = 1  # 1-hour bars
        timespan = 'hour'
    else:
        start_date = end_date - timedelta(days=1)
        multiplier = 5
        timespan = 'minute'

    return start_date, end_date, multiplier, timespan


def fetch_polygon_data(symbol, start_date, end_date, multiplier, timespan):
    """Fetch aggregated bars from Polygon API"""
    try:
        # Format dates as YYYY-MM-DD
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')

        url = f"{POLYGON_BASE_URL}/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{start_str}/{end_str}"
        params = {
            'adjusted': 'true',
            'sort': 'asc',
            'limit': 50000,
            'apiKey': POLYGON_API_KEY
        }

        logger.info(f"Fetching {symbol} data from {start_str} to {end_str}")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()

        if data.get('status') != 'OK':
            logger.error(f"Polygon API error for {symbol}: {data.get('status')}")
            return []

        results = data.get('results', [])
        logger.info(f"Fetched {len(results)} bars for {symbol}")

        # Transform to our format
        bars = []
        for bar in results:
            bars.append({
                'timestamp': datetime.fromtimestamp(bar['t'] / 1000).isoformat(),
                'open': bar['o'],
                'high': bar['h'],
                'low': bar['l'],
                'close': bar['c'],
                'volume': bar['v']
            })

        return bars

    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {e}")
        return []


@app.route('/api/market/indices', methods=['GET'])
def get_indices():
    """Get market data for major indices"""
    try:
        timeframe = request.args.get('timeFrame', '1d')

        # Major market indices as ETFs
        symbols = ['SPY', 'QQQ', 'DIA', 'IWM']

        start_date, end_date, multiplier, timespan = get_date_range(timeframe)

        result = {
            'data': {}
        }

        for symbol in symbols:
            bars = fetch_polygon_data(symbol, start_date, end_date, multiplier, timespan)
            result['data'][symbol] = {
                'symbol': symbol,
                'timeFrame': timeframe,
                'bars': bars
            }

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in get_indices: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/market/symbols', methods=['GET'])
def get_symbols():
    """Get market data for specific symbols"""
    try:
        symbols_param = request.args.get('symbols', '')
        timeframe = request.args.get('timeFrame', '1d')

        if not symbols_param:
            return jsonify({'error': 'symbols parameter required'}), 400

        symbols = [s.strip() for s in symbols_param.split(',')]

        start_date, end_date, multiplier, timespan = get_date_range(timeframe)

        result = {
            'data': {}
        }

        for symbol in symbols:
            bars = fetch_polygon_data(symbol, start_date, end_date, multiplier, timespan)
            result['data'][symbol] = {
                'symbol': symbol,
                'timeFrame': timeframe,
                'bars': bars
            }

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in get_symbols: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'market-data-api'})


def get_db_connection():
    """Get database connection based on configuration"""
    import psycopg2

    # Use the global db_url set from command line args
    db_url = app.config.get('DB_URL')
    return psycopg2.connect(db_url)


@app.route('/api/symbols', methods=['GET'])
def get_available_symbols():
    """Get list of available symbols from minute_bars table"""
    try:
        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()

        # Query distinct symbols from minute_bars table
        cur.execute("""
            SELECT DISTINCT symbol
            FROM minute_bars
            ORDER BY symbol
        """)

        symbols = [row[0] for row in cur.fetchall()]

        cur.close()
        conn.close()

        return jsonify({'symbols': symbols})

    except Exception as e:
        logger.error(f"Error fetching symbols: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Market Data API using Polygon')
    parser.add_argument('--port', type=int, default=5002,
                       help='Port to run on (default: 5002)')
    parser.add_argument('--local', action='store_true',
                       help='Use local database instead of Azure')
    args = parser.parse_args()

    if not POLYGON_API_KEY:
        logger.error("POLYGON_API_KEY not found! Please set it in environment or data/common.py")
        sys.exit(1)

    # Set database URL based on --local flag
    if args.local:
        db_url = os.getenv('LOCAL_DATABASE_URL', 'postgresql://azure_pg_admin:temp123@localhost:5432/finAI')
        logger.info("Using local database")
    else:
        db_url = os.getenv('DATABASE_URL', 'postgresql://postgresadmin:6621a9db-1ad9-4abb-b50f-6cc95a728435@pg-smplfi.postgres.database.azure.com:5432/finAI')
        logger.info("Using Azure database")

    app.config['DB_URL'] = db_url

    logger.info(f"Starting Market Data API on port {args.port}...")
    logger.info(f"Using Polygon API")
    app.run(host='0.0.0.0', port=args.port, debug=False)
