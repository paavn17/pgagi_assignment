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

import {
  WiThermometer,
  WiStrongWind,
  WiHumidity,
  WiCloudy,
} from 'react-icons/wi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Title
);

const dataLabelPlugin = {
  id: 'valueOnTop',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar: any, index: number) => {
        const value = dataset.data[index];
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(value, bar.x, bar.y - 5);
      });
    });
  },
};
ChartJS.register(dataLabelPlugin);

export default function WeatherPage() {
  const [city, setCity] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

  const fetchWeather = async (cityName: string) => {
    if (!cityName) return;
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
    if (city) fetchWeather(city);
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
    <div className="bg-zinc-900 min-h-screen p-10 h-auto overflow-y-auto text-white">
      {/* Search */}
      <div className="mb-4 flex flex-col md:flex-row items-center gap-3">
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          placeholder="Enter city name"
          className="px-4 py-2 border rounded-lg shadow w-full md:w-1/3  text-white placeholder-gray-400"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className=" text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-center py-4">Loading...</p>}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {!data && !loading && !error && (
        <p className="text-center text-gray-400">Please search for a city to view weather.</p>
      )}

      {data?.current && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#2C2C2E] p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-white mb-2">
                Weather in {data.current.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Weather Stats */}
                {[
                  {
                    icon: <WiThermometer className="text-3xl text-blue-400" />,
                    label: 'Temp',
                    value: `${data.current.main.temp}°C`,
                  },
                  {
                    icon: <WiStrongWind className="text-3xl text-blue-400" />,
                    label: 'Wind',
                    value: `${data.current.wind.speed} m/s`,
                  },
                  {
                    icon: <WiHumidity className="text-3xl text-blue-400" />,
                    label: 'Humidity',
                    value: `${data.current.main.humidity}%`,
                  },
                  {
                    icon: <WiCloudy className="text-3xl text-blue-400" />,
                    label: 'Clouds',
                    value: `${data.current.clouds.all}%`,
                  },
                  {
                    icon: <span className="text-2xl text-yellow-400">🌄</span>,
                    label: 'Sunrise',
                    value: new Date(data.current.sys.sunrise * 1000).toLocaleTimeString(),
                  },
                  {
                    icon: <span className="text-2xl text-orange-400">🌇</span>,
                    label: 'Sunset',
                    value: new Date(data.current.sys.sunset * 1000).toLocaleTimeString(),
                  },
                  {
                    icon: <span className="text-2xl">📈</span>,
                    label: 'Pressure',
                    value: `${data.current.main.pressure} hPa`,
                  },
                  {
                    icon: <span className="text-2xl">👁️</span>,
                    label: 'Visibility',
                    value: `${data.current.visibility / 1000} km`,
                  },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    {stat.icon}
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#2C2C2E] p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2 text-white">Temperature Metrics</h3>
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
                        ticks: { color: '#ccc' },
                      },
                      x: {
                        ticks: { color: '#ccc' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2C2C2E] p-4 rounded-xl shadow md:col-span-2">
              <h3 className="text-lg font-semibold mb-2 text-white">
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
                        borderColor: '#60A5FA',
                        backgroundColor: '#3B82F6',
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
                    scales: {
                      x: { ticks: { color: '#ccc' } },
                      y: { ticks: { color: '#ccc' } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-[#2C2C2E] p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2 text-white">
                🌧️ Rain Prediction (Next 3 Days)
              </h3>
              <div className="space-y-4 mt-4">
                {getRainChances().map((day) => (
                  <div key={day.date} className="flex flex-col">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-300">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </span>
                      <span className="font-bold text-white">{day.chance}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
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
