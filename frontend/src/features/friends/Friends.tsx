import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { UserCheck, UserX, Clock, Ban } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { friendshipsApi } from '../../api/friendships.api';
import { useToast } from '../../store/ToastContext';
import { QK } from '../../constants';

export const Friends = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent' | 'blocked'>('friends');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">Friends</h1>
      </div>

      <div className="border-b border-border-base mb-6">
        <nav className="flex gap-6 overflow-x-auto no-scrollbar">
          {(['friends', 'requests', 'sent', 'blocked'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'friends' && <FriendsList />}
        {activeTab === 'requests' && <ReceivedRequests />}
        {activeTab === 'sent' && <SentRequests />}
        {activeTab === 'blocked' && <BlockedUsers />}
      </div>
    </div>
  );
};

// --- Sub-components ---

const FriendsList = () => {
  const { data, isLoading } = useQuery({
    queryKey: QK.FRIENDS,
    queryFn: () => friendshipsApi.getFriends(50),
  });
  
  const queryClient = useQueryClient();
  const { success } = useToast();

  const { mutate: removeFriend } = useMutation({
    mutationFn: friendshipsApi.removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.FRIENDS });
      success('Friend removed');
    }
  });

  if (isLoading) return <ListSkeleton />;
  
  const friends = data?.data || [];

  if (friends.length === 0) {
    return <EmptyState message="You don't have any friends yet." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {friends.map((user) => (
        <div key={user.id} className="card p-4 flex items-center justify-between">
          <Link to={`/profile/${user.id}`} className="flex items-center gap-3">
            <Avatar src={user.profile?.avatar_url} alt={user.username} size="lg" />
            <div>
              <p className="font-semibold text-ink hover:underline">
                {user.profile?.full_name || user.username}
              </p>
              <p className="text-sm text-ink-muted">@{user.username}</p>
            </div>
          </Link>
          <Button variant="outline" size="sm" onClick={() => removeFriend(user.id)}>
            <UserX size={16} className="mr-2" /> Remove
          </Button>
        </div>
      ))}
    </div>
  );
};

const ReceivedRequests = () => {
  const { data, isLoading } = useQuery({
    queryKey: QK.RECEIVED_REQUESTS,
    queryFn: () => friendshipsApi.getReceivedRequests(50),
  });

  const queryClient = useQueryClient();
  const { success } = useToast();

  const { mutate: acceptRequest } = useMutation({
    mutationFn: (requesterId: string) => friendshipsApi.confirmRequest(requesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.RECEIVED_REQUESTS });
      queryClient.invalidateQueries({ queryKey: QK.FRIENDS });
      success('Friend request accepted');
    }
  });

  const { mutate: rejectRequest } = useMutation({
    mutationFn: friendshipsApi.cancelRequest, // Can use cancelRequest for rejecting too if backend supports it
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.RECEIVED_REQUESTS });
    }
  });

  if (isLoading) return <ListSkeleton />;
  
  const requests = data?.data || [];

  if (requests.length === 0) {
    return <EmptyState message="No pending friend requests." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {requests.map((req) => (
        <div key={req.id} className="card p-4 flex items-center justify-between">
          <Link to={`/profile/${req.requester!.id}`} className="flex items-center gap-3">
            <Avatar src={req.requester!.profile?.avatar_url} alt={req.requester!.username} size="lg" />
            <div>
              <p className="font-semibold text-ink hover:underline">
                {req.requester!.profile?.full_name || req.requester!.username}
              </p>
            </div>
          </Link>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => acceptRequest(req.requester!.id)}>
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={() => rejectRequest(req.requester!.id)}>
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const SentRequests = () => {
  const { data, isLoading } = useQuery({
    queryKey: QK.SENT_REQUESTS,
    queryFn: () => friendshipsApi.getSentRequests(50),
  });

  const queryClient = useQueryClient();
  const { success } = useToast();

  const { mutate: cancelRequest } = useMutation({
    mutationFn: friendshipsApi.cancelRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.SENT_REQUESTS });
      success('Friend request cancelled');
    }
  });

  if (isLoading) return <ListSkeleton />;
  
  const requests = data?.data || [];

  if (requests.length === 0) {
    return <EmptyState message="No sent friend requests." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {requests.map((req) => (
        <div key={req.id} className="card p-4 flex items-center justify-between">
          <Link to={`/profile/${req.addressee!.id}`} className="flex items-center gap-3">
            <Avatar src={req.addressee!.profile?.avatar_url} alt={req.addressee!.username} size="lg" />
            <div>
              <p className="font-semibold text-ink hover:underline">
                {req.addressee!.profile?.full_name || req.addressee!.username}
              </p>
            </div>
          </Link>
          <Button variant="outline" size="sm" onClick={() => cancelRequest(req.addressee!.id)}>
            <Clock size={16} className="mr-2" /> Cancel
          </Button>
        </div>
      ))}
    </div>
  );
};

const BlockedUsers = () => {
  const { data, isLoading } = useQuery({
    queryKey: QK.BLOCKED_USERS,
    queryFn: () => friendshipsApi.getBlockedUsers(50),
  });

  const queryClient = useQueryClient();
  const { success } = useToast();

  const { mutate: unblockUser } = useMutation({
    mutationFn: friendshipsApi.unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.BLOCKED_USERS });
      success('User unblocked');
    }
  });

  if (isLoading) return <ListSkeleton />;
  
  const users = data?.data || [];

  if (users.length === 0) {
    return <EmptyState message="You haven't blocked anyone." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {users.map((user) => (
        <div key={user.id} className="card p-4 flex items-center justify-between opacity-75">
          <div className="flex items-center gap-3">
            <Avatar src={user.profile?.avatar_url} alt={user.username} size="lg" />
            <div>
              <p className="font-semibold text-ink">
                {user.profile?.full_name || user.username}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => unblockUser(user.id)}>
            <Ban size={16} className="mr-2" /> Unblock
          </Button>
        </div>
      ))}
    </div>
  );
};

const ListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="card p-4 flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-16 bg-surface-50 dark:bg-surface-200 rounded-2xl border border-border-base border-dashed">
    <p className="text-ink-muted">{message}</p>
  </div>
);
