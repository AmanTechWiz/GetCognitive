'use client';

import { Search, Clock3, User, Volume2, Square, X, ChevronRight } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

type SearchItem = {
  id: string;
  type: 'page' | 'heading' | 'text';
  breadcrumbs: string[];
  content: string;
  description: string;
  url: string;
  searchable: string;
  body: string;
};

export function StoryControl({
  searchItems = [],
  onOverviewHoverChange,
  onDiagramHoverChange,
}: {
  searchItems?: SearchItem[];
  onOverviewHoverChange?: (hovered: boolean) => void;
  onDiagramHoverChange?: (hovered: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAudio = () => {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          'Context Engineering. Learn how AI agents structure, optimize, and manage prompt context across complex workflows.',
        );
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return searchItems
      .filter((item) => item.type === 'page')
      .map((item) => {
        let score = 0;
        const title = item.content.toLowerCase();
        const desc = item.description.toLowerCase();
        if (title === q) score = 100;
        else if (title.startsWith(q)) score = 80;
        else if (title.includes(q)) score = 60;
        else if (desc.includes(q)) score = 40;
        else if (item.searchable.includes(q)) score = 20;
        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((res) => res.item);
  }, [query, searchItems]);

  const defaultUrl =
    '/docs/part-i-foundations/chapter-1-from-prompt-to-production/11-the-lifecycle-of-an-ai-request';

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border bg-fd-card shadow-sm relative"
    >
      {/* Window Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="size-2.5 rounded-full bg-red-400" />
        <div className="size-2.5 rounded-full bg-yellow-400" />
        <div className="size-2.5 rounded-full bg-green-400" />

        <div className="ml-4 flex h-8 flex-1 items-center rounded-lg border bg-fd-secondary px-3 text-xs text-fd-muted-foreground relative">
          <Search className="mr-2 h-3.5 w-3.5 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search concepts..."
            className="w-full bg-transparent text-xs text-fd-foreground placeholder:text-fd-muted-foreground focus-visible:outline-none"
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2 p-1 rounded-full hover:bg-fd-accent text-fd-muted-foreground hover:text-fd-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 min-h-[300px] flex flex-col justify-between">
        <div className="space-y-4 w-full">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand">
              Featured Concept
            </div>

            <h3 className="text-lg font-semibold">
              <a href={defaultUrl} className="hover:text-brand transition-colors">
                Context Engineering
              </a>
            </h3>

            <p className="text-sm text-fd-muted-foreground">
              Learn how AI agents structure, optimize, and manage context window limits across
              complex LLM workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 rounded-md border px-2 py-1 bg-fd-secondary/30">
              <Clock3 className="h-3.5 w-3.5 text-brand" />5 mins
            </div>

            <div className="flex items-center gap-1 rounded-md border px-2 py-1 bg-fd-secondary/30">
              <User className="h-3.5 w-3.5 text-brand" />
              by shubham singh
            </div>

            <button
              type="button"
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                isPlaying
                  ? 'bg-brand/20 border-brand text-brand font-medium animate-pulse'
                  : 'bg-fd-secondary/30 hover:bg-fd-accent text-fd-muted-foreground hover:text-fd-foreground'
              }`}
            >
              {isPlaying ? (
                <Square className="h-3.5 w-3.5 fill-brand text-brand" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-brand" />
              )}
              <span>{isPlaying ? 'Playing Audio' : 'Audio Explanation'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {['Overview', 'Architecture Diagram', 'Human Explanation'].map((item) => (
              <a
                key={item}
                href={defaultUrl}
                onMouseEnter={() => {
                  if (item === 'Overview' && onOverviewHoverChange) {
                    onOverviewHoverChange(true);
                  }
                  if (item === 'Architecture Diagram' && onDiagramHoverChange) {
                    onDiagramHoverChange(true);
                  }
                }}
                onMouseLeave={() => {
                  if (item === 'Overview' && onOverviewHoverChange) {
                    onOverviewHoverChange(false);
                  }
                  if (item === 'Architecture Diagram' && onDiagramHoverChange) {
                    onDiagramHoverChange(false);
                  }
                }}
                className="flex items-center justify-between rounded-lg border bg-fd-secondary/50 px-3 py-2 text-sm hover:bg-fd-accent transition-colors group cursor-pointer"
              >
                <span className="group-hover:text-brand transition-colors">{item}</span>
                <ChevronRight className="h-4 w-4 text-fd-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Popup Search Dropdown */}
      {isOpen && (
        <div className="absolute inset-x-4 top-[52px] z-50 flex flex-col overflow-hidden rounded-xl border bg-fd-popover text-fd-popover-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[300px]">
          <div className="flex min-h-0 flex-grow flex-col gap-1 overflow-y-auto p-1.5">
            {query.trim().length === 0 ? (
              <div className="py-8 text-center text-xs text-fd-muted-foreground">
                Start typing to search articles...
              </div>
            ) : query.trim().length < 2 ? (
              <div className="py-8 text-center text-xs text-fd-muted-foreground">
                Type at least 2 characters to search...
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-fd-muted-foreground">
                No results found.
              </div>
            ) : (
              filteredResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    window.location.href = item.url;
                  }}
                  className="w-full text-left select-none px-2.5 py-2 hover:bg-fd-accent hover:text-fd-accent-foreground rounded-lg transition-colors flex flex-col gap-1"
                >
                  <div className="inline-flex items-center text-[10px] text-fd-muted-foreground">
                    {item.breadcrumbs.map((breadcrumb, index) => (
                      <span key={breadcrumb} className="inline-flex items-center">
                        {index > 0 && <ChevronRight className="size-3 mx-0.5" />}
                        {breadcrumb}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-sm font-medium text-fd-foreground">{item.content}</h4>
                  <p className="line-clamp-1 text-[11px] text-fd-muted-foreground">
                    {item.description}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="bg-fd-secondary/50 p-2 text-[10px] text-fd-muted-foreground border-t flex items-center justify-between">
            <span>Search {searchItems.length} concepts</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand hover:underline font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
