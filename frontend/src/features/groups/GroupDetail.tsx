import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import {
  Users,
  Lock,
  Globe,
  Settings,
  LogOut,
  MoreHorizontal,
  Clock,
  Crown,
  MessageSquare,
  Image,
  Info,
  UserPlus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { PostCard } from '../feed/PostCard';
import { CreatePost } from '../feed/CreatePost';
import { GroupMembers } from './GroupMembers';
import { GroupSettings } from './GroupSettings';
import { groupsApi } from '../../api/groups.api';
import { QK } from '../../constants';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { GroupRole } from '../../types';

type Tab = 'timeline' | 'about' | 'members' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'timeline', label: 'Timeline', icon: <MessageSquare size={15} /> },
  { key: 'about', label: 'About', icon: <Info size={15} /> },
  { key: 'members', label: 'Members', icon: <Users size={15} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={15} /> },
];

export const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [menuOpen, setMenuOpen] = useState(false);

  // ─── Group Data ───
  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: QK.GROUP(id!),
    queryFn: () => groupsApi.getGroupById(id!),
    enabled: !!id,
  });

  // ─── Posts ───
  const { ref: postsEndRef, inView } = useInView();
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: postsStatus,
  } = useInfiniteQuery({
    queryKey: QK.GROUP_POSTS(id!),
    queryFn: ({ pageParam }) =>
      groupsApi.getGroupPosts(id!, 10, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled:
      !!id &&
      activeTab === 'timeline' &&
      (group?.role !== undefined || (group as any)?.privacy === 'public'),
  });

  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  // ─── Join / Leave ───
  const { mutate: joinGroup, isPending: isJoining } = useMutation({
    mutationFn: () => groupsApi.joinGroup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP(id!) });
      queryClient.invalidateQueries({ queryKey: QK.GROUPS });
      success(
        (group as any)?.privacy === 'private'
          ? 'Join request sent!'
          : 'Joined group successfully!',
      );
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to join group'),
  });

  const { mutate: leaveGroup, isPending: isLeaving } = useMutation({
    mutationFn: () => groupsApi.leaveGroup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP(id!) });
      queryClient.invalidateQueries({ queryKey: QK.GROUPS });
      success('Left group');
      navigate('/groups');
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to leave group'),
  });

  // ─── Derived state ───
  const isMember =
    group?.role !== undefined && group?.role !== 'pending';
  const isAdminOrOwner =
    group?.role === GroupRole.ADMIN || group?.role === GroupRole.OWNER;
  const isOwner = group?.role === GroupRole.OWNER;
  const isPending = group?.role === 'pending';
  const posts = postsData?.pages.flatMap((p) => p.data) ?? [];

  // Visible tabs
  const visibleTabs = TABS.filter((t) => {
    if (t.key === 'settings') return isAdminOrOwner;
    return true;
  });

  // ─── Loading skeleton ───
  if (isGroupLoading) {
    return (
      <div className="containerMaxWidth">
        <Skeleton variant="rectangular" height={280} className="w-full" />
        <div className="px-6 mt-4">
          <Skeleton width={320} height={36} className="mb-2" />
          <Skeleton width={200} className="mb-6" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width={80} height={32} className="rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!group)
    return (
      <div className="text-center py-20 text-ink-muted">Group not found</div>
    );

  const privacy = (group as any).privacy as string;
  const memberCount = (group as any).member_count ?? (group as any).members_count ?? 0;
  const creator = (group as any).creator;

  return (
    <div className="containerMaxWidth pb-10">
      <div className="bg-white dark:bg-surface-900 w-full flex flex-col gap-4 rounded-lg">
        {/* ─── Cover Header ─── */}
        <div className="relative w-full overflow-hidden rounded-t-2xl">
          {/* Cover photo */}
          <div className="h-52 sm:h-96 w-full bg-surface-200 dark:bg-surface-800 relative">
            {(group as any).cover_url ? (
              <img
                src={(group as any).cover_url}
                alt={(group as any).name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600/30 via-accent-500/20 to-primary-700/30">
                <Users size={72} className="text-primary-400/40" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        </div>

        {/* Header info (overlaid at the bottom of cover) */}
          <div className="px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Group info */}
              <div className="text-black dark:text-white flex flex-col gap-2"> 
                <h1 className="text-2xl sm:text-3xl font-display font-bold leading-tight">
                  {(group as any).name}
                </h1>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 text-black dark:text-white">
                    {privacy === 'public' ? (
                      <Globe size={11} />
                    ) : (
                      <Lock size={11} />
                    )}
                    {privacy === 'public' ? 'Public Group' : 'Private Group'}
                  </span>
                  <span className="text-black/50 dark:text-white/50">·</span>
                  <span className="text-xs text-black/70 dark:text-white/70">
                    {memberCount.toLocaleString()} Members
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!group.role ? (
                  <Button
                    onClick={() => joinGroup()}
                    isLoading={isJoining}
                    variant="primary"
                    size="sm"
                    className="!bg-primary-600 !hover:bg-primary-700 shadow-lg"
                  >
                    <UserPlus size={14} className="mr-1.5" />
                    Join Group
                  </Button>
                ) : isPending ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="!bg-white/10 !border-white/30 text-ink-muted cursor-not-allowed"
                  >
                    <Clock size={14} className="mr-1.5" />
                    Request Pending
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="!bg-white/10 !border-white/20 text-ink-muted hover:!bg-white/20"
                    >
                      Joined
                    </Button>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className="p-2 rounded-lg !bg-white/10 hover:!bg-white/20 text-ink-muted transition-colors border border-white/20"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 top-10 z-20 w-44 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-elevated py-1 text-sm">
                          {isAdminOrOwner && (
                            <button
                              onClick={() => {
                                setActiveTab('settings');
                                setMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-ink transition-colors flex items-center gap-2"
                            >
                              <Settings size={14} /> Manage Group
                            </button>
                          )}
                          {!isOwner && (
                            <button
                              onClick={() => { leaveGroup(); setMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-red-500 transition-colors flex items-center gap-2"
                            >
                              <LogOut size={14} /> Leave Group
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        {/* ─── Tab Navigation ─── */}
        <nav className="flex gap-1 px-4 border-t border-gray-200 dark:border-gray-700">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-ink-muted hover:text-ink hover:border-border-base'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
      </div>

      {/* ─── Content ─── */}
      <div className="mt-5 px-4 lg:px-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Main column ─── */}
        <main className="lg:col-span-2">
          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <>
              {isMember ? (
                <div className="space-y-5">
                  <CreatePost />
                  {postsStatus === 'pending' ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-14 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed">
                      <MessageSquare size={40} className="mx-auto mb-3 text-ink-muted" />
                      <p className="text-ink-muted text-sm">
                        No posts yet. Be the first to share something!
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => <PostCard key={post.id} post={post} />)
                  )}
                </div>
              ) : privacy === 'private' ? (
                <div className="text-center py-16 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <Lock size={48} className="mx-auto mb-4 text-ink-muted" />
                  <h3 className="text-xl font-display font-bold text-ink mb-2">
                    This group is private
                  </h3>
                  <p className="text-ink-muted text-sm">
                    Join this group to view and participate in discussions.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {postsStatus === 'pending' ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-14 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed">
                      <p className="text-ink-muted text-sm">No posts in this group yet.</p>
                    </div>
                  ) : (
                    posts.map((post) => <PostCard key={post.id} post={post} />)
                  )}
                </div>
              )}
              <div ref={postsEndRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}

          {/* About tab */}
          {activeTab === 'about' && (
            <div className="card p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">About this group</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {(group as any).description || 'No description provided.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-ink-muted mb-1">Privacy</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    {privacy === 'public' ? <Globe size={14} /> : <Lock size={14} />}
                    {privacy === 'public' ? 'Public' : 'Private'}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-ink-muted mb-1">Members</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <Users size={14} />
                    {memberCount.toLocaleString()}
                  </div>
                </div>
                {creator && (
                  <div className="col-span-2">
                    <p className="text-xs text-ink-muted mb-2">Created by</p>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={creator.profile?.avatar_url ?? undefined}
                        alt={creator.username}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink flex items-center gap-1">
                          {creator.profile?.full_name ?? creator.username}
                          <Crown size={11} className="text-amber-500" />
                        </p>
                        <p className="text-xs text-ink-muted">@{creator.username}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink mb-4">Members</h3>
              {isMember ? (
                <GroupMembers groupId={id!} myRole={group.role} />
              ) : (
                <p className="text-sm text-ink-muted text-center py-8">
                  Join the group to see members.
                </p>
              )}
            </div>
          )}

          {/* Settings tab */}
          {activeTab === 'settings' && isAdminOrOwner && (
            <GroupSettings
              groupId={id!}
              groupName={(group as any).name}
              myRole={group.role}
              isOwner={isOwner}
            />
          )}
        </main>

        {/* ─── Right Sidebar ─── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5">
            {/* About widget */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-ink mb-3">About</h4>
              {(group as any).description ? (
                <p className="text-sm text-ink-muted leading-relaxed line-clamp-4">
                  {(group as any).description}
                </p>
              ) : (
                <p className="text-sm text-ink-muted">No description provided.</p>
              )}
              <div className="mt-4 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  {privacy === 'public' ? (
                    <Globe size={14} />
                  ) : (
                    <Lock size={14} />
                  )}
                  <span className="capitalize">{privacy} group</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <Users size={14} />
                  <span>{memberCount.toLocaleString()} members</span>
                </div>
              </div>
            </div>

            {/* Active Members widget */}
            {isMember && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-ink">Active Members</h4>
                  <button
                    onClick={() => setActiveTab('members')}
                    className="text-xs text-primary-600 hover:underline font-medium"
                  >
                    See all
                  </button>
                </div>
                <p className="text-xs text-ink-muted">
                  {memberCount.toLocaleString()} member
                  {memberCount !== 1 ? 's' : ''} in this group.
                </p>
              </div>
            )}

            {/* Non-member CTA */}
            {!isMember && !isPending && (
              <div className="card p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/10 border-primary-100 dark:border-primary-800/30">
                <h4 className="text-sm font-semibold text-ink mb-1">
                  Join the conversation
                </h4>
                <p className="text-xs text-ink-muted mb-3">
                  Become a member to post, comment and connect with{' '}
                  {memberCount.toLocaleString()} others.
                </p>
                <Button
                  onClick={() => joinGroup()}
                  isLoading={isJoining}
                  size="sm"
                  variant="primary"
                  className="w-full"
                >
                  <UserPlus size={14} className="mr-1.5" />
                  {privacy === 'private' ? 'Request to Join' : 'Join Group'}
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
