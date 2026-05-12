import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, X } from 'lucide-react';
import { reactionsApi } from '../../api/reactions.api';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { QK, REACTION_CONFIG } from '../../constants';
import { Reaction, ReactionTargetType, ReactionType } from '../../types';
import { formatRelativeTime } from '../../utils/date';

interface Props {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

const visibleTypes: ReactionType[] = [
  ReactionType.LIKE,
  ReactionType.HAHA,
  ReactionType.LOVE,
];

const overflowTypes: ReactionType[] = [
  ReactionType.WOW,
  ReactionType.SAD,
  ReactionType.ANGRY,
];

export const ReactionListModal = ({ postId, isOpen, onClose }: Props) => {
  const [filter, setFilter] = useState<ReactionType | 'all'>('all');
  const [showMore, setShowMore] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QK.POST_REACTIONS(postId, 'all'),
    queryFn: () =>
      reactionsApi.getReactions(postId, ReactionTargetType.POST, 200),
    enabled: isOpen,
  });

  const allReactions = data?.data || ([] as Reaction[]);

  const counts = useMemo(() => {
    return allReactions.reduce<Record<string, number>>(
      (acc, reaction) => {
        acc.all = (acc.all || 0) + 1;
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      { all: 0 },
    );
  }, [allReactions]);

  const reactions =
    filter === 'all'
      ? allReactions
      : allReactions.filter((reaction) => reaction.type === filter);

  const tabClass = (active: boolean) =>
    `relative flex items-center gap-2 whitespace-nowrap px-1 pb-4 text-[15px] font-semibold transition-colors ${
      active
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-gray-500 hover:text-gray-900 dark:text-ink-muted dark:hover:text-ink'
    }`;

  const activeLine = (
    <span className="absolute inset-x-0 -bottom-px h-1 rounded-full bg-primary-500" />
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}  title="Reactions" maxWidth="2xl">
      <div className="-m-6 overflow-hidden rounded-[28px] bg-white dark:bg-surface-50">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 pt-4 dark:border-white/10 sm:px-6">
          <div className="flex min-w-max items-end gap-6">
            <button
              onClick={() => {
                setFilter('all');
                setShowMore(false);
              }}
              className={tabClass(filter === 'all')}
            >
              All
              {filter === 'all' && activeLine}
            </button>

            {visibleTypes.map((type) => {
              const config = REACTION_CONFIG[type];
              const active = filter === type;

              return (
                <button
                  key={type}
                  onClick={() => {
                    setFilter(type);
                    setShowMore(false);
                  }}
                  className={tabClass(active)}
                >
                  <span className="text-[22px] leading-none">
                    {config.emoji}
                  </span>
                  <span>{counts[type] ?? 0}</span>
                  {active && activeLine}
                </button>
              );
            })}

            <div className="relative index-10">
              <button
                onClick={() => setShowMore((current) => !current)}
                className={tabClass(false) + ' pr-1'}
              >
                See more
                <ChevronDown size={16} />
              </button>

              {showMore && (
                <div className="absolute left-0 top-full z-30 mt-2 w-52 rounded-[22px] border border-gray-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-surface-50">
                  {overflowTypes.map((type) => {
                    const config = REACTION_CONFIG[type];
                    const active = filter === type;

                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setFilter(type);
                          setShowMore(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-colors ${
                          active
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-ink-muted dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-[22px] leading-none">
                            {config.emoji}
                          </span>
                          <span className="font-medium">{config.label}</span>
                        </span>
                        <span className="text-sm font-semibold">
                          {counts[type] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-ink-muted">
              Loading...
            </div>
          ) : reactions.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-ink-muted">
              No reactions yet
            </div>
          ) : (
            <ul className="space-y-2.5">
              {reactions.map((reaction) => (
                <li
                  key={reaction.id}
                  className="flex items-center gap-3 rounded-[22px] px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={reaction.author.profile?.avatar_url}
                      alt={reaction.author.username}
                      size="md"
                    />
                    <span
                      className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full text-[13px] ring-2 ring-white dark:ring-surface-50"
                      style={{
                        backgroundColor: REACTION_CONFIG[reaction.type].color,
                      }}
                    >
                      {REACTION_CONFIG[reaction.type].emoji}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 truncate text-[15px] font-semibold text-gray-900 dark:text-ink">
                        {reaction.author.profile?.full_name ||
                          reaction.author.username}
                      </div>
                      <div className="shrink-0 text-xs text-gray-500 dark:text-ink-faint">
                        {formatRelativeTime(reaction.created_at)}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-ink-muted">
                      {REACTION_CONFIG[reaction.type].label}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReactionListModal;
