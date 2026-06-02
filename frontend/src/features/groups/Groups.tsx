import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Globe, Lock, TrendingUp } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { groupsApi } from '../../api/groups.api';
import { QK } from '../../constants';
import { Group } from '../../types';

const GroupCardSkeleton = () => (
  <div className="card overflow-hidden animate-pulse h-full flex flex-col">
    <div className="h-36 bg-surface-200 dark:bg-surface-700 flex-shrink-0" />
    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
      </div>
      <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded-lg w-full mt-2" />
    </div>
  </div>
);

const GroupCard = ({ group }: { group: Group }) => {
  return (
    <Link to={`/groups/${group.id}`} className="flex flex-col h-full group">
      <div className="card overflow-hidden flex flex-col h-full w-full">
        {/* Cover Image */}
        <div className="h-36 overflow-hidden relative bg-surface-200 dark:bg-surface-700 flex-shrink-0">
          {group.cover_url ? (
            <img
              src={group.cover_url}
              alt={group.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-primary-600/20">
              <Users size={36} className="text-primary-400" />
            </div>
          )}
          {/* Privacy badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/40 text-white backdrop-blur-sm">
              {group.privacy === 'public' ? (
                <Globe size={9} />
              ) : (
                <Lock size={9} />
              )}
              {group.privacy === 'public' ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-ink text-base leading-snug line-clamp-1 mb-1">
            {group.name}
          </h3>
          {group.description ? (
            <p className="text-xs text-ink-muted line-clamp-2 mb-4 flex-1">
              {group.description}
            </p>
          ) : (
            <div className="flex-1 mb-4" />
          )}
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-xs text-ink-muted flex items-center gap-1">
              <Users size={12} />
              {group.members_count?.toLocaleString() ?? 0} members
            </span>
            <Button size="sm" variant="secondary" className="text-xs font-semibold h-7 px-3 text-primary-600 !bg-primary-100 dark:!bg-primary-950/30 dark:shadow-dark-xs shadow-xs flex-shrink-0">
              {group.role ? 'View' : 'Join'}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const Groups = () => {
  const navigate = useNavigate();
  // const [activeCategory, setActiveCategory] = useState('All Groups');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QK.GROUPS,
    queryFn: () => groupsApi.getMyGroups(20),
  });

  const allGroups: Group[] = (data as any)?.groups ?? (data as any)?.data ?? [];
  
  const filteredGroups = allGroups.filter((g) =>
    searchQuery
      ? g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const joinedGroups = allGroups.filter((g) => g.role && g.role !== 'pending');

  return (
    <div className="containerMaxWidth p-4 lg:p-8 pb-20">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        <div className="h-52 sm:h-64 w-full bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#fff_1px,transparent_1px)] bg-[length:20px_20px]" />
        </div>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full px-8 py-8">
            <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-2">
              Communities
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight">
              Discover Communities
            </h1>
            <p className="mt-2 text-sm text-white/70 max-w-md">
              Find groups that match your interests, connect with like-minded
              people, and share your passions.
            </p>
            {/* Search bar */}
            <div className="mt-5 relative max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50"
              />
              <input
                type="text"
                placeholder="Search groups…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 !rounded-xl bg-white/15 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Main Column ─── */}
        <div className="lg:col-span-2">
          {/* Category Filter Pills
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-100 dark:bg-surface-800 text-ink-muted hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div> */}

          {/* Section heading */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-500" />
              {joinedGroups.length > 0 ? 'Your Groups' : 'All Groups'}
            </h2>
            {!isLoading && allGroups.length > 0 && (
              <span className="text-xs text-ink-muted">{allGroups.length} groups</span>
            )}
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <GroupCardSkeleton key={i} />)
            ) : filteredGroups.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-border-variant border-dashed">
                <Users size={48} className="mx-auto mb-4 text-ink-muted" />
                <h3 className="text-lg font-display font-medium text-ink mb-2">
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </h3>
                <p className="text-ink-muted mb-6 text-sm">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Create a group or explore existing ones.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => navigate('/groups/create')}
                    variant="primary"
                    size="sm"
                  >
                    Create a Group
                  </Button>
                )}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </div>
        </div>

        {/* ─── Right Sidebar ─── */}
        <aside className="hidden lg:block">
          <div className="space-y-5 sticky top-6">
            {/* Your Groups widget */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-ink">Your Groups</h4>
                <Link
                  to="/groups/create"
                  className="text-xs text-primary-600 font-medium hover:underline"
                >
                  Create
                </Link>
                
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-lg bg-surface-200 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-surface-200 rounded w-3/4" />
                        <div className="h-2.5 bg-surface-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : joinedGroups.length === 0 ? (
                <p className="text-xs text-ink-muted text-center py-4">
                  You haven't joined any groups yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {joinedGroups.slice(0, 5).map((g) => (
                    <Link
                      key={g.id}
                      to={`/groups/${g.id}`}
                      className="flex items-center gap-3 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg p-1.5 -mx-1.5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary-500/10">
                        {g.cover_url ? (
                          <img
                            src={g.cover_url}
                            alt={g.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/30 to-accent-500/20">
                            <span className="text-primary-600 text-xs font-bold">
                              {g.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{g.name}</p>
                        <p className="text-xs text-ink-muted">
                          {g.role === 'owner' ? 'Owner' : (g.role === 'admin' ? 'Admin' : (g.role === 'moderator' ? 'Moderator' : 'Member'))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ─── FAB ─── */}
      <button
        onClick={() => navigate('/groups/create')}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 lg:hidden"
        aria-label="Create Group"
      >
        <Plus size={22} />
      </button>
    </div>
  );
};
