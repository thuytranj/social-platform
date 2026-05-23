import React, { useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { REACTION_CONFIG } from '../../constants';
import { Reaction, ReactionType } from '../../types';
import { formatRelativeTime } from '../../utils/date';
import { useAuth } from '../../store/AuthContext';

interface Props {
  reactions: Reaction[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveMyReaction?: (reactionType: string) => void;
}

const ALL_TYPES: ReactionType[] = [
  ReactionType.LIKE,
  ReactionType.LOVE,
  ReactionType.HAHA,
  ReactionType.WOW,
  ReactionType.SAD,
  ReactionType.ANGRY,
];

export const MessageReactionListModal = ({
  reactions,
  isOpen,
  onClose,
  onRemoveMyReaction,
}: Props) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ReactionType | 'all'>('all');

  const counts = useMemo(() => {
    return reactions.reduce<Record<string, number>>(
      (acc, reaction) => {
        acc.all = (acc.all || 0) + 1;
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      { all: 0 },
    );
  }, [reactions]);

  const filteredReactions = useMemo(() => {
    if (filter === 'all') return reactions;
    return reactions.filter((r) => r.type === filter);
  }, [reactions, filter]);

  // Only show tabs for reaction types that actually exist
  const existingTypes = useMemo(() => {
    return ALL_TYPES.filter((type) => (counts[type] ?? 0) > 0);
  }, [counts]);

  const tabClass = (active: boolean) =>
    `relative flex items-center gap-1.5 whitespace-nowrap px-3 pb-3 text-sm font-semibold transition-colors ${
      active
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-gray-500 hover:text-gray-900 dark:text-ink-muted dark:hover:text-ink'
    }`;

  const activeLine = (
    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-500" />
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Reactions" maxWidth="md">
      <div className="flex flex-col h-[50vh] -m-6 bg-white dark:bg-surface-900 rounded-[28px] overflow-hidden pt-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/10 px-4 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={tabClass(filter === 'all')}
          >
            <span>All</span>
            <span className="text-xs bg-gray-100 dark:bg-surface-800 px-1.5 py-0.5 rounded-full">
              {counts.all || 0}
            </span>
            {filter === 'all' && activeLine}
          </button>

          {existingTypes.map((type) => {
            const config = REACTION_CONFIG[type];
            const active = filter === type;

            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={tabClass(active)}
              >
                <span className="text-lg leading-none">{config.emoji}</span>
                <span className="text-xs bg-gray-100 dark:bg-surface-800 px-1.5 py-0.5 rounded-full">
                  {counts[type] ?? 0}
                </span>
                {active && activeLine}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {filteredReactions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-ink-muted">
              No reactions
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReactions.map((rx) => {
                const isMyReaction = rx.author_id === user?.id || rx.author?.id === user?.id;
                return (
                  <div
                    key={rx.id}
                    onClick={() => {
                      if (isMyReaction && onRemoveMyReaction) {
                        onRemoveMyReaction(rx.type);
                      }
                    }}
                    className={`flex items-center gap-3 py-1.5 px-2 rounded-xl transition-colors group/rx ${
                      isMyReaction
                        ? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/10'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={rx.author?.profile?.avatar_url}
                        alt={rx.author?.username}
                        size="md"
                      />
                      <span
                        className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] ring-2 ring-white dark:ring-surface-900"
                        style={{
                          backgroundColor: REACTION_CONFIG[rx.type].color,
                        }}
                      >
                        {REACTION_CONFIG[rx.type].emoji}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-ink truncate flex flex-col">
                          {rx.author?.profile?.full_name || rx.author?.username || 'Unknown User'}
                          {isMyReaction && (
                            <span className="text-[11px] font-normal text-primary-500 group-hover/rx:text-red-500 transition-colors">
                              Tap to remove
                            </span>
                          )}
                        </span>
                        {rx.created_at && (
                          <span className="text-[10px] text-gray-400 dark:text-ink-faint shrink-0">
                            {formatRelativeTime(rx.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
