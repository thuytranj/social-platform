import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Check, Users } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { friendshipsApi } from '../../api/friendships.api';
import { conversationsApi } from '../../api/conversations.api';
import { useToast } from '../../store/ToastContext';
import { QK } from '../../constants';
import { ConversationType } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
}

export const CreateGroupModal = ({
  isOpen,
  onClose,
  onSelectConversation,
}: CreateGroupModalProps) => {
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: friendsData, isLoading } = useQuery({
    queryKey: QK.FRIENDS,
    queryFn: () => friendshipsApi.getFriends(100),
    enabled: isOpen,
  });

  const friends = friendsData?.data || [];

  const { mutate: createGroup, isPending } = useMutation({
    mutationFn: () =>
      conversationsApi.createGroupConversation(groupTitle, selectedIds),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: QK.CONVERSATIONS });
      success('Group chat created successfully');
      onSelectConversation(newConv.id);
      handleClose();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to create group chat');
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setGroupTitle('');
    setSelectedIds([]);
    setSearchQuery('');
    onClose();
  };

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const filteredFriends = friends.filter((friend) => {
    const fullName = friend.profile?.full_name || '';
    const username = friend.username || '';
    const term = searchQuery.toLowerCase();
    return (
      fullName.toLowerCase().includes(term) ||
      username.toLowerCase().includes(term)
    );
  });

  const selectedFriends = friends.filter((f) => selectedIds.includes(f.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) {
      error('Please enter a group name');
      return;
    }
    if (selectedIds.length === 0) {
      error('Please select at least one friend to add');
      return;
    }
    createGroup();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Glass Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl shadow-2xl border border-gray-150 dark:border-white/[0.08] flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <Users className="text-primary-600 dark:text-primary-400" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                Create Group Chat
              </h3>
              <p className="text-xs text-ink-muted">
                Create a conversation with multiple friends
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto no-scrollbar">
            {/* Group Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Project Avengers"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                maxLength={50}
                className="w-full bg-surface-50 dark:bg-surface-900 border border-gray-200 dark:border-white/[0.06] focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 rounded-2xl px-4 py-3.5 text-sm text-ink placeholder:text-ink-faint transition-all"
              />
            </div>

            {/* Selected Avatars Stack */}
            {selectedFriends.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                  Members ({selectedIds.length})
                </label>
                <div className="flex flex-wrap gap-2 py-1">
                  {selectedFriends.map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => toggleSelect(friend.id)}
                      className="group flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-medium cursor-pointer border border-primary-100 dark:border-primary-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-150 dark:hover:border-red-500/20 transition-all active:scale-95"
                    >
                      <Avatar
                        src={friend.profile?.avatar_url}
                        alt={friend.username}
                        size="xs"
                      />
                      <span>{friend.profile?.full_name || friend.username}</span>
                      <X size={12} className="text-primary-500 group-hover:text-red-500 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Friends */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Add Friends
              </label>
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-gray-200 dark:border-white/[0.06] focus:border-primary-500 focus:outline-none pl-11 pr-4 py-3 rounded-2xl text-sm text-ink placeholder:text-ink-faint transition-all"
                />
              </div>
            </div>

            {/* Friends List */}
            <div className="space-y-2 flex-1 min-h-[180px]">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <Skeleton variant="circular" width={36} height={36} />
                      <div className="flex-1 space-y-2">
                        <Skeleton width="50%" />
                        <Skeleton width="30%" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-ink-muted text-sm border border-dashed border-gray-200 dark:border-white/[0.06] rounded-2xl">
                  {searchQuery ? 'No friends match your search' : 'No friends to display'}
                </div>
              ) : (
                <div className="space-y-1 divide-y divide-gray-50 dark:divide-white/[0.02] max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredFriends.map((friend) => {
                    const isSelected = selectedIds.includes(friend.id);
                    return (
                      <div
                        key={friend.id}
                        onClick={() => toggleSelect(friend.id)}
                        className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-900 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={friend.profile?.avatar_url}
                            alt={friend.username}
                            size="md"
                          />
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {friend.profile?.full_name || friend.username}
                            </p>
                            <p className="text-xs text-ink-faint">
                              @{friend.username}
                            </p>
                          </div>
                        </div>

                        {/* Custom Premium Checkbox */}
                        <div
                          className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary-600 border-primary-600 scale-105 shadow-xs'
                              : 'border-gray-300 dark:border-white/20'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-white stroke-[3px]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-surface-50 dark:bg-surface-800 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isPending}
              disabled={isPending || !groupTitle.trim() || selectedIds.length === 0}
              className="rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 shadow-lg shadow-primary-500/10"
            >
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
