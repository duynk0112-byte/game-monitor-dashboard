'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Gamepad2, TrendingUp, Clock, Zap } from 'lucide-react';
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
  { id: 'techcrunch', name: 'TechCrunch Gaming', icon: '⚡' },
] as const;

export default function Home() {
  const [activeSource, setActiveSource] = useState<string>('kotaku');
  const [feeds, setFeeds] = useState<Record<string, FeedResponse>>({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

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

  useEffect(() => {
    fetchFeed(activeSource);
    const interval = setInterval(() => {
      fetchFeed(activeSource);
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [activeSource]);

  const activeFeed = feeds[activeSource];
  const timeAgo = lastFetch 
    ? `${Math.floor((Date.now() - new Date(lastFetch).getTime()) / 60000)} phút trước`
    : 'Updating...';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Gamepad2 className="text-[#8b5cf6]" size={32} />
          <h1 className="text-2xl font-bold">Global Game Monitor</h1>
        </div>
        <p className="text-[#6b7280] text-sm">
          RSS từ {FEED_SOURCES.length} nguồn • Cập nhật mỗi 5 phút
        </p>
      </header>

      {/* Source Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {FEED_SOURCES.map(source => (
          <button
            key={source.id}
            onClick={() => setActiveSource(source.id)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
              activeSource === source.id
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#1a1a1a] text-[#6b7280] hover:bg-[#2a2a2a]"
            )}
          >
            <span className="mr-2">{source.icon}</span>
            {source.name}
          </button>
        ))}
      </div>

      {/* Feed Content */}
      <div className="space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between text-sm text-[#6b7280]">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#8b5cf6]" />
            <span className={loading ? "animate-pulse" : ""}>
              {loading ? 'Đang tải...' : `${activeFeed?.items.length || 0} tin mới`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{timeAgo}</span>
            <span className="text-xs text-[#4a5568]">
              {activeFeed ? `Cache: ${(activeFeed.items.length * 100 / 1024).toFixed(1)} KB` : '-'}
            </span>
          </div>
        </div>

        {/* News Cards */}
        {loading && activeFeed?.items.length === 0 ? (
          <div className="text-center py-12 text-[#6b7280]">
            <Newspaper className="mx-auto mb-4 text-[#4a5568]" size={48} />
            <p>Đang tải tin từ {activeSource}...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeFeed?.items.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#8b5cf6] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-[#8b5cf6] line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[#6b7280] line-clamp-3">
                        {item.description.replace(/<[^>]+>/g, '').slice(0, 150)}
                      </p>
                    )}
                  </div>
                  <TrendingUp size={20} className="text-[#8b5cf6] flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#2a2a2a] text-xs text-[#4a5568]">
                  <Newspaper size={14} />
                  <span>{activeSource}</span>
                  <span>•</span>
                  <Clock size={14} />
                  <span>
                    {item.pubDate 
                      ? new Date(item.pubDate).toLocaleDateString('vi-VN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                      : 'Unknown'}
                  </span>
                  {item.category && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-[#2a2a2a] rounded text-[#8b5cf6]">
                        {item.category}
                      </span>
                    </>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
