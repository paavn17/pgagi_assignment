"use client";

import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TrendingUp, Search } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SUPPORTED_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'ADBE', 'NVDA', 'META', 'NFLX', 'IBM', 'INTC', 'AMD'];

type StockData = {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  high: string;
  low: string;
  volume: string;
  latestTradingDay: string;
  companyName: string;
};

type HistoricalData = {
  [date: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  };
};

export default function StockDashboard() {
  const [symbol, setSymbol] = useState('MSFT');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [timeRange, setTimeRange] = useState('3months');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState(false);

  const getCompanyName = (symbol: string) => {
    const companyNames: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'ADBE': 'Adobe Inc.',
      'IBM': 'International Business Machines',
      'INTC': 'Intel Corporation',
      'AMD': 'Advanced Micro Devices'
    };
    return companyNames[symbol] || `${symbol} Inc.`;
  };

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY;
    setApiKeyValid(!!key && key !== 'demo');
  }, []);

  const fetchStockData = async () => {
    if (!apiKeyValid) {
      setError('Please add your Alpha Vantage API key to .env.local');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      if (!SUPPORTED_SYMBOLS.includes(symbol)) {
        throw new Error(`Supported symbols: ${SUPPORTED_SYMBOLS.join(', ')}`);
      }

      const API_KEY = process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY;

      // Fetch current quote
      const quoteRes = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
      );
      const quoteData = await quoteRes.json();
      
      if (quoteData['Global Quote']) {
        const globalQuote = quoteData['Global Quote'];
        setStockData({
          symbol: globalQuote['01. symbol'],
          companyName: getCompanyName(globalQuote['01. symbol']),
          price: globalQuote['05. price'],
          change: globalQuote['09. change'],
          changePercent: globalQuote['10. change percent'],
          high: globalQuote['03. high'],
          low: globalQuote['04. low'],
          volume: globalQuote['06. volume'],
          latestTradingDay: globalQuote['07. latest trading day']
        });
      } else if (quoteData['Note']) {
        throw new Error('API limit reached. Try again in 1 minute.');
      } else {
        throw new Error('No data found for this symbol.');
      }

      // Fetch historical data
      const historicalRes = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${
          timeRange === '1year' ? 'full' : 'compact'
        }&apikey=${API_KEY}`
      );
      const historicalData = await historicalRes.json();
      
      if (historicalData['Time Series (Daily)']) {
        setHistoricalData(historicalData['Time Series (Daily)']);
      } else if (historicalData['Note']) {
        console.warn('Historical data limit reached');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setStockData(null);
      setHistoricalData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKeyValid) {
      fetchStockData();
    }
  }, [symbol, timeRange, apiKeyValid]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newSymbol = searchQuery.trim().toUpperCase();
      if (SUPPORTED_SYMBOLS.includes(newSymbol)) {
        setSymbol(newSymbol);
        setSearchQuery('');
      } else {
        setError(`Invalid symbol. Supported: ${SUPPORTED_SYMBOLS.join(', ')}`);
      }
    }
  };

  const chartData = useMemo(() => {
    if (!historicalData) return { labels: [], datasets: [] };
    
    const now = new Date();
    const days = timeRange === '1week' ? 7 : timeRange === '1month' ? 30 : timeRange === '3months' ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const allData = Object.entries(historicalData)
      .filter(([date]) => new Date(date) >= cutoffDate)
      .map(([date, data]) => ({
        date,
        close: parseFloat(data['4. close']),
        volume: parseInt(data['5. volume'])
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sampleSize = 10;
    const step = Math.max(1, Math.floor(allData.length / sampleSize));
    const sampledData = [];
    
    for (let i = 0; i < allData.length; i += step) {
      sampledData.push(allData[i]);
      if (sampledData.length >= sampleSize) break;
    }

    return {
      labels: sampledData.map(item => item.date),
      datasets: [
        {
          label: 'Closing Price',
          data: sampledData.map(item => item.close),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          borderWidth: 2
        }
      ]
    };
  }, [historicalData, timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#111827',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`,
          title: (context: any) => new Date(context[0].label).toLocaleDateString()
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#6B7280',
          maxTicksLimit: 10,
          callback: (value: any, index: number) => {
            const date = new Date(chartData.labels[index]);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }
        },
        border: { display: false }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          callback: (value: any) => `$${value}`
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  const getCompanyLogo = (symbol: string) => {
    const logos: { [key: string]: JSX.Element } = {
      AAPL: <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">🍏</div>,
      MSFT: <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">MS</div>,
      GOOGL: <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">G</div>,
      AMZN: <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">A</div>,
      TSLA: <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">T</div>,
      META: <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">M</div>,
      NVDA: <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">N</div>,
      NFLX: <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">N</div>,
      ADBE: <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">Ai</div>,
      IBM: <div className="w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center">IBM</div>,
      INTC: <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">I</div>,
      AMD: <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center">A</div>
    };
    
    return logos[symbol] || (
      <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-lg">{symbol.charAt(0)}</span>
      </div>
    );
  };

  const formatPrice = (price: string | number) => {
    return `$${typeof price === 'string' ? parseFloat(price).toFixed(2) : price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {!apiKeyValid && (
          <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-400 px-4 py-3 rounded-lg mb-6">
            <div className="font-medium">Important:</div>
            <div>Get a free API key from Alpha Vantage and add it to .env.local</div>
            <a 
              href="https://www.alphavantage.co/support/#api-key" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline mt-2 inline-block"
            >
              Get API Key
            </a>
          </div>
        )}

        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-6">
            <div className="font-medium">Error:</div>
            <div>{error}</div>
            <div className="mt-2 text-sm">
              Supported symbols: {SUPPORTED_SYMBOLS.join(', ')}
            </div>
          </div>
        )}

        {stockData && !loading && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              {getCompanyLogo(stockData.symbol)}
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-white mb-1">
                  {stockData.companyName}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span>{formatPrice(stockData.price)} Current</span>
                  <span>•</span>
                  <span>Vol: {parseInt(stockData.volume).toLocaleString()}</span>
                  <span>•</span>
                  <span>{stockData.symbol} Symbol</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-light">{formatPrice(stockData.price)}</span>
                  <span className={`text-lg ${parseFloat(stockData.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stockData.change} ({stockData.changePercent})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Day Range</div>
                <div className="text-white font-medium">
                  {formatPrice(stockData.low)} - {formatPrice(stockData.high)}
                </div>
              </div>
              <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Volume</div>
                <div className="text-white font-medium">
                  {parseInt(stockData.volume).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Last Updated</div>
                <div className="text-white font-medium">
                  {new Date(stockData.latestTradingDay).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {['1week', '1month', '3months', '1year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {range === '1week' ? '1W' : range === '1month' ? '1M' : range === '3months' ? '3M' : '1Y'}
                </button>
              ))}
            </div>

            <div className=" rounded-xl p-6 border border-gray-800">
              {chartData.labels.length > 0 ? (
                <div className="h-80">
                  <Line data={chartData} options={options} />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart data unavailable</p>
                    <p className="text-sm">API rate limit may have been reached</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                <span>Powered by Alpha Vantage</span>
                <span>Real-time data</span>
              </div>
            </div>
          </div>
        )}

        {!stockData && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <TrendingUp className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-medium mb-2">Search for a stock symbol</h3>
            <p className="mb-4">Try one of these popular symbols:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUPPORTED_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSymbol(sym)}
                  className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}