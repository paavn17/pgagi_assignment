
'use client';
import { useState } from 'react';
import Weather from '@/components/weather';
import News from '@/components/news';
import Stocks from '@/components/stocks';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'weather' | 'news' | 'stocks'>('weather');

  const renderContent = () => {
  switch (activeTab) {
    case 'weather':
      return <Weather />; // Move text styles inside `<Weather>` if needed
    case 'news':
      return <News />;
    case 'stocks':
      return <Stocks />;
    default:
      console.error('Invalid tab:', activeTab);
      return <Weather />; // Fallback to a default tab
  }
  
};
  return (
    <div className="flex h-screen">
    
      <div className="w-[20%] bg-gray-800 text-white p-4 space-y-4">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <button
          onClick={() => setActiveTab('weather')}
          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 ${activeTab === 'weather' ? 'bg-gray-700' : ''}`}
        >
          Weather
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 ${activeTab === 'news' ? 'bg-gray-700' : ''}`}
        >
          News
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 ${activeTab === 'stocks' ? 'bg-gray-700' : ''}`}
        >
          Stocks
        </button>
      </div>

      <div className="w-[80%] p-6 bg-gray-100">
        {renderContent()}
      </div>
    </div>
  );
}
