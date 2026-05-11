import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  Users,
  FileText,
  CheckCircle2,
  UserPlus,
  Clock,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { usersApi } from '../../api/users.api';
import { friendshipsApi } from '../../api/friendships.api';
import { QK } from '../../constants';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { User } from '../../types';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: QK.SEARCH_USERS(debouncedQuery),
    queryFn: () => usersApi.searchByUsername(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const users = data?.data || [];

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-ink mb-4">
          Search
        </h1>
        <div className="max-w-2xl">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            leftIcon={<SearchIcon size={20} />}
            className="text-base h-12"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-ink mb-4">
          Results
        </h2>

        {debouncedQuery.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 dark:bg-surface-200 rounded-2xl border border-gray-200 dark:border-white/10 border-dashed">
            <SearchIcon
              size={48}
              className="mx-auto mb-4 text-gray-400 dark:text-ink-muted"
            />
            <p className="text-gray-600 dark:text-ink-muted">
              Start typing to search for users.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-surface-50 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3"
              >
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="40%" />
                  <Skeleton width="20%" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 dark:bg-surface-200 rounded-2xl border border-gray-200 dark:border-white/10 border-dashed">
            <p className="text-gray-600 dark:text-ink-muted">
              No users found matching "{debouncedQuery}"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <UserResult key={u.id} user={u} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const UserResult = ({ user }: { user: User }) => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [friendStatus, setFriendStatus] = useState<
    'none' | 'friends' | 'sent' | 'received'
  >('none');

  // Check friend status
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentUser) return;
      try {
        const sentReqs = await friendshipsApi.getSentRequests(100);
        const sentTo = sentReqs.data.some(
          (f: any) => f.addressee_id === user.id,
        );

        const recvReqs = await friendshipsApi.getReceivedRequests(100);
        const recvFrom = recvReqs.data.some(
          (f: any) => f.requester_id === user.id,
        );

        const friends = await friendshipsApi.getFriends(100);
        const isFriend = friends.data.some((f: any) => f.id === user.id);

        if (isFriend) setFriendStatus('friends');
        else if (sentTo) setFriendStatus('sent');
        else if (recvFrom) setFriendStatus('received');
        else setFriendStatus('none');
      } catch (err) {
        setFriendStatus('none');
      }
    };
    checkStatus();
  }, [user.id, currentUser]);

  const isMe = currentUser?.id === user.id;

  const { mutate: addFriend, isPending: isAdding } = useMutation({
    mutationFn: () => friendshipsApi.sendRequest(user.id),
    onSuccess: () => {
      setFriendStatus('sent');
      success('Friend request sent');
      queryClient.invalidateQueries({ queryKey: QK.SENT_REQUESTS });
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to send request'),
  });

  const { mutate: confirmRequest, isPending: isConfirming } = useMutation({
    mutationFn: () => friendshipsApi.confirmRequest(user.id),
    onSuccess: () => {
      setFriendStatus('friends');
      success('Friend request accepted');
      queryClient.invalidateQueries({ queryKey: QK.RECEIVED_REQUESTS });
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to accept request'),
  });

  const { mutate: cancelRequest, isPending: isCanceling } = useMutation({
    mutationFn: () => friendshipsApi.cancelRequest(user.id),
    onSuccess: () => {
      setFriendStatus('none');
      success('Request cancelled');
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to cancel request'),
  });

  return (
    <div className="bg-white dark:bg-surface-50 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <Link
        to={`/profile/${user.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <Avatar src={user.profile?.avatar_url} alt={user.username} size="lg" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-ink hover:text-primary-500 transition-colors truncate">
            {user.profile?.full_name || user.username}
          </p>
          <p className="text-sm text-gray-600 dark:text-ink-muted truncate">
            @{user.username}
          </p>
        </div>
      </Link>

      {!isMe && (
        <div>
          {friendStatus === 'friends' ? (
            <Button variant="secondary" size="sm" disabled>
              <CheckCircle2 size={16} className="mr-2" /> Friends
            </Button>
          ) : friendStatus === 'sent' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelRequest()}
              disabled={isCanceling}
            >
              <Clock size={16} className="mr-2" /> Pending
            </Button>
          ) : friendStatus === 'received' ? (
            <Button
              size="sm"
              onClick={() => confirmRequest()}
              isLoading={isConfirming}
            >
              <CheckCircle2 size={16} className="mr-2" /> Accept
            </Button>
          ) : (
            <Button size="sm" onClick={() => addFriend()} isLoading={isAdding}>
              <UserPlus size={16} className="mr-2" /> Add Friend
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
