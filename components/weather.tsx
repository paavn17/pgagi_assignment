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
  WiSunrise,
  WiSunset,
  WiBarometer,
  WiDayHaze,
} from 'react-icons/wi';
import { FiDroplet, FiClock } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Title
);

// Data label plugin for charts
const dataLabelPlugin = {
  id: 'valueOnTop',
 afterDatasetsDraw(chart: ChartJS) {
  const { ctx } = chart;

  chart.data.datasets.forEach((dataset, datasetIndex) => {
    const meta = chart.getDatasetMeta(datasetIndex);
    meta.data.forEach((bar, index) => {
      const value = dataset.data[index] as number;

      if (!ctx || !bar) return;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), bar.x, bar.y - 5);
    });
  });
}

};
ChartJS.register(dataLabelPlugin);

// Weather stat component
interface WeatherStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const WeatherStat = ({ icon, label, value }: WeatherStatProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800">
    {icon}
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

// Temperature chart component
const TemperatureChart = ({ current }: { current: any }) => (
  <div className="h-64">
    <Bar
      data={{
        labels: ['Current', 'Feels Like', 'Min', 'Max'],
        datasets: [
          {
            label: 'Temperature (°C)',
            data: [
              current.main.temp,
              current.main.feels_like,
              current.main.temp_min,
              current.main.temp_max,
            ],
            backgroundColor: ['#60A5FA', '#818CF8', '#34D399', '#FBBF24'],
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            min: Math.min(current.main.temp_min, current.main.feels_like) - 5,
            ticks: { color: '#ccc' },
          },
          x: { ticks: { color: '#ccc' } },
        },
      }}
    />
  </div>
);

// Hourly forecast chart component
const HourlyForecastChart = ({ forecast }: { forecast: any }) => (
  <div className="h-64">
    <Line
      data={{
        labels: forecast.list
          .slice(0, 8)
          .map((item: any) => item.dt_txt.slice(11, 16)),
        datasets: [
          {
            label: 'Temp (°C)',
            data: forecast.list.slice(0, 8).map((item: any) => item.main.temp),
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
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#ccc' } },
          y: { ticks: { color: '#ccc' } },
        },
      }}
    />
  </div>
);

// Rain prediction component
const RainPrediction = ({ forecast }: { forecast: any }) => {
  const getRainChances = () => {
    const result: { [key: string]: number[] } = {};
    forecast.list.forEach((item: any) => {
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
  );
};

// Search component
const SearchBar = ({
  inputCity,
  setInputCity,
  handleSearch,
}: {
  inputCity: string;
  setInputCity: (value: string) => void;
  handleSearch: () => void;
}) => (
  <div className="mb-4 flex flex-col md:flex-row items-center gap-3">
    <input
      type="text"
      value={inputCity}
      onChange={(e) => setInputCity(e.target.value)}
      placeholder="Enter city name"
      className="px-4 py-2 border border-zinc-700 bg-zinc-800 rounded-lg shadow w-full md:w-1/3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
    />
    <button
      onClick={handleSearch}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg w-full md:w-auto transition duration-300 hover:bg-blue-700 shadow cursor-pointer"
    >
      Search
    </button>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Main weather page component
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

  const weatherStats = [
    {
      icon: <WiThermometer className="text-4xl text-blue-400" />,
      label: 'Temp',
      value: `${data?.current?.main.temp}°C`,
    },
    {
      icon: <WiStrongWind className="text-4xl text-blue-400" />,
      label: 'Wind',
      value: `${data?.current?.wind.speed} m/s`,
    },
    {
      icon: <WiHumidity className="text-4xl text-blue-400" />,
      label: 'Humidity',
      value: `${data?.current?.main.humidity}%`,
    },
    {
      icon: <WiCloudy className="text-4xl text-blue-400" />,
      label: 'Clouds',
      value: `${data?.current?.clouds.all}%`,
    },
    {
      icon: <WiSunrise className="text-4xl text-yellow-400" />,
      label: 'Sunrise',
      value: data?.current ? new Date(data.current.sys.sunrise * 1000).toLocaleTimeString() : '',
    },
    {
      icon: <WiSunset className="text-4xl text-orange-400" />,
      label: 'Sunset',
      value: data?.current ? new Date(data.current.sys.sunset * 1000).toLocaleTimeString() : '',
    },
    {
      icon: <WiBarometer className="text-4xl text-pink-400" />,
      label: 'Pressure',
      value: `${data?.current?.main.pressure} hPa`,
    },
    {
      icon: <WiDayHaze className="text-4xl text-gray-300" />,
      label: 'Visibility',
      value: `${data?.current?.visibility / 1000} km`,
    },
  ];

  return (
    <div className="bg-zinc-900 min-h-screen h-auto overflow-y-auto text-white p-4 sm:p-10 md:p-10 lg:p-20">
      <SearchBar inputCity={inputCity} setInputCity={setInputCity} handleSearch={handleSearch} />

      {loading && <p className="text-center py-4"><LoadingSpinner/></p>}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {!data && !loading && !error && (
        <p className="text-center text-gray-400">Please search for a city to view weather.</p>
      )}

      {data?.current && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-white mb-2">
                Weather in {data.current.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {weatherStats.map((stat, i) => (
                  <WeatherStat key={i} icon={stat.icon} label={stat.label} value={stat.value} />
                ))}
              </div>
            </div>

            <div className="bg-[#2C2C2E] p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2 text-white">Temperature Metrics</h3>
              <TemperatureChart current={data.current} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2C2C2E] p-4 rounded-xl shadow md:col-span-2">
              <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                <FiClock className="text-blue-400" /> Hourly Forecast (Next 24 hrs)
              </h3>
              <HourlyForecastChart forecast={data.forecast} />
            </div>

            <div className="bg-[#2C2C2E] p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                <FiDroplet className="text-blue-400" /> Rain Prediction (Next 3 Days)
              </h3>
              <RainPrediction forecast={data.forecast} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}