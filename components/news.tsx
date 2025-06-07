'use client';

import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiClock, FiRefreshCw } from 'react-icons/fi';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

const categories = [
  'general',
  'business',
  'entertainment',
  'health',
  'science',
  'sports',
  'technology',
];


const NewsHeader = () => (
  <div className="text-center mb-6 sm:mb-8">
    <h1 className="text-2xl sm:text-3xl font-bold text-white">📰 Latest News</h1>
    <p className="mt-2 text-sm sm:text-base text-gray-400">
      Stay updated with the latest headlines
    </p>
  </div>
);

const CategorySelector = ({
  selectedCategory,
  setSelectedCategory,
}: {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}) => (
  <div className="flex flex-wrap gap-2 mb-6 justify-center">
    {categories.map((category) => (
      <button
        key={category}
        onClick={() => setSelectedCategory(category)}
        className={`cursor-pointer px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition ${
          selectedCategory === category
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
        } capitalize`}
      >
        {category}
      </button>
    ))}
  </div>
);

const RefreshButton = ({
  handleRefresh,
  refreshing,
}: {
  handleRefresh: () => void;
  refreshing: boolean;
}) => (
  <div className="flex justify-end mb-6">
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition"
    >
      <FiRefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  </div>
);

const ErrorMessage = ({ error }: { error: string }) => (
  <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 sm:p-4 rounded-lg mb-6 text-xs sm:text-sm">
    {error}
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ArticleCard = ({ article }: { article: Article }) => (
  <div className="bg-zinc-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow">
    {article.urlToImage && (
      <img
        src={article.urlToImage}
        alt={article.title}
        className="w-full h-40 sm:h-48 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://via.placeholder.com/400x200?text=No+Image';
        }}
      />
    )}
    <div className="p-4 sm:p-5 flex flex-col flex-grow">
      <div className="flex-grow">
        <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 line-clamp-2">
          {article.title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-3">
          {article.description}
        </p>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2 sm:mb-3">
          <span className="text-[0.65rem] sm:text-xs">{article.source.name}</span>
          <span className="flex items-center gap-1 text-[0.65rem] sm:text-xs">
            <FiClock className="w-3 h-3" />
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium inline-flex items-center"
        >
          Read full story
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  </div>
);

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [refreshing, setRefreshing] = useState(false);

const fetchNews = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get<{ articles: Article[] }>(
        `https://newsapi.org/v2/top-headlines?category=${selectedCategory}&country=us&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`
      );
      setArticles(response.data.articles);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching news:', err.response?.data || err.message);

      setError('Failed to fetch news. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchNews();
  };



  return (
    <div className="min-h-screen bg-zinc-900 text-white px-6 sm:px-10 md:px-16 lg:px-20 py-6">
      <div className="max-w-7xl mx-auto">
        <NewsHeader />
        <CategorySelector
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <RefreshButton handleRefresh={handleRefresh} refreshing={refreshing} />
        {error && <ErrorMessage error={error} />}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-6">
            {articles.map((article, index) => (
              <ArticleCard key={index} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
