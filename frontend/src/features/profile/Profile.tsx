import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import {
  CalendarDays,
  MapPin,
  Link as LinkIcon,
  UserPlus,
  MessageCircle,
  Edit,
  Check,
  X,
  Clock,
  Image as ImageIcon,
  Users,
  Briefcase,
  Cake,
  VenusAndMars,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
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
import { Tabs } from '../../components/ui/Tabs';
import { LightboxGallery } from '../../components/ui';

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.id === id;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendRelation>('none');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

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
    queryFn: ({ pageParam }) =>
      usersApi.getUserPosts(id!, 10, pageParam as string | undefined),
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
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to send request'),
  });

  const { mutate: confirmRequest, isPending: isConfirming } = useMutation({
    mutationFn: () => friendshipsApi.confirmRequest(id!),
    onSuccess: () => {
      setFriendStatus('friends');
      success('Friend request accepted');
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to accept request'),
  });

  const { mutate: cancelRequest, isPending: isCanceling } = useMutation({
    mutationFn: () => friendshipsApi.cancelRequest(id!),
    onSuccess: () => {
      setFriendStatus('none');
      success('Request cancelled');
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to cancel request'),
  });

  const { mutate: removeFriend, isPending: isRemoving } = useMutation({
    mutationFn: () => friendshipsApi.removeFriend(id!),
    onSuccess: () => {
      setFriendStatus('none');
      success('Friend removed');
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to remove friend'),
  });

  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const posts = postsData?.pages.flatMap((page) => page.data) ?? [];
  const allProfilePhotos = posts
    .flatMap((post) =>
      (post.postMedias ?? []).map(
        (media: any) => media.url ?? media?.media?.url,
      ),
    )
    .filter(Boolean);
  const featuredPhotos = allProfilePhotos.slice(0, 6);

  const stats = [
    { label: 'Posts', value: posts.length },
    { label: 'Followers', value: isOwnProfile ? '2.3K' : '1.1K' },
    { label: 'Following', value: isOwnProfile ? '235' : '180' },
  ];

  const tabs = [
    { label: 'Timeline', value: 'posts' },
    { label: 'About', value: 'about' },
    { label: 'Friends', value: 'friends' },
    { label: 'Photos', value: 'photos' },
  ];
  const [activeTab, setActiveTab] = useState('posts');

  if (isUserLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        <Skeleton variant="rectangular" height={320} className="rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Skeleton
              variant="rectangular"
              height={260}
              className="rounded-2xl"
            />
            <Skeleton
              variant="rectangular"
              height={180}
              className="rounded-2xl"
            />
          </div>
          <Skeleton
            variant="rectangular"
            height={520}
            className="rounded-2xl"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-600 dark:text-ink-muted">
        User not found
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Hero */}
        <Card elevated className="overflow-hidden">
          <div className="relative h-44 sm:h-64 bg-gradient-to-br from-primary-50 via-surface to-primary-100 dark:from-surface-700 dark:via-surface-800 dark:to-primary-950/40">
            {user.profile?.cover_url ? (
              <img
                src={user.profile.cover_url}
                alt="Cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(24,119,242,0.24),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(82,94,255,0.18),transparent_24%),linear-gradient(135deg,rgba(249,249,255,0.9),rgba(235,239,255,0.96))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(24,119,242,0.22),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(82,94,255,0.15),transparent_24%),linear-gradient(135deg,rgba(29,29,41,0.96),rgba(20,20,30,0.98))]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            <div className="absolute -bottom-12 left-4 sm:left-6">
              <div className="rounded-full p-1.5 bg-white dark:bg-surface-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                <Avatar
                  src={user.profile?.avatar_url}
                  alt={user.username}
                  className="w-24 h-24 sm:w-28 sm:h-28"
                />
              </div>
            </div>
          </div>

          <CardContent className="pt-14 sm:pt-16 pb-6 flex justify-between">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary dark:text-text-primary">
                    {user.profile?.full_name || user.username}
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-800/30 px-2.5 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    Verified
                  </span>
                </div>
                <p className="text-text-secondary dark:text-text-secondary text-sm sm:text-base">
                  @{user.username}
                </p>
              </div>

              {/* <div className="flex flex-wrap items-center gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="min-w-20 rounded-xl border border-border-subtle dark:border-border-variant bg-surface dark:bg-surface-700 px-4 py-3 text-center"
                  >
                    <div className="text-lg font-bold text-text-primary dark:text-text-primary">
                      {stat.value}
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-text-tertiary dark:text-text-tertiary">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div> */}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {isOwnProfile ? (
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="secondary"
                  className="gap-2 !text-white !bg-primary-700 dark:hover:!bg-primary-800"
                >
                  <Edit size={18} /> Edit Profile
                </Button>
              ) : (
                <>
                  {friendStatus === 'friends' ? (
                    <>
                      <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() => removeFriend()}
                        disabled={isRemoving}
                      >
                        <Check size={18} /> Friends
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <MessageCircle size={18} /> Message
                      </Button>
                    </>
                  ) : friendStatus === 'sent' ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => cancelRequest()}
                      disabled={isCanceling}
                    >
                      <Clock size={18} /> Request Sent
                    </Button>
                  ) : friendStatus === 'received' ? (
                    <>
                      <Button
                        className="gap-2"
                        onClick={() => confirmRequest()}
                        isLoading={isConfirming}
                      >
                        <Check size={18} /> Accept Request
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => cancelRequest()}
                        disabled={isCanceling}
                      >
                        <X size={18} /> Decline
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="gap-2"
                        onClick={() => sendRequest()}
                        isLoading={isSendingRequest}
                      >
                        <UserPlus size={18} /> Add Friend
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <MessageCircle size={18} /> Message
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>

           <Tabs
              tabs={tabs}
              defaultValue="posts"
              onChange={setActiveTab}
              className="px-4 sm:px-6 pt-1"
            >
              {activeTab === 'posts' && null}
            </Tabs>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] items-start">
          {/* Left rail */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-display text-lg font-semibold text-text-primary dark:text-text-primary">
                  Intro
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-text-secondary dark:text-text-secondary">
                  {user.profile?.bio ||
                    'No bio yet. Add a short introduction to let people know more about you.'}
                </p>

                <div className="space-y-3 text-sm text-text-secondary dark:text-text-secondary">
                  <div className="flex items-start gap-3">
                    <Cake size={16} className="mt-0.5 text-primary-600" />
                    <span>
                      {formatShortDate(user.profile?.date_of_birth) ||
                        'Date of birth not specified'}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <VenusAndMars
                      size={16}
                      className="mt-0.5 text-primary-600"
                    />
                    <span>{user.profile?.sex || 'Sex not specified'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users size={16} className="mt-0.5 text-primary-600" />
                    <span>Joined {formatShortDate(user.created_at)}</span>
                  </div>
                </div>

                {isOwnProfile && (
                  <Button
                    variant="secondary"
                    className="w-full !text-white justify-center !bg-primary-700 dark:hover:!bg-primary-800"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Edit Details
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-text-primary dark:text-text-primary">
                  Photos
                </h2>
                {allProfilePhotos.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveGalleryIndex(0);
                      setIsGalleryOpen(true);
                    }}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    See All
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {featuredPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {featuredPhotos.map((url, index) => {
                      const isLast = index === 5 && allProfilePhotos.length > 6;
                      const remainingCount = allProfilePhotos.length - 5;
                      return (
                        <button
                          key={`${url}-${index}`}
                          onClick={() => {
                            setActiveGalleryIndex(index);
                            setIsGalleryOpen(true);
                          }}
                          className="relative aspect-square overflow-hidden rounded-xl bg-surface dark:bg-surface-700 hover:opacity-90 active:scale-95 transition-all group"
                        >
                          <img
                            src={url}
                            alt="Profile photo"
                            className="h-full w-full object-cover"
                          />
                          {isLast && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-lg group-hover:bg-black/50 transition-colors">
                              +{remainingCount}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border-variant dark:border-border-variant bg-surface dark:bg-surface-700 p-4 text-sm text-text-secondary dark:text-text-secondary">
                    Photos will appear here once posts include media.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main rail */}
          <div className="space-y-6">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {postsStatus === 'pending' ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-5">
                        <div className="flex gap-3 mb-4">
                          <Skeleton variant="circular" width={40} height={40} />
                          <div className="flex-1 space-y-2 py-1">
                            <Skeleton width="40%" />
                            <Skeleton width="20%" height="0.8em" />
                          </div>
                        </div>
                        <Skeleton variant="rectangular" height={240} />
                      </CardContent>
                    </Card>
                  ))
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <ImageIcon
                        size={40}
                        className="mx-auto mb-3 text-text-tertiary"
                      />
                      <p className="text-text-secondary dark:text-text-secondary">
                        No posts yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                    <div
                      ref={ref}
                      className="h-10 flex items-center justify-center"
                    >
                      {isFetchingNextPage && (
                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <Card>
                <CardContent className="py-10 text-center text-text-secondary dark:text-text-secondary">
                  About content can be expanded here.
                </CardContent>
              </Card>
            )}

            {activeTab === 'friends' && (
              <Card>
                <CardContent className="py-10 text-center text-text-secondary dark:text-text-secondary">
                  Friends content can be expanded here.
                </CardContent>
              </Card>
            )}

            {activeTab === 'photos' && (
              <Card>
                <CardHeader>
                  <h2 className="font-display text-lg font-semibold text-text-primary dark:text-text-primary">
                    All Photos
                  </h2>
                </CardHeader>
                <CardContent>
                  {allProfilePhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {allProfilePhotos.map((url, idx) => (
                        <button
                          key={`${url}-${idx}`}
                          onClick={() => {
                            setActiveGalleryIndex(idx);
                            setIsGalleryOpen(true);
                          }}
                          className="relative aspect-square overflow-hidden rounded-xl bg-surface dark:bg-surface-700 hover:opacity-90 active:scale-95 transition-all"
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-text-secondary dark:text-text-secondary">
                      No photos available
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      <LightboxGallery
        images={allProfilePhotos}
        initialIndex={activeGalleryIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  );
};
