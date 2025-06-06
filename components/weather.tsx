'use client';

import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Title,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Title
);

// Plugin to show values above bars and points
const dataLabelPlugin = {
  id: 'valueOnTop',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar: any, index: number) => {
        const value = dataset.data[index];
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(value, bar.x, bar.y - 5);
      });
    });
  },
};
ChartJS.register(dataLabelPlugin);

export default function WeatherPage() {
  const [city, setCity] = useState('Visakhapatnam');
  const [inputCity, setInputCity] = useState('Visakhapatnam');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const resCurrent = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
      );
      const resForecast = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`
      );
      if (!resCurrent.ok || !resForecast.ok) throw new Error('City not found');

      const current = await resCurrent.json();
      const forecast = await resForecast.json();
      setData({ current, forecast });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const handleSearch = () => {
    if (inputCity.trim() !== '') {
      setCity(inputCity.trim());
    }
  };

  const getRainChances = () => {
    const result: { [key: string]: number[] } = {};
    data?.forecast?.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      const rain = item.rain?.['3h'] || 0;
      if (!result[date]) result[date] = [];
      result[date].push(rain);
    });

    return Object.keys(result)
      .slice(1, 4)
      .map((date) => {
        const sum = result[date].reduce((a, b) => a + b, 0);
        const avg = (sum / result[date].length) * 10;
        return { date, chance: Math.min(100, Math.round(avg)) };
      });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-4 max-h-screen overflow-y-auto">
      {/* Search Box */}
      <div className="mb-4 flex flex-col md:flex-row items-center gap-3">
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          placeholder="Enter city name"
          className="px-4 py-2 border rounded-lg shadow w-full md:w-1/3"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-center py-4">Loading...</p>}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {data?.current && (
        <div className="space-y-4">
          {/* Top Section - Current Weather and Bar Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Weather Data - Left Side */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                Weather in {data.current.name}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">🌡️</span>
                    <div>
                      <p className="text-sm text-gray-500">Temperature</p>
                      <p className="font-bold">{data.current.main.temp}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">💨</span>
                    <div>
                      <p className="text-sm text-gray-500">Wind</p>
                      <p className="font-bold">{data.current.wind.speed} m/s</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">🌥️</span>
                    <div>
                      <p className="text-sm text-gray-500">Condition</p>
                      <p className="font-bold capitalize">{data.current.weather[0].description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">💧</span>
                    <div>
                      <p className="text-sm text-gray-500">Humidity</p>
                      <p className="font-bold">{data.current.main.humidity}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature Bar Chart - Right Side */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2">Temperature Metrics</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: ['Current', 'Feels Like', 'Min', 'Max'],
                    datasets: [
                      {
                        label: 'Temperature (°C)',
                        data: [
                          data.current.main.temp,
                          data.current.main.feels_like,
                          data.current.main.temp_min,
                          data.current.main.temp_max,
                        ],
                        backgroundColor: ['#60A5FA', '#818CF8', '#34D399', '#FBBF24'],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        min: Math.min(
                          data.current.main.temp_min,
                          data.current.main.feels_like
                        ) - 5,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Section - Hourly Forecast and Rain Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hourly Forecast - 65% width (2 columns) */}
            <div className="bg-white p-4 rounded-xl shadow md:col-span-2">
              <h3 className="text-lg font-semibold mb-2">
                🌡️ Hourly Forecast (Next 24 hrs)
              </h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: data.forecast.list
                      .slice(0, 8)
                      .map((item: any) => item.dt_txt.slice(11, 16)),
                    datasets: [
                      {
                        label: 'Temp (°C)',
                        data: data.forecast.list
                          .slice(0, 8)
                          .map((item: any) => item.main.temp),
                        borderColor: '#3B82F6',
                        backgroundColor: '#BFDBFE',
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 6,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>

            {/* Rain Prediction - 35% width (1 column) */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2">
                🌧️ Rain Prediction (Next 3 Days)
              </h3>
              <div className="space-y-4 mt-4">
                {getRainChances().map((day) => (
                  <div key={day.date} className="flex flex-col">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="font-bold">{day.chance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${day.chance}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}