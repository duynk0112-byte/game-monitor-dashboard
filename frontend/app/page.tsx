'use client';

import { useEffect, useState } from 'react';
import { 
  Newspaper, Gamepad2, TrendingUp, Clock, Zap, RefreshCw, Search, Flame, Sun, Moon, 
  Filter, Loader2, AlertCircle, XCircle, Star, Users, Bookmark, Share2, ArrowLeft,
  Heart, BookmarkCheck, Grid, List, X, ChevronDown
} from 'lucide-react';
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
type ViewMode = 'grid' | 'list';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('news');
  const [feeds, setFeeds] = useState<Record<string, FeedResponse>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, FeedError>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

    const savedBookmarks = localStorage.getItem('bookmarks');
    if (savedBookmarks) {
      setBookmarks(new Set(JSON.parse(savedBookmarks)));
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

  const fetchAllFeeds = () => {
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

  const toggleBookmark = (link: string) => {
    setBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(link)) {
        newSet.delete(link);
      } else {
        newSet.add(link);
      }
      localStorage.setItem('bookmarks', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const shareArticle = async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const indieSources = FEED_SOURCES.filter(s => s.id === 'indiedb' || s.id === 'itch');

  const handleNewsTabClick = () => {
    setActiveTab('news');
    setSelectedSources(new Set());
    setSearchQuery('');
  };

  const handleIndieTabClick = () => {
    setActiveTab('indie');
    setSelectedSources(new Set());
    setSearchQuery('');
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      "dark:bg-slate-950 bg-slate-50",
      "dark:text-white text-slate-900"
    )}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                  "p-2 md:p-3 rounded-xl border-2 transition-all hover:scale-105",
                  "dark:border-slate-700 border-slate-300",
                  "dark:bg-slate-900 bg-white",
                  "dark:text-sky-400 text-sky-600"
                )}
              >
                {sidebarOpen ? <ArrowLeft size={20} /> : <Filter size={20} />}
              </button>
              <div className={cn(
                "p-3 md:p-4 rounded-2xl border-2 transition-colors",
                "dark:border-sky-500 border-sky-400",
                "dark:bg-sky-950/50 bg-sky-50"
              )}>
                <Gamepad2 size={28} className="dark:text-sky-400 text-sky-600" />
              </div>
              <div className="hidden md:block">
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold",
                  "dark:text-white text-slate-900"
                )}>
                  Global Game Monitor
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all hover:scale-105",
                  "dark:border-slate-700 border-slate-300",
                  "dark:bg-slate-900 bg-white",
                  "dark:text-sky-400 text-sky-600"
                )}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all hover:scale-105",
                  "dark:border-slate-700 border-slate-300",
                  "dark:bg-slate-900 bg-white",
                  "dark:text-sky-400 text-sky-600"
                )}
              >
                {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
              </button>
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
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={handleNewsTabClick}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-5 py-2 md:py-3 rounded-xl border-2 font-medium transition-all hover:scale-105 whitespace-nowrap",
                  activeTab === 'news'
                    ? "dark:border-sky-500 border-sky-400 dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600"
                    : "dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
                )}
              >
                <Newspaper size={16} />
                <span className="hidden sm:inline">Game News</span>
                <Zap size={14} className="dark:text-orange-400 text-orange-500" />
              </button>
              <button
                onClick={handleIndieTabClick}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-5 py-2 md:py-3 rounded-xl border-2 font-medium transition-all hover:scale-105 whitespace-nowrap",
                  activeTab === 'indie'
                    ? "dark:border-sky-500 border-sky-400 dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600"
                    : "dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
                )}
              >
                <Star size={16} />
                <span className="hidden sm:inline">Indie Games</span>
                <Users size={14} className="dark:text-purple-400 text-purple-500" />
              </button>
            </div>

            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'news' ? "Search news..." : "Search games..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 md:pl-11 pr-4 py-2 md:py-3 rounded-xl border-2",
                  "focus:outline-none focus:ring-4 transition-all text-sm",
                  "dark:bg-slate-900 bg-white",
                  "dark:border-slate-700 border-slate-300",
                  "dark:text-white text-slate-900",
                  "dark:focus:border-sky-500 dark:focus:ring-sky-500/20",
                  "focus:border-sky-400 focus:ring-sky-400/20",
                  "placeholder:text-slate-400"
                )}
              />
            </div>

            <div className={cn(
              "hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border-2",
              "dark:border-slate-700 border-slate-300",
              "dark:bg-slate-900 bg-white"
            )}>
              <Flame size={14} className="dark:text-orange-400 text-orange-500" />
              <span className="text-sm font-medium dark:text-slate-300 text-slate-700">
                {sortedItems.length}
              </span>
              {loading.size > 0 && (
                <Loader2 size={12} className="animate-spin dark:text-sky-400 text-sky-600" />
              )}
            </div>
          </div>

          {sidebarOpen && (
            <div className={cn(
              "mb-6 p-4 rounded-2xl border-2",
              "dark:border-slate-700 border-slate-300",
              "dark:bg-slate-900 bg-white"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold dark:text-white text-slate-900">Filters</h3>
                <button onClick={() => setShowFilters(!showFilters)} className="md:hidden">
                  <X size={20} className="dark:text-slate-400 text-slate-600" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(activeTab === 'indie' ? indieSources : FEED_SOURCES).map(source => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-sm font-medium transition-all hover:scale-105 relative",
                      selectedSources.has(source.id)
                        ? "dark:border-sky-500 border-sky-400 dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600"
                        : errors[source.id]
                        ? "dark:border-red-500 border-red-400 dark:bg-red-950/50 bg-red-50 dark:text-red-400 text-red-600"
                        : feeds[source.id]
                        ? "dark:border-green-500 border-green-400 dark:bg-green-950/50 bg-green-50 dark:text-green-400 text-green-600"
                        : "dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{source.icon}</span>
                        <span className="hidden sm:inline">{source.name}</span>
                      </div>
                      {loading.has(source.id) && !errors[source.id] && (
                        <Loader2 size={12} className="animate-spin dark:text-sky-400 text-sky-600" />
                      )}
                      {errors[source.id] && (
                        <XCircle size={12} className="dark:text-red-400 text-red-600" />
                      )}
                    </div>
                    {errors[source.id] && (
                      <button
                        onClick={() => retrySource(source.id)}
                        className="text-xs font-medium rounded-lg dark:bg-red-900/50 bg-red-100 dark:text-red-300 text-red-700 dark:hover:bg-red-900 hover:bg-red-200 mt-2"
                      >
                        Retry
                      </button>
                    )}
                  </button>
                ))}
              </div>
              {selectedSources.size > 0 && (
                <button
                  onClick={() => setSelectedSources(new Set())}
                  className="w-full mt-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all hover:scale-105 dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!sidebarOpen && (
            <div className="flex flex-col md:hidden gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all hover:scale-105 dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700"
              >
                <Filter size={16} className="dark:text-sky-400 text-sky-600" />
                <span>Filter sources</span>
                <ChevronDown size={16} className="dark:text-slate-400 text-slate-600" />
              </button>
            </div>
          )}

          {bookmarks.size > 0 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setBookmarks(new Set())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all hover:scale-105 dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white dark:text-slate-300 text-slate-700 dark:hover:border-slate-600 hover:border-slate-400 whitespace-nowrap"
              >
                <BookmarkCheck size={14} />
                <span>Bookmarks ({bookmarks.size})</span>
              </button>
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className={cn(
              "mb-6 p-4 rounded-xl border-2 flex items-start gap-3",
              "dark:border-red-900/50 border-red-200",
              "dark:bg-red-950/30 bg-red-50"
            )}>
              <AlertCircle size={18} className="dark:text-red-400 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="dark:text-red-300 text-red-800 font-medium mb-2 text-sm">
                  Some sources failed to load. Click Retry to fetch again.
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(errors).map(([sourceId, error]) => {
                    const source = FEED_SOURCES.find(s => s.id === sourceId);
                    return (
                      <button
                        key={sourceId}
                        onClick={() => retrySource(sourceId)}
                        className="px-3 py-2 text-xs font-medium rounded-lg transition-all hover:scale-105 dark:bg-red-900/50 bg-red-100 dark:text-red-300 text-red-700 dark:hover:bg-red-900 hover:bg-red-200"
                      >
                        {source?.name} - {error.message}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={cn(
            viewMode === 'grid' 
              ? "grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "flex flex-col gap-4"
          )}>
            {loading.size > 0 && sortedItems.length === 0 && Object.keys(errors).length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className={cn(
                  "inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl animate-pulse",
                  "dark:bg-slate-900 bg-slate-100"
                )}>
                  <Newspaper className="dark:text-slate-600 text-slate-400" size={32} />
                </div>
                <p className="dark:text-slate-500 text-slate-600 mb-2 text-sm">
                  Loading {activeTab === 'news' ? 'news' : 'indie games'}...
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
                <p className="dark:text-slate-500 text-slate-600 text-sm">
                  No {activeTab === 'news' ? 'articles' : 'games'} found
                </p>
              </div>
            ) : (
              sortedItems.map((item, idx) => (
                <article
                  key={idx}
                  className={cn(
                    "group relative rounded-2xl border-2 transition-all hover:scale-[1.02] overflow-hidden",
                    "dark:bg-slate-900 bg-white",
                    "dark:border-slate-700 border-slate-300",
                    "dark:hover:border-sky-500 hover:border-sky-400",
                    "dark:hover:shadow-xl hover:shadow-lg",
                    "dark:hover:shadow-sky-500/10 hover:shadow-sky-400/10",
                    viewMode === 'list' ? "flex flex-col md:flex-row gap-4" : ""
                  )}
                >
                  {viewMode === 'list' ? (
                    <>
                      {item.image && (
                        <div className="relative w-full md:w-48 h-32 md:h-36 flex-shrink-0 overflow-hidden bg-slate-800">
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
                      <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 mb-2">
                            <div className={cn(
                              "inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full",
                              "dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600 border-2 dark:border-sky-800 border-sky-200"
                            )}>
                              {FEED_SOURCES.find(s => s.id === item.source)?.icon}
                              <span className="ml-1">{FEED_SOURCES.find(s => s.id === item.source)?.name}</span>
                            </div>
                            {item.category && (
                              <div className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
                                "dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-600 border-2 dark:border-slate-700 border-slate-200"
                              )}>
                                {item.category.replace(/<[^>]+>/g, '')}
                              </div>
                            )}
                          </div>
                          <h3 className={cn(
                            "font-bold text-base md:text-lg mb-2 line-clamp-2 group-hover:text-sky-500 transition-colors",
                            "dark:text-white text-slate-900"
                          )}>
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className={cn(
                              "text-xs md:text-sm mb-3 line-clamp-2",
                              "dark:text-slate-400 text-slate-600"
                            )}>
                              {item.description.replace(/<[^>]+>/g, '').slice(0, 150)}
                            </p>
                          )}
                        </div>
                        <div className={cn(
                          "flex items-center justify-between gap-3 text-xs",
                          "dark:border-slate-700 border-slate-200",
                          "dark:text-slate-500 text-slate-600",
                          "pt-3 border-t-2"
                        )}>
                          <div className="flex items-center gap-2">
                            <Clock size={12} />
                            <span>
                              {item.pubDate 
                                ? new Date(item.pubDate).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })
                                : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleBookmark(item.link);
                              }}
                              className="p-1.5 rounded-lg transition-all hover:scale-110"
                              title={bookmarks.has(item.link) ? 'Remove bookmark' : 'Add bookmark'}
                            >
                              {bookmarks.has(item.link) ? (
                                <BookmarkCheck size={16} className="dark:text-sky-400 text-sky-600" />
                              ) : (
                                <Bookmark size={16} className="dark:text-slate-400 text-slate-600" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                shareArticle(item.title, item.link);
                              }}
                              className="p-1.5 rounded-lg transition-all hover:scale-110"
                              title="Share"
                            >
                              <Share2 size={16} className="dark:text-slate-400 text-slate-600" />
                            </button>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg transition-all hover:scale-110 dark:text-sky-400 text-sky-600"
                              title="Open article"
                            >
                              <TrendingUp size={16} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {item.image && (
                        <div className="relative w-full aspect-video overflow-hidden bg-slate-800">
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
                      <div className="p-4 md:p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full dark:bg-sky-950/50 bg-sky-50 dark:text-sky-400 text-sky-600 border-2 dark:border-sky-800 border-sky-200">
                            {FEED_SOURCES.find(s => s.id === item.source)?.icon}
                            <span className="ml-1">{FEED_SOURCES.find(s => s.id === item.source)?.name}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleBookmark(item.link);
                            }}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            title={bookmarks.has(item.link) ? 'Remove bookmark' : 'Add bookmark'}
                          >
                            {bookmarks.has(item.link) ? (
                              <BookmarkCheck size={16} className="dark:text-sky-400 text-sky-600" />
                            ) : (
                              <Bookmark size={16} className="dark:text-slate-400 text-slate-600" />
                            )}
                          </button>
                        </div>
                        <h3 className={cn(
                          "font-bold text-base md:text-lg mb-3 line-clamp-2 group-hover:text-sky-500 transition-colors",
                          "dark:text-white text-slate-900"
                        )}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className={cn(
                            "text-xs md:text-sm mb-4 line-clamp-3",
                            "dark:text-slate-400 text-slate-600"
                          )}>
                            {item.description.replace(/<[^>]+>/g, '').slice(0, 150)}
                          </p>
                        )}
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all hover:scale-105",
                            "dark:border-slate-700 border-slate-300",
                            "dark:bg-slate-800 bg-slate-100",
                            "dark:text-white text-slate-900",
                            "dark:hover:border-sky-500 hover:border-sky-400 dark:hover:dark:text-white hover:text-sky-500"
                          )}
                        >
                          <span>Read more</span>
                          <TrendingUp size={16} />
                        </a>
                      </div>
                    </>
                  )}
                </article>
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
        </header>
      </div>
    );
  }
