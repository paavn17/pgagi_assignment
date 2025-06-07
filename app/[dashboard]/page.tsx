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
        return <Weather />;
      case 'news':
        return <News />;
      case 'stocks':
        return <Stocks />;
      default:
        return <Weather />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden relative">

      {/* Floating Sidebar with names only */}
      <div className="fixed  top-6 left-8 bottom-6 w-50 bg-zinc-800 rounded-3xl p-6 flex flex-col gap-4  z-50 shadow-xl ">

        <h2 className="text-xl font-bold text-white mb-4">Dashboard</h2>

        <button
          onClick={() => setActiveTab('weather')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
            activeTab === 'weather'
              ? 'bg-zinc-700 text-white font-semibold'
              : 'hover:bg-zinc-700 text-gray-400'
          }`}
        >
          Weather
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
            activeTab === 'news'
              ? 'bg-zinc-700 text-white font-semibold'
              : 'hover:bg-zinc-700 text-gray-400'
          }`}
        >
          News
        </button>

        <button
          onClick={() => setActiveTab('stocks')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
            activeTab === 'stocks'
              ? 'bg-zinc-700 text-white font-semibold'
              : 'hover:bg-zinc-700 text-gray-400'
          }`}
        >
          Stocks
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-48 w-full h-full overflow-y-auto">
        <div className="h-full w-full bg-zinc-900 rounded-xl shadow-inner p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
