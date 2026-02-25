'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Gamepad2, TrendingUp, Clock, Zap, RefreshCw, Search, Flame, Sun, Moon, Filter, Loader2, AlertCircle, XCircle, Star, Users } from 'lucide-react';
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

interface FeedError {
  sourceId: string;
  message: string;
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

type ActiveTab = 'news' | 'indie';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('news');
  const [feeds, setFeeds] = useState<Record<string, FeedResponse>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, FeedError>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://global-game-monitor-worker.duy-nk0112.workers.dev';

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

  const fetchSingleFeed = async (sourceId: string, retryCount = 0) => {
    try {
      const res = await fetch(`${WORKER_URL}/api/feeds/${sourceId}`, {
        cache: 'no-store',
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }
      
      const data: FeedResponse = await res.json();
      
      setFeeds(prev => ({ ...prev, [sourceId]: data }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[sourceId];
        return newErrors;
      });
    } catch (error) {
      console.error(`Feed fetch error (${sourceId}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch';
      
      setErrors(prev => ({
        ...prev,
        [sourceId]: { sourceId, message: errorMessage }
      }));

      if (retryCount === 0 && errorMessage.includes('500')) {
        console.log(`Retrying ${sourceId}...`);
        setTimeout(() => fetchSingleFeed(sourceId, retryCount + 1), 2000);
      }
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    }
  };

  const fetchAllFeeds = async () => {
    setIsRefreshing(true);
    const loadingSet = new Set<string>();
    
    const indieSources = FEED_SOURCES.filter(s => s.id === 'indiedb' || s.id === 'itch');
    const sourcesToFetch = activeTab === 'indie' ? indieSources : FEED_SOURCES;
    
    sourcesToFetch.forEach(source => {
      loadingSet.add(source.id);
      setLoading(loadingSet);
      fetchSingleFeed(source.id);
    });

    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const retrySource = (sourceId: string) => {
    const loadingSet = new Set(loading);
    loadingSet.add(sourceId);
    setLoading(loadingSet);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[sourceId];
      return newErrors;
    });
    fetchSingleFeed(sourceId);
  };

  useEffect(() => {
    fetchAllFeeds();
    const interval = setInterval(fetchAllFeeds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const allItems = Object.values(feeds).flatMap(feed =>
    feed.items.map(item => ({ ...item, source: feed.source }))
  );

  const filteredItems = allItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSource = selectedSources.size === 0 || selectedSources.has(item.source);
    
    return matchesSearch && matchesSource;
  });

  const sortedItems = [...filteredItems].sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const indieSources = FEED_SOURCES.filter(s => s.id === 'indiedb' || s.id === 'itch');

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      "dark:bg-slate-950 bg-slate-50",
      "dark:text-white text-slate-900"
    )}>
      <div className="max-w-7xl mx-auto p-6">
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
                    {sortedItems.length} articles
                  </span>
                  {loading.size > 0 && (
                    <Loader2 size={14} className="animate-spin dark:text-sky-400 text-sky-600" />
                  )}
                </div>
              </div>
              <button
                onClick={fetchAllFeeds}
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
          </header>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setActiveTab('news');
                setSelectedSources(new Set());
                setSearchQuery('');
              }}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-medium transition-all hover:scale-105",
                activeTab === 'news'
                  ? "dark:border-sky-500 border-sky-400 dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600"
                  : "dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
              )}
            >
              <Newspaper size={18} />
              <span>Game News</span>
              <Zap size={16} className="dark:text-orange-400 text-orange-500" />
            </button>
            <button
              onClick={() => {
                setActiveTab('indie');
                setSelectedSources(new Set());
                setSearchQuery('');
              }}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-medium transition-all hover:scale-105",
                activeTab === 'indie'
                  ? "dark:border-sky-500 border-sky-400 dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600"
                  : "dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
              )}
            >
              <Star size={18} />
              <span>Top Indie Games</span>
              <Users size={16} className="dark:text-purple-400 text-purple-500" />
            </button>
          </div>

          <div className="relative max-w-md mb-6">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'news' ? "Search news..." : "Search games..."}
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

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white">
              <Filter size={16} className="dark:text-sky-400 text-sky-600" />
              <span className="text-sm font-medium dark:text-white text-slate-900">
                Sources:
              </span>
            </div>
            {(activeTab === 'indie' ? indieSources : FEED_SOURCES).map(source => (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all hover:scale-105 relative",
                  selectedSources.has(source.id)
                    ? "dark:border-sky-500 border-sky-400 dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600"
                    : errors[source.id]
                    ? "dark:border-red-500 border-red-400 dark:bg-red-950/50 bg-red-50 dark:text-red-400 text-red-600"
                    : feeds[source.id]
                    ? "dark:border-green-500 border-green-400 dark:bg-green-950/50 bg-green-50 dark:text-green-400 text-green-600"
                    : "dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
                )}
              >
                <span className="mr-1">{source.icon}</span>
                {source.name}
                {loading.has(source.id) && !errors[source.id] && (
                  <Loader2 size={12} className="absolute top-1 right-1 animate-spin dark:text-sky-400 text-sky-600" />
                )}
                {errors[source.id] && (
                  <XCircle size={12} className="absolute top-1 right-1" />
                )}
              </button>
            ))}
            {selectedSources.size > 0 && (
              <button
                onClick={() => setSelectedSources(new Set())}
                className="px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all hover:scale-105 dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
              >
                Clear filters
              </button>
            )}
          </div>

          {Object.keys(errors).length > 0 && (
            <div className={cn(
              "mb-6 p-4 rounded-xl border-2 flex items-start gap-3",
              "dark:border-red-900/50 border-red-200",
              "dark:bg-red-950/30 bg-red-50"
            )}>
              <AlertCircle size={20} className="dark:text-red-400 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="dark:text-red-300 text-red-800 font-medium mb-2">
                  Some sources failed to load
                </p>
                <div className="space-y-1">
                  {Object.entries(errors).map(([sourceId, error]) => {
                    const source = FEED_SOURCES.find(s => s.id === sourceId);
                    return (
                      <div key={sourceId} className="flex items-center gap-2 text-sm">
                        <span className="dark:text-red-400 text-red-600">{source?.icon}</span>
                        <span className="dark:text-red-300 text-red-700 flex-1">{source?.name}</span>
                        <span className="dark:text-red-400 text-red-600 text-xs">
                          {error.message}
                        </span>
                        <button
                          onClick={() => retrySource(sourceId)}
                          className="px-2 py-1 text-xs font-medium rounded-lg transition-all hover:scale-105 dark:bg-red-900/50 bg-red-100 dark:text-red-300 text-red-700 dark:hover:bg-red-900 hover:bg-red-200"
                        >
                          Retry
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading.size > 0 && sortedItems.length === 0 && Object.keys(errors).length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className={cn(
                  "inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl animate-pulse",
                  "dark:bg-slate-900 bg-slate-100"
                )}>
                  <Newspaper className="dark:text-slate-600 text-slate-400" size={32} />
                </div>
                <p className="dark:text-slate-500 text-slate-600 mb-2">
                  Loading {activeTab === 'news' ? 'news' : 'indie games'}...
                </p>
                <p className="dark:text-slate-600 text-slate-500 text-sm">
                  Content will appear as it loads
                </p>
              </div>
            ) : sortedItems.length === 0 && loading.size === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className={cn(
                  "inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl",
                  "dark:bg-slate-900 bg-slate-100"
                )}>
                  <Search className="dark:text-slate-600 text-slate-400" size={32} />
                </div>
                <p className="dark:text-slate-500 text-slate-600">
                  No {activeTab === 'news' ? 'articles' : 'games'} found
                </p>
              </div>
            ) : (
              sortedItems.map((item, idx) => (
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
                  {item.image && (
                    <div className="relative w-full h-48 overflow-hidden bg-slate-800">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="inline-flex items-center gap-1 px-3 py-1 mb-3 text-xs font-medium rounded-full dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600 border-2 dark:border-sky-800 border-sky-200">
                      {FEED_SOURCES.find(s => s.id === item.source)?.icon}
                      <span className="ml-1">{FEED_SOURCES.find(s => s.id === item.source)?.name}</span>
                    </div>

                    {item.category && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 mb-3 text-xs font-medium rounded-full dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-600 border-2 dark:border-slate-700 border-slate-200">
                        <span>{item.category.replace(/<[^>]+>/g, '')}</span>
                      </div>
                    )}

                    <h3 className={cn(
                      "font-bold text-lg mb-3 line-clamp-2 group-hover:text-sky-500 transition-colors",
                      "dark:text-white text-slate-900"
                    )}>
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className={cn(
                        "text-sm mb-4 line-clamp-3",
                        "dark:text-slate-400 text-slate-600"
                      )}>
                        {item.description.replace(/<[^>]+>/g, '').slice(0, 150)}
                      </p>
                    )}

                    <div className={cn(
                      "flex items-center justify-between pt-4 border-t-2 text-xs",
                      "dark:border-slate-700 border-slate-200",
                      "dark:text-slate-500 text-slate-600"
                    )}>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>
                          {item.pubDate 
                            ? new Date(item.pubDate).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })
                            : 'Unknown'}
                        </span>
                      </div>
                      <TrendingUp size={14} className="dark:text-sky-400 text-sky-600 group-hover:dark:text-sky-300 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </div>
                </a>
              ))
            )}
            
            {loading.size > 0 && sortedItems.length > 0 && (
              <div className="col-span-full text-center py-8">
                <div className="flex items-center justify-center gap-2 dark:text-sky-400 text-sky-600">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">
                    Loading {loading.size} more source{loading.size > 1 ? 's' : ''}...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
