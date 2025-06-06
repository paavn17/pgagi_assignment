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

type StockData = {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  high: string;
  low: string;
  volume: string;
  latestTradingDay: string;
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

const Stocks = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [timeRange, setTimeRange] = useState('1month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch real-time quote
      const quoteRes = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY}`
      );
      const quoteData = await quoteRes.json();
      
      if (quoteData['Global Quote']) {
        const globalQuote = quoteData['Global Quote'];
        setStockData({
          symbol: globalQuote['01. symbol'],
          price: globalQuote['05. price'],
          change: globalQuote['09. change'],
          changePercent: globalQuote['10. change percent'],
          high: globalQuote['03. high'],
          low: globalQuote['04. low'],
          volume: globalQuote['06. volume'],
          latestTradingDay: globalQuote['07. latest trading day']
        });
      } else {
        throw new Error('No stock data found');
      }

      // Fetch historical data
      let functionName = 'TIME_SERIES_DAILY';
      let outputSize = timeRange === '1year' ? 'full' : 'compact';

      const historicalRes = await fetch(
        `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&outputsize=${outputSize}&apikey=${process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY}`
      );
      const historicalData = await historicalRes.json();
      
      if (historicalData['Time Series (Daily)']) {
        setHistoricalData(historicalData['Time Series (Daily)']);
      } else {
        throw new Error('No historical data found');
      }
    } catch (err) {
      setError('Failed to fetch stock data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [symbol, timeRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSymbol(searchQuery.trim().toUpperCase());
    }
  };

  // Simplify chart data to show only start, middle, and end points
  const chartData = useMemo(() => {
    if (!historicalData) return { labels: [], datasets: [] };

    const dates = Object.keys(historicalData).reverse();
    const values = Object.values(historicalData).map(day => parseFloat(day['4. close'])).reverse();

    // Get start, middle, and end points
    const simplifiedDates = [];
    const simplifiedValues = [];
    
    if (dates.length > 0) {
      // Start point
      simplifiedDates.push(dates[0]);
      simplifiedValues.push(values[0]);
      
      // Middle point
      if (dates.length > 1) {
        const midIndex = Math.floor(dates.length / 2);
        simplifiedDates.push(dates[midIndex]);
        simplifiedValues.push(values[midIndex]);
      }
      
      // End point
      simplifiedDates.push(dates[dates.length - 1]);
      simplifiedValues.push(values[values.length - 1]);
    }

    return {
      labels: simplifiedDates,
      datasets: [
        {
          label: 'Closing Price',
          data: simplifiedValues,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5, // Make points visible
          pointBackgroundColor: '#3b82f6',
          borderWidth: 2
        }
      ]
    };
  }, [historicalData]);

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
        callbacks: {
          label: (context: any) => {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 5 // Limit number of x-axis labels
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
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

  // Calculate additional metrics
  const getAdditionalMetrics = () => {
    if (!historicalData) return null;
    
    const values = Object.values(historicalData).map(day => parseFloat(day['4. close']));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min).toFixed(2);
    
    return { min, max, range };
  };

  const additionalMetrics = getAdditionalMetrics();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Stock Market Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400">Real-time stock data and trends</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol (e.g., AAPL, MSFT)"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white w-full"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stockData && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Current Price</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                ${parseFloat(stockData.price).toFixed(2)}
              </p>
              <p className={`text-sm ${parseFloat(stockData.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockData.change} ({stockData.changePercent})
              </p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Daily Range</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                ${parseFloat(stockData.low).toFixed(2)} - ${parseFloat(stockData.high).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Spread: ${(parseFloat(stockData.high) - parseFloat(stockData.low)).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Volume</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {parseInt(stockData.volume).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stockData.latestTradingDay}
              </p>
            </div>
            
            {additionalMetrics && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Period Range</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  ${additionalMetrics.min.toFixed(2)} - ${additionalMetrics.max.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${additionalMetrics.range} range
                </p>
              </div>
            )}
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {['1week', '1month', '3months', '1year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {range.replace('1', '').replace('months', 'mo')}
              </button>
            ))}
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex-1 min-h-[400px]">
            {historicalData ? (
              <div className="w-full h-full">
                <Line data={chartData} options={options} />
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No chart data available</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
            <p>Symbol: {stockData.symbol}</p>
            <p>Last updated: {new Date(stockData.latestTradingDay).toLocaleDateString()}</p>
          </div>
        </>
      )}

      {!stockData && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-xl font-medium mb-2">Search for a stock symbol</h3>
          <p>Try AAPL, MSFT, GOOGL, or any other stock symbol</p>
        </div>
      )}
    </div>
  );
};

export default Stocks;