import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Users, Lock, Globe, Settings, UserPlus, LogOut, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Dropdown } from '../../components/ui/Dropdown';
import { PostCard } from '../feed/PostCard';
import { CreatePost } from '../feed/CreatePost';
import { groupsApi } from '../../api/groups.api';
import { QK } from '../../constants';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';

export const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: QK.GROUP(id!),
    queryFn: () => groupsApi.getGroupById(id!),
    enabled: !!id,
  });

  const { ref, inView } = useInView();
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: postsStatus,
  } = useInfiniteQuery({
    queryKey: QK.GROUP_POSTS(id!),
    queryFn: ({ pageParam }) => groupsApi.getGroupPosts(id!, 10, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!id && (group?.role !== undefined || group?.privacy === 'public'),
  });

  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const { mutate: joinGroup, isPending: isJoining } = useMutation({
    mutationFn: () => groupsApi.joinGroup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP(id!) });
      success('Requested to join group');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to join group'),
  });

  const { mutate: leaveGroup, isPending: isLeaving } = useMutation({
    mutationFn: () => groupsApi.leaveGroup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP(id!) });
      success('Left group');
      navigate('/groups');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to leave group'),
  });

  if (isGroupLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <Skeleton variant="rectangular" height={320} className="rounded-b-3xl" />
        <div className="px-6 mt-4">
          <Skeleton width={300} height={40} className="mb-2" />
          <Skeleton width={200} className="mb-6" />
        </div>
      </div>
    );
  }

  if (!group) return <div className="text-center py-20 text-ink-muted">Group not found</div>;

  const isMember = group.role !== undefined && group.role !== 'pending';
  const isAdminOrOwner = group.role === 'admin' || group.role === 'owner';
  const posts = postsData?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      {/* Cover Photo */}
      <div className="h-48 sm:h-80 bg-surface-200 rounded-b-3xl overflow-hidden relative">
        {group.cover_url ? (
          <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-accent-500/20">
            <Users size={64} className="text-primary-500 opacity-50" />
          </div>
        )}
      </div>

      {/* Group Header */}
      <div className="px-4 sm:px-8 mt-6 mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-ink mb-2">{group.name}</h1>
          <div className="flex items-center gap-4 text-sm font-medium text-ink-muted">
            <span className="flex items-center gap-1.5">
              {group.privacy === 'public' ? <Globe size={16} /> : <Lock size={16} />}
              {group.privacy === 'public' ? 'Public Group' : 'Private Group'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Users size={16} /> {group.member_count} members
            </span>
          </div>
          {group.description && (
            <p className="mt-4 text-ink text-[15px] max-w-2xl">{group.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!group.role ? (
            <Button onClick={() => joinGroup()} isLoading={isJoining} className="btn-gradient">
              <UserPlus size={18} className="mr-2" /> Join Group
            </Button>
          ) : group.role === 'pending' ? (
            <Button variant="outline" disabled>Request Pending</Button>
          ) : (
            <>
              <Button variant="secondary">Joined</Button>
              <Dropdown
                align="right"
                items={[
                  ...(isAdminOrOwner ? [{ label: 'Manage Group', icon: <Settings size={16} />, onClick: () => navigate(`/groups/${id}/manage`) }] : []),
                  { label: 'Leave Group', icon: <LogOut size={16} />, onClick: () => leaveGroup(), danger: true },
                ]}
              />
            </>
          )}
        </div>
      </div>

      <div className="border-b border-border-base mb-6 px-4 sm:px-8">
        <nav className="flex gap-6">
          <button className="border-b-2 border-primary-500 py-3 text-sm font-semibold text-primary-500">
            Discussion
          </button>
          <button className="border-b-2 border-transparent py-3 text-sm font-medium text-ink-muted hover:text-ink">
            Members
          </button>
          {isAdminOrOwner && (
            <button className="border-b-2 border-transparent py-3 text-sm font-medium text-ink-muted hover:text-ink flex items-center gap-2">
              <Shield size={16} /> Manage
            </button>
          )}
        </nav>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        {isMember ? (
          <>
            <CreatePost />
            <div className="space-y-6">
              {postsStatus === 'pending' ? (
                <div className="text-center py-10"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-surface-50 dark:bg-surface-200 rounded-2xl border border-border-base border-dashed">
                  <p className="text-ink-muted">No posts in this group yet.</p>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  <div ref={ref} className="h-10 flex items-center justify-center">
                    {isFetchingNextPage && (
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : group.privacy === 'private' ? (
          <div className="text-center py-16 bg-surface-50 dark:bg-surface-200 rounded-2xl border border-border-base">
            <Lock size={48} className="mx-auto mb-4 text-ink-muted" />
            <h3 className="text-xl font-display font-bold text-ink mb-2">This group is private</h3>
            <p className="text-ink-muted">Join this group to view and participate in discussions.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {postsStatus === 'pending' ? (
                <div className="text-center py-10"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-surface-50 dark:bg-surface-200 rounded-2xl border border-border-base border-dashed">
                  <p className="text-ink-muted">No posts in this group yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
          </div>
        )}
      </div>
    </div>
  );
};
