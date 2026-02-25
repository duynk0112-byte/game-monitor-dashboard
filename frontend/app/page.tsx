'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Gamepad2, TrendingUp, Clock, Zap, RefreshCw, Search, Flame, Star, Sun, Moon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  category?: string;
  image?: string;
}

interface FeedResponse {
  source: string;
  items: NewsItem[];
  fetchedAt: string;
}

const FEED_SOURCES = [
  { id: 'kotaku', name: 'Kotaku', icon: '🎮' },
  { id: 'ign', name: 'IGN', icon: '🔥' },
  { id: 'pcgamer', name: 'PC Gamer', icon: '💻' },
  { id: 'polygon', name: 'Polygon', icon: '📐' },
  { id: 'gamespot', name: 'GameSpot', icon: '🎯' },
  { id: 'indiedb', name: 'IndieDB', icon: '🕹️' },
  { id: 'itch', name: 'Itch.io', icon: '🐱' },
  { id: 'rockpapershotgun', name: 'Rock Paper Shotgun', icon: '🔫' },
  { id: 'techcrunch', name: 'TechCrunch', icon: '⚡' },
] as const;

export default function Home() {
  const [activeSource, setActiveSource] = useState<string>('kotaku');
  const [feeds, setFeeds] = useState<Record<string, FeedResponse>>({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

  // Theme toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const fetchFeed = async (sourceId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/feeds/${sourceId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFeeds(prev => ({ ...prev, [sourceId]: data }));
      setLastFetch(new Date(data.fetchedAt));
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFeed(activeSource);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchFeed(activeSource);
    const interval = setInterval(() => {
      fetchFeed(activeSource);
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [activeSource]);

  const activeFeed = feeds[activeSource];
  const activeSourceConfig = FEED_SOURCES.find(s => s.id === activeSource);

  const filteredItems = activeFeed?.items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const timeAgo = lastFetch 
    ? `${Math.floor((Date.now() - new Date(lastFetch).getTime()) / 60000)} phút trước`
    : 'Updating...';

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      "dark:bg-slate-950 bg-slate-50",
      "dark:text-white text-slate-900"
    )}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-4 rounded-2xl border-2 transition-colors",
                "dark:border-sky-500 border-sky-400",
                "dark:bg-sky-950/50 bg-sky-50"
              )}>
                <Gamepad2 size={32} className="dark:text-sky-400 text-sky-600" />
              </div>
              <div>
                <h1 className={cn(
                  "text-3xl font-bold",
                  "dark:text-white text-slate-900"
                )}>
                  Global Game Monitor
                </h1>
                <p className="text-slate-500 text-sm">
                  Tin tức game từ {FEED_SOURCES.length} nguồn hàng đầu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all hover:scale-105",
                  "dark:border-slate-700 border-slate-300",
                  "dark:bg-slate-900 bg-white",
                  "dark:text-sky-400 text-sky-600"
                )}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className={cn(
                "px-4 py-3 rounded-xl border-2",
                "dark:border-slate-700 border-slate-300",
                "dark:bg-slate-900 bg-white"
              )}>
                <div className="flex items-center gap-2 text-sm">
                  <Flame size={16} className="dark:text-orange-400 text-orange-500" />
                  <span className="dark:text-slate-300 text-slate-700">
                    {activeFeed?.items.length || 0} tin mới
                  </span>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all hover:scale-105",
                  "dark:border-slate-700 border-slate-300",
                  "dark:bg-slate-900 bg-white",
                  "dark:text-sky-400 text-sky-600",
                  isRefreshing && "animate-spin"
                )}
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tin tức..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-xl border-2",
                "focus:outline-none focus:ring-4 transition-all",
                "dark:bg-slate-900 bg-white",
                "dark:border-slate-700 border-slate-300",
                "dark:text-white text-slate-900",
                "dark:focus:border-sky-500 dark:focus:ring-sky-500/20",
                "focus:border-sky-400 focus:ring-sky-400/20",
                "placeholder:text-slate-400"
              )}
            />
          </div>
        </header>

        {/* Source Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {FEED_SOURCES.map(source => (
            <button
              key={source.id}
              onClick={() => {
                setActiveSource(source.id);
                setSearchQuery('');
              }}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all hover:scale-105 relative overflow-hidden",
                activeSource === source.id
                  ? "dark:border-sky-500 border-sky-400 dark:bg-sky-950/50 bg-sky-50 shadow-lg shadow-sky-500/20"
                  : "dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:hover:border-slate-600 hover:border-slate-400"
              )}
            >
              <div className="text-2xl mb-1">{source.icon}</div>
              <div className="font-semibold text-sm dark:text-white text-slate-900">
                {source.name}
              </div>
              {activeSource === source.id && (
                <div className="absolute top-2 right-2">
                  <Star size={16} className="dark:text-sky-400 text-sky-600 fill-current" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Status Bar */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 rounded-xl border-2 mb-6",
          "dark:bg-slate-900 bg-white",
          "dark:border-slate-700 border-slate-300"
        )}>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Zap size={16} className="dark:text-sky-400 text-sky-600" />
              <span className={cn(
                "dark:text-slate-300 text-slate-700",
                loading && "animate-pulse"
              )}>
                {loading ? 'Đang tải...' : 'Đã cập nhật'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="dark:text-slate-400 text-slate-500" />
              <span className="dark:text-slate-300 text-slate-700">
                {timeAgo}
              </span>
            </div>
          </div>
          <div className="text-sm dark:text-slate-500 text-slate-600">
            Tìm thấy {filteredItems.length} kết quả
          </div>
        </div>

        {/* Feed Content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && activeFeed?.items.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className={cn(
                "inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl animate-pulse",
                "dark:bg-slate-900 bg-slate-100"
              )}>
                <Newspaper className="dark:text-slate-600 text-slate-400" size={32} />
              </div>
              <p className="dark:text-slate-500 text-slate-600">
                Đang tải tin từ {activeSource}...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className={cn(
                "inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl",
                "dark:bg-slate-900 bg-slate-100"
              )}>
                <Search className="dark:text-slate-600 text-slate-400" size={32} />
              </div>
              <p className="dark:text-slate-500 text-slate-600">
                Không tìm thấy kết quả
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group block rounded-2xl border-2 transition-all hover:scale-[1.02] overflow-hidden",
                  "dark:bg-slate-900 bg-white",
                  "dark:border-slate-700 border-slate-300",
                  "dark:hover:border-sky-500 hover:border-sky-400",
                  "dark:hover:shadow-xl hover:shadow-lg",
                  "dark:hover:shadow-sky-500/10 hover:shadow-sky-400/10"
                )}
              >
                <div className="p-6">
                  {/* Category Badge */}
                  {item.category && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 mb-3 text-xs font-medium rounded-full dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600 border-2 dark:border-sky-800 border-sky-200">
                      <span>{item.category}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className={cn(
                    "font-bold text-lg mb-3 line-clamp-2 group-hover:text-sky-500 transition-colors",
                    "dark:text-white text-slate-900"
                  )}>
                    {item.title}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p className={cn(
                      "text-sm mb-4 line-clamp-3",
                      "dark:text-slate-400 text-slate-600"
                    )}>
                      {item.description.replace(/<[^>]+>/g, '').slice(0, 150)}
                    </p>
                  )}

                  {/* Footer */}
                  <div className={cn(
                    "flex items-center justify-between pt-4 border-t-2 text-xs",
                    "dark:border-slate-700 border-slate-200",
                    "dark:text-slate-500 text-slate-600"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{activeSourceConfig?.icon}</span>
                      <span className="dark:text-slate-400 text-slate-700">
                        {activeSourceConfig?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>
                          {item.pubDate 
                            ? new Date(item.pubDate).toLocaleDateString('vi-VN', {
                                month: 'short', day: 'numeric'
                              })
                            : 'Unknown'}
                        </span>
                      </div>
                      <TrendingUp size={14} className="dark:text-sky-400 text-sky-600 group-hover:dark:text-sky-300 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
