import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, X, Users, GraduationCap, Hash, Calendar, Briefcase, Loader2, TrendingUp, MessageSquare, Sparkles } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { backendService } from '../lib/backendService';
import { EmptyState } from './EmptyState';
import { debounce } from '../utils/debounce';

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'college' | 'hashtag' | 'event' | 'job';
  data: any;
}

export function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState<string[]>([
    'Python Developer',
    'Machine Learning',
    'Web Development',
    'Data Science',
    'College Fest',
    'Hackathon'
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    saveRecentSearch(query);

    try {
      // --- Week 2: Combined Search ---
      const { users, posts } = await backendService.combinedSearch(query);
      
      const allResults: SearchResult[] = [
        ...users.map(u => ({ id: u.uid, type: 'user' as const, data: u })),
        ...posts.map(p => ({ id: p.id, type: 'post' as const, data: p }))
      ];

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const renderUserResult = (data: any) => (
    <Card
      key={data.uid || data.id}
      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-[#6DE7C5]/20"
      onClick={() => navigate(`/profile/${data.uid || data.id}`)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-[#FF6F91]/20">
          <AvatarImage src={data.photoURL || data.user_avatar} />
          <AvatarFallback>{(data.displayName || data.full_name || 'U')[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{data.displayName || data.full_name}</h4>
            {data.is_verified_user && (
              <Badge className="text-[10px] bg-[#FF6F91]">Verified</Badge>
            )}
          </div>
          <p className="text-xs text-gray-600">@{data.username}</p>
          {data.college && (
            <p className="text-[10px] text-gray-500 mt-0.5">{data.college}</p>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs border-[#FF6F91] text-[#FF6F91] hover:bg-[#FF6F91]/5">Follow</Button>
      </div>
    </Card>
  );

  const renderPostResult = (data: any) => (
    <Card
      key={data.id}
      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-[#FFB88C]/20"
      onClick={() => navigate(`post-${data.id}`)}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{data.userName}</span>
            <span className="text-[10px] text-gray-400">• {new Date(data.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{data.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="text-[10px] py-0">{data.type}</Badge>
            <span className="text-[10px] text-gray-400">{data.likes} likes</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderCollegeResult = (data: any) => (
    <Card
      key={data.id}
      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`community-${data.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{data.name}</h4>
          <p className="text-sm text-gray-600">{data.memberCount || 0} members</p>
        </div>
        <Button size="sm" className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]">
          Join
        </Button>
      </div>
      {data.description && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{data.description}</p>
      )}
    </Card>
  );

  const renderHashtagResult = (data: any) => (
    <Card
      key={data.tag}
      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => {
        setSearchQuery(data.tag);
        performSearch(data.tag);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
            <Hash className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold">{data.tag}</h4>
            <p className="text-sm text-gray-600">{data.count} posts</p>
          </div>
        </div>
        <TrendingUp className="w-5 h-5 text-[#FF6F91]" />
      </div>
    </Card>
  );

  const renderEventResult = (data: any) => (
    <Card
      key={data.id}
      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/events/${data.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#6DE7C5] to-[#FFB88C] flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{data.title}</h4>
          <p className="text-sm text-gray-600">
            {data.date && new Date(data.date).toLocaleDateString()}
          </p>
          {data.location && (
            <p className="text-xs text-gray-500">{data.location}</p>
          )}
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => {
            e.stopPropagation(); // prevent card click
            navigate(`/events/${data.id}?action=rsvp`);
          }}
        >
          RSVP
        </Button>
      </div>
    </Card>
  );

  const renderJobResult = (data: any) => (
    <Card
      key={data.id}
      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/careers/job/${data.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6F91] to-[#FFB88C] flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{data.title}</h4>
          <p className="text-sm text-gray-600">{data.company}</p>
          {data.location && (
            <p className="text-xs text-gray-500">{data.location}</p>
          )}
        </div>
        <Button 
          size="sm" 
          className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]"
          onClick={(e) => {
             e.stopPropagation();
             navigate(`/careers/job/${data.id}?action=apply`);
          }}
        >
          Apply
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FF6F91] transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for people, posts, colleges..."
              className="pl-12 pr-10 py-6 text-lg rounded-2xl border-none shadow-sm focus-visible:ring-2 focus-visible:ring-[#FF6F91]/20 bg-white"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex justify-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-xl shadow-sm">
              <TabsTrigger value="all" className="rounded-lg px-6">All</TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg px-6">People</TabsTrigger>
              <TabsTrigger value="posts" className="rounded-lg px-6">Posts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF6F91]" />
            <p className="text-sm text-gray-500 animate-pulse">Scanning the multiverse...</p>
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Showing {results.length} matches
              </h3>
            </div>
            <div className="grid gap-3">
              {results
                .filter(r => activeTab === 'all' || (activeTab === 'users' && r.type === 'user') || (activeTab === 'posts' && r.type === 'post'))
                .map(result => {
                  switch (result.type) {
                    case 'user':
                      return renderUserResult(result.data);
                    case 'post':
                      return renderPostResult(result.data);
                    default:
                      return null;
                  }
                })}
            </div>
          </div>
        )}

        {/* No Results or Initial State */}
        {!loading && (
          <>
            {searchQuery.length >= 2 && results.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm mx-2">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No results for "{searchQuery}"</h3>
                <p className="text-gray-500 max-w-xs mx-auto text-sm">
                  We couldn't find any matches. Try checking your spelling or using different keywords.
                </p>
              </div>
            ) : !searchQuery ? (
              <div className="grid md:grid-cols-2 gap-8 px-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#FF6F91]" />
                        Recent
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-[#FF6F91]"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer bg-white hover:bg-gray-100 border-none shadow-sm py-2 px-4 rounded-full text-gray-600 transition-all hover:scale-105"
                          onClick={() => setSearchQuery(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#FFB88C]" />
                    Trending
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search, index) => (
                      <Badge
                        key={index}
                        className="cursor-pointer bg-white text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-[#FFB88C] hover:to-[#FF6F91] border-none shadow-sm py-2 px-4 rounded-full transition-all hover:scale-105"
                        onClick={() => setSearchQuery(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}