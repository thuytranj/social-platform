import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Trash2, AlertTriangle, Globe, Lock } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { groupsApi } from '../../api/groups.api';
import { QK } from '../../constants';
import { GroupRole, GroupMember } from '../../types';
import { useToast } from '../../store/ToastContext';
import { useNavigate } from 'react-router-dom';

interface GroupSettingsProps {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  groupPrivacy?: 'public' | 'private';
  myRole?: GroupRole | 'pending';
  isOwner: boolean;
}

export const GroupSettings = ({
  groupId,
  groupName,
  groupDescription,
  groupPrivacy,
  myRole,
  isOwner,
}: GroupSettingsProps) => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState(groupName);
  const [description, setDescription] = useState(groupDescription ?? '');
  const [privacy, setPrivacy] = useState<'public' | 'private'>(groupPrivacy ?? 'public');

  const { mutate: updateGroup, isPending: isUpdating } = useMutation({
    mutationFn: (data: { name: string; description?: string; privacy?: 'public' | 'private' }) =>
      groupsApi.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP(groupId) });
      queryClient.invalidateQueries({ queryKey: QK.GROUPS });
      success('Group information updated successfully!');
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to update group information');
    },
  });

  const handleUpdateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: any = {
      name: name.trim(),
      description: description.trim(),
    };
    if (isOwner) {
      payload.privacy = privacy;
    }
    updateGroup(payload);
  };

  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  // Join Requests
  const { data: joinRequestsData, isLoading: isLoadingRequests } = useInfiniteQuery({
    queryKey: QK.GROUP_JOIN_REQ(groupId),
    queryFn: ({ pageParam }) =>
      groupsApi.getJoinRequests(groupId, 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage as any).nextCursor || undefined,
    enabled: isAdminOrOwner,
  });

  const joinRequests: GroupMember[] =
    joinRequestsData?.pages.flatMap((p) => (p as any).data ?? []) ?? [];

  const { mutate: approve } = useMutation({
    mutationFn: (userId: string) => groupsApi.approveJoinRequest(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP_JOIN_REQ(groupId) });
      queryClient.invalidateQueries({ queryKey: QK.GROUP_MEMBERS(groupId) });
      success('Request approved');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to approve'),
  });

  const { mutate: reject } = useMutation({
    mutationFn: (userId: string) => groupsApi.rejectJoinRequest(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP_JOIN_REQ(groupId) });
      success('Request rejected');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to reject'),
  });

  const { mutate: deleteGroup, isPending: isDeleting } = useMutation({
    mutationFn: () => groupsApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUPS });
      success('Group deleted');
      navigate('/groups');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to delete group'),
  });

  return (
    <div className="space-y-6">
      {/* ── Edit Group Info ── */}
      {isAdminOrOwner && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">
            Group Information
          </h3>
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-ink placeholder-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your group..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-ink placeholder-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[100px] resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Privacy
              </label>
              {isOwner ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPrivacy('public')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      privacy === 'public'
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/10 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-ink hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`}
                  >
                    <Globe size={18} className="flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Public</p>
                      <p className="text-xs text-ink-muted">Anyone can view posts and join</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacy('private')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      privacy === 'private'
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/10 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-ink hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`}
                  >
                    <Lock size={18} className="flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Private</p>
                      <p className="text-xs text-ink-muted">Only members can view posts</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-surface-50 dark:bg-surface-850 rounded-xl border border-gray-200 dark:border-gray-750 flex items-center gap-3 text-ink-muted">
                  {privacy === 'public' ? <Globe size={18} /> : <Lock size={18} />}
                  <div>
                    <p className="text-sm font-medium capitalize">{privacy} Group</p>
                    <p className="text-[11px]">Only the group creator can modify privacy settings.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                disabled={!name.trim() || (name === groupName && description === (groupDescription ?? '') && privacy === groupPrivacy)}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Join Requests ── */}
      {isAdminOrOwner && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            Pending Join Requests
            {joinRequests.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                {joinRequests.length}
              </span>
            )}
          </h3>

          {isLoadingRequests ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-surface-200 dark:bg-surface-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-200 rounded w-1/3" />
                    <div className="h-2.5 bg-surface-200 rounded w-1/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : joinRequests.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">
              No pending join requests.
            </p>
          ) : (
            <div className="space-y-3">
              {joinRequests.map((req) => {
                const fullName =
                  req.user?.profile?.full_name ?? req.user?.username ?? 'Unknown';
                return (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    <Avatar
                      src={req.user?.profile?.avatar_url ?? undefined}
                      alt={fullName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{fullName}</p>
                      <p className="text-xs text-ink-muted">@{req.user?.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approve(req.user.id)}
                        className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100 transition-colors"
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => reject(req.user.id)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Danger Zone ── */}
      {isOwner && (
        <div className="card p-5 border border-red-200 dark:border-red-900/40">
          <h3 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2">
            <AlertTriangle size={15} />
            Danger Zone
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            Permanently deleting this group will remove all posts, members, and data. This
            action cannot be undone.
          </p>

          {!confirmDelete ? (
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete Group
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-600">
                Are you sure you want to delete{' '}
                <span className="font-bold">"{groupName}"</span>?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                  isLoading={isDeleting}
                  onClick={() => deleteGroup()}
                >
                  Yes, Delete Group
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
