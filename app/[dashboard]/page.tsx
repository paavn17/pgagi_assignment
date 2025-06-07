'use client';

import News from '@/components/news';
import StockDashboard from '@/components/stocks';
import WeatherPage from '@/components/weather';
import { useState } from 'react';

// Type definitions
type Tab = 'weather' | 'news' | 'stocks';

interface TabConfig {
  id: Tab;
  label: string;
  component: JSX.Element;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('weather');

  // Configuration for tabs - makes it easy to add/remove tabs
  const tabs: TabConfig[] = [
    {
      id: 'weather',
      label: 'Weather',
      component: <WeatherPage />,
    },
    {
      id: 'news',
      label: 'News',
      component: <News />,
    },
    {
      id: 'stocks',
      label: 'Stocks',
      component: <StockDashboard />,
    },
  ];

  // Find the active tab component
  const activeComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  // Tab button component for reusability
  const TabButton = ({
    tab,
    isMobile = false,
  }: {
    tab: TabConfig;
    isMobile?: boolean;
  }) => (
    <button
      onClick={() => setActiveTab(tab.id)}
      className={`
        cursor-pointer 
        ${isMobile ? 'px-4 py-2 rounded-full text-xs sm:text-sm' : 'w-full text-left px-4 py-2 rounded-lg text-sm sm:text-base'}
        font-medium transition-all duration-200 transform hover:scale-105
        ${
          activeTab === tab.id
            ? isMobile
              ? 'bg-white text-zinc-900'
              : 'bg-zinc-700 text-white font-semibold'
            : isMobile
            ? 'text-gray-400 hover:text-white'
            : 'text-gray-400 hover:text-gray-300'
        }
      `}
      aria-label={`Show ${tab.label} dashboard`}
      aria-current={activeTab === tab.id ? 'page' : undefined}
    >
      {tab.label}
    </button>
  );

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-6 left-8 bottom-6 w-50 bg-zinc-800 rounded-3xl p-6 flex flex-col gap-20 z-50 shadow-xl">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
          Dashboard
        </h2>

        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => (
            <TabButton key={`desktop-${tab.id}`} tab={tab} />
          ))}
        </nav>
      </aside>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-800/70 backdrop-blur-md rounded-full px-6 py-3 flex gap-6 z-50 shadow-xl border border-zinc-700/50">
        {tabs.map((tab) => (
          <TabButton key={`mobile-${tab.id}`} tab={tab} isMobile />
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="w-full lg:ml-48 h-full overflow-y-auto">
        <div className="h-full w-full bg-zinc-900 rounded-xl shadow-inner">
          {activeComponent}
        </div>
      </main>
    </div>
  );
}