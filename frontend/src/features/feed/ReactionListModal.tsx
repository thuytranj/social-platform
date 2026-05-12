import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useQuery } from '@tanstack/react-query';
import { reactionsApi } from '../../api/reactions.api';
import { QK, REACTION_CONFIG } from '../../constants';
import { ReactionType, ReactionTargetType, Reaction } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { formatRelativeTime } from '../../utils/date';

interface Props {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReactionListModal = ({ postId, isOpen, onClose }: Props) => {
  const [filter, setFilter] = useState<ReactionType | 'all'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: QK.POST_REACTIONS(postId),
    queryFn: () => reactionsApi.getReactions(postId, ReactionTargetType.POST, 50, undefined, filter === 'all' ? undefined : filter),
    enabled: isOpen,
  });

  const reactions = data?.data || [] as Reaction[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reactions" maxWidth="md">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setFilter('all'); refetch(); }}
          className={`px-3 py-1 rounded-full border ${filter === 'all' ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
        >
          All
        </button>
        {Object.entries(REACTION_CONFIG).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => { setFilter(type as ReactionType); refetch(); }}
            className={`px-3 py-1 rounded-full border flex items-center gap-2 ${filter === type ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
          >
            <span className="text-lg">{cfg.emoji}</span>
            <span className="hidden sm:inline text-sm">{cfg.label}</span>
          </button>
        ))}
      </div>

      <div>
        {isLoading ? (
          <div className="text-center text-sm text-gray-500">Loading...</div>
        ) : reactions.length === 0 ? (
          <div className="text-center text-sm text-gray-500">No reactions yet</div>
        ) : (
          <ul className="space-y-3">
            {reactions.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <Avatar src={r.author.profile?.avatar_url} alt={r.author.username} size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{r.author.profile?.full_name || r.author.username}</div>
                    <div className="text-xs text-gray-500">{formatRelativeTime(r.created_at)}</div>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <span className="text-lg leading-none">{REACTION_CONFIG[r.type].emoji}</span>
                    <span className="text-sm">{REACTION_CONFIG[r.type].label}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default ReactionListModal;
