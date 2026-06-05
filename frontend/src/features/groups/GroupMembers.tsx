import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Shield, Crown, UserMinus, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { groupsApi } from '../../api/groups.api';
import { QK } from '../../constants';
import { GroupRole, GroupMember } from '../../types';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';

interface GroupMembersProps {
  groupId: string;
  myRole?: GroupRole | 'pending';
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: {
    label: 'Owner',
    icon: <Crown size={11} />,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  admin: {
    label: 'Admin',
    icon: <Shield size={11} />,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  moderator: {
    label: 'Moderator',
    icon: <Shield size={11} />,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  member: {
    label: 'Member',
    icon: null,
    color: 'bg-surface-100 text-ink-muted dark:bg-surface-700',
  },
};

const MemberMenu = ({
  member,
  groupId,
  myRole,
}: {
  member: GroupMember;
  groupId: string;
  myRole?: GroupRole | 'pending' | string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const isActorOwner = myRole === GroupRole.OWNER;
  const isActorAdmin = myRole === GroupRole.ADMIN;

  const canTransferOwnership = isActorOwner && member.role !== GroupRole.OWNER;
  const canManageAdmin = isActorOwner && member.role !== GroupRole.OWNER;
  const canRemoveMember = (isActorOwner && member.role !== GroupRole.OWNER) || (isActorAdmin && member.role === GroupRole.MEMBER);

  const canManage = canTransferOwnership || canManageAdmin || canRemoveMember;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { mutate: removeMember } = useMutation({
    mutationFn: () => groupsApi.removeMember(groupId, member.user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP_MEMBERS(groupId) });
      success('Member removed');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to remove member'),
  });

  const { mutate: addAdmin } = useMutation({
    mutationFn: () => groupsApi.addAdmin(groupId, member.user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP_MEMBERS(groupId) });
      success('Admin role granted');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to grant admin'),
  });

  const { mutate: removeAdmin } = useMutation({
    mutationFn: () => groupsApi.removeAdmin(groupId, member.user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP_MEMBERS(groupId) });
      success('Admin role removed');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to remove admin'),
  });

  const { mutate: transferOwnership } = useMutation({
    mutationFn: () => groupsApi.transferOwnership(groupId, member.user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.GROUP(groupId) });
      queryClient.invalidateQueries({ queryKey: QK.GROUP_MEMBERS(groupId) });
      success('Ownership transferred');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to transfer ownership'),
  });

  if (!canManage) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 text-ink-muted transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute card right-0 top-8 w-[200px] flex flex-col z-10 rounded-md shadow-elevated py-2 text-sm">
          {canManageAdmin && member.role === GroupRole.MEMBER && (
            <button
              onClick={() => { addAdmin(); setOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-ink transition-colors flex items-center gap-2"
            >
              <Shield size={14} /> Make Admin
            </button>
          )}
          {canManageAdmin && member.role === GroupRole.ADMIN && (
            <button
              onClick={() => { removeAdmin(); setOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-ink transition-colors flex items-center gap-2"
            >
              <Shield size={14} /> Remove Admin
            </button>
          )}
          {canTransferOwnership && (
            <button
              onClick={() => { transferOwnership(); setOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-ink transition-colors flex items-center gap-2"
            >
              <Crown size={14} /> Transfer Ownership
            </button>
          )}
          {canRemoveMember && (
            <button
              onClick={() => { removeMember(); setOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-red-500 transition-colors flex items-center gap-2"
            >
              <UserMinus size={14} /> Remove Member
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const GroupMembers = ({ groupId, myRole }: GroupMembersProps) => {
  const { ref, inView } = useInView();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: QK.GROUP_MEMBERS(groupId),
    queryFn: ({ pageParam }) =>
      groupsApi.getGroupMembers(groupId, 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage as any).nextCursor || undefined,
  });

  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const members: GroupMember[] = data?.pages.flatMap((p) => (p as any).data ?? []) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
              <div className="h-2.5 bg-surface-200 dark:bg-surface-700 rounded w-1/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-ink-muted text-sm">
        No members found.
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-ink-muted mb-4">{members.length} members</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {members.map((member) => {
          const role = member.role as string;
          const roleConf = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
          const fullName = member.user?.profile?.full_name ?? member.user?.username ?? 'Unknown';
          const avatarUrl = member.user?.profile?.avatar_url ?? undefined;

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group"
            >
              <Avatar src={avatarUrl} alt={fullName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{fullName}</p>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleConf.color}`}
                >
                  {roleConf.icon}
                  {roleConf.label}
                </span>
              </div>
              <MemberMenu member={member} groupId={groupId} myRole={myRole} />
            </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={ref} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
