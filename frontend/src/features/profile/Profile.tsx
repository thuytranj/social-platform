import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { CalendarDays, MapPin, Link as LinkIcon, UserPlus, MessageCircle, Edit, Check, X, Clock } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PostCard } from '../feed/PostCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { EditProfileModal } from './EditProfileModal';
import { useAuth } from '../../store/AuthContext';
import { usersApi } from '../../api/users.api';
import { friendshipsApi } from '../../api/friendships.api';
import { QK } from '../../constants';
import { formatShortDate } from '../../utils/date';
import { useToast } from '../../store/ToastContext';
import { FriendRelation } from '../../types';

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.id === id;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendRelation>('none');

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: QK.USER(id!),
    queryFn: () => usersApi.getUserById(id!),
    enabled: !!id,
  });

  // Check friend status
  useEffect(() => {
    const checkFriendStatus = async () => {
      if (!id || !currentUser || isOwnProfile) return;
      try {
        // Fetch sent requests
        const sentReqs = await friendshipsApi.getSentRequests(100);
        const sentTo = sentReqs.data.some((f: any) => f.addressee_id === id);
        
        // Fetch received requests
        const recvReqs = await friendshipsApi.getReceivedRequests(100);
        const recvFrom = recvReqs.data.some((f: any) => f.requester_id === id);
        
        // Fetch friends
        const friends = await friendshipsApi.getFriends(100);
        const isFriend = friends.data.some((f: any) => f.id === id);
        
        if (isFriend) setFriendStatus('friends');
        else if (sentTo) setFriendStatus('sent');
        else if (recvFrom) setFriendStatus('received');
        else setFriendStatus('none');
      } catch (err) {
        setFriendStatus('none');
      }
    };
    checkFriendStatus();
  }, [id, currentUser, isOwnProfile]);

  const { ref, inView } = useInView();
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: postsStatus,
  } = useInfiniteQuery({
    queryKey: QK.USER_POSTS(id!),
    queryFn: ({ pageParam }) => usersApi.getUserPosts(id!, 10, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!id,
  });

  const { mutate: sendRequest, isPending: isSendingRequest } = useMutation({
    mutationFn: () => friendshipsApi.sendRequest(id!),
    onSuccess: () => {
      setFriendStatus('sent');
      success('Friend request sent');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to send request'),
  });

  const { mutate: confirmRequest, isPending: isConfirming } = useMutation({
    mutationFn: () => friendshipsApi.confirmRequest(id!),
    onSuccess: () => {
      setFriendStatus('friends');
      success('Friend request accepted');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to accept request'),
  });

  const { mutate: cancelRequest, isPending: isCanceling } = useMutation({
    mutationFn: () => friendshipsApi.cancelRequest(id!),
    onSuccess: () => {
      setFriendStatus('none');
      success('Request cancelled');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to cancel request'),
  });

  const { mutate: removeFriend, isPending: isRemoving } = useMutation({
    mutationFn: () => friendshipsApi.removeFriend(id!),
    onSuccess: () => {
      setFriendStatus('none');
      success('Friend removed');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to remove friend'),
  });

  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const posts = postsData?.pages.flatMap((page) => page.data) ?? [];

  if (isUserLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <Skeleton variant="rectangular" height={256} className="rounded-b-3xl" />
        <div className="px-6 -mt-16 sm:-mt-20">
          <Skeleton variant="circular" className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white dark:border-surface-50" />
          <div className="mt-4 space-y-3">
            <Skeleton width={200} height={32} />
            <Skeleton width={150} />
            <Skeleton width={300} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-20 text-gray-600 dark:text-ink-muted">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      {/* Cover Photo */}
      <div className="h-48 sm:h-64 bg-gray-200 dark:bg-surface-200 rounded-b-3xl overflow-hidden relative">
        {user.profile?.cover_url && (
          <img src={user.profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-8 -mt-16 sm:-mt-20 relative z-10 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            <div className="p-1 bg-white dark:bg-surface-50 rounded-full inline-block">
              <Avatar
                src={user.profile?.avatar_url}
                alt={user.username}
                className="w-32 h-32 sm:w-40 sm:h-40 shadow-lg"
              />
            </div>
            
            <div className="mb-2 sm:mb-4">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-ink">
                {user.profile?.full_name || user.username}
              </h1>
              <p className="text-gray-600 dark:text-ink-muted text-lg">@{user.username}</p>
            </div>
          </div>

          <div className="flex gap-2 sm:mb-4 flex-wrap">
            {isOwnProfile ? (
              <Button onClick={() => setIsEditModalOpen(true)} variant="secondary" className="gap-2">
                <Edit size={18} /> Edit Profile
              </Button>
            ) : (
              <>
                {friendStatus === 'friends' ? (
                  <>
                    <Button variant="secondary" className="gap-2" onClick={() => removeFriend()} disabled={isRemoving}>
                      <Check size={18} /> Friends
                    </Button>
                    <Button variant="secondary" className="gap-2">
                      <MessageCircle size={18} /> Message
                    </Button>
                  </>
                ) : friendStatus === 'sent' ? (
                  <Button variant="outline" className="gap-2" onClick={() => cancelRequest()} disabled={isCanceling}>
                    <Clock size={18} /> Request Sent
                  </Button>
                ) : friendStatus === 'received' ? (
                  <>
                    <Button className="gap-2" onClick={() => confirmRequest()} isLoading={isConfirming}>
                      <Check size={18} /> Accept Request
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => cancelRequest()} disabled={isCanceling}>
                      <X size={18} /> Decline
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="gap-2" onClick={() => sendRequest()} isLoading={isSendingRequest}>
                      <UserPlus size={18} /> Add Friend
                    </Button>
                    <Button variant="secondary" className="gap-2">
                      <MessageCircle size={18} /> Message
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 max-w-2xl">
          {user.profile?.bio && (
            <p className="text-gray-900 dark:text-ink whitespace-pre-wrap mb-4 text-[15px]">{user.profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-600 dark:text-ink-muted">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={16} />
              <span>Joined {formatShortDate(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs (Mocked for now) */}
      <div className="border-b border-gray-200 dark:border-white/10 mb-6 px-4 sm:px-8">
        <nav className="flex gap-6">
          <button className="border-b-2 border-primary-500 py-3 text-sm font-semibold text-primary-500">
            Posts
          </button>
          <button className="border-b-2 border-transparent py-3 text-sm font-medium text-gray-600 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink">
            About
          </button>
          <button className="border-b-2 border-transparent py-3 text-sm font-medium text-gray-600 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink">
            Friends
          </button>
          <button className="border-b-2 border-transparent py-3 text-sm font-medium text-gray-600 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink">
            Photos
          </button>
        </nav>
      </div>

      {/* Posts Feed */}
      <div className="max-w-2xl mx-auto px-4 sm:px-0 space-y-6">
        {postsStatus === 'pending' ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-surface-50 rounded-2xl p-5">
              <div className="flex gap-3 mb-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton width="40%" />
                  <Skeleton width="20%" height="0.8em" />
                </div>
              </div>
              <Skeleton variant="rectangular" height={200} />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-100 dark:bg-surface-200 rounded-2xl border border-gray-200 dark:border-white/10 border-dashed">
            <p className="text-gray-600 dark:text-ink-muted">No posts yet</p>
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

      {isOwnProfile && (
        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      )}
    </div>
  );
};
