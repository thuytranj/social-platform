import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatRelativeTime } from '../../utils/date';
import { REACTION_CONFIG } from '../../constants';
import { Avatar } from '../../components/ui/Avatar';
import { useEffect, useRef, useState } from 'react';
import { Comment, ReactionType, ReactionTargetType } from '../../types';
import { reactionsApi } from '../../api/reactions.api';
import { QK } from '../../constants';
import { useAuth } from '../../store/AuthContext';

interface CommentCardProps {
  comment: Comment;
  postId: string;
}

export const CommentCard = ({ comment, postId }: CommentCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionCloseTimer = useRef<number | null>(null);

  const openReactionPicker = () => {
    if (reactionCloseTimer.current) {
      window.clearTimeout(reactionCloseTimer.current);
      reactionCloseTimer.current = null;
    }

    setShowReactionPicker(true);
  };

  const closeReactionPicker = () => {
    if (reactionCloseTimer.current) {
      window.clearTimeout(reactionCloseTimer.current);
    }

    reactionCloseTimer.current = window.setTimeout(() => {
      setShowReactionPicker(false);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (reactionCloseTimer.current) {
        window.clearTimeout(reactionCloseTimer.current);
      }
    };
  }, []);

  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) =>
      comment.user_reaction === type
        ? reactionsApi.removeReaction(comment.id, ReactionTargetType.COMMENT)
        : comment.user_reaction
          ? reactionsApi.updateReaction(
              comment.id,
              ReactionTargetType.COMMENT,
              type,
            )
          : reactionsApi.addReaction(
              comment.id,
              ReactionTargetType.COMMENT,
              type,
            ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.POST_COMMENTS(postId) });
    },
  });

  const handleReact = (type: ReactionType) => {
    reactMutation.mutate(type);
    setShowReactionPicker(false);
  };

  return (
    <div className="flex gap-3">
      <Link to={`/profile/${comment.author_id}`}>
        <Avatar
          src={comment.author.profile?.avatar_url}
          alt={comment.author.username}
          size="sm"
        />
      </Link>
      <div className="flex-1">
        <div className="bg-gray-50 dark:bg-surface-900 rounded-2xl p-3 border border-gray-200 dark:border-white/10">
          <Link
            to={`/profile/${comment.author_id}`}
            className="font-semibold text-gray-900 dark:text-ink hover:underline text-sm"
          >
            {comment.author.profile?.full_name || comment.author.username}
          </Link>
          <p className="text-gray-900 dark:text-ink text-sm whitespace-pre-wrap mt-1">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-ink-muted">
          <span>{formatRelativeTime(comment.created_at)}</span>
          {comment.react_count > 0 && (
            <span>{comment.react_count} reactions</span>
          )}

          {/* Reaction Picker */}
          <div
            className="relative"
            onMouseEnter={openReactionPicker}
            onMouseLeave={closeReactionPicker}
          >
            {showReactionPicker && (
              <div
                className="absolute bottom-full left-0 mb-2 pt-2 z-10"
                onMouseEnter={openReactionPicker}
                onMouseLeave={closeReactionPicker}
              >
                <div className="reaction-picker animate-slide-up">
                  {Object.entries(REACTION_CONFIG).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => handleReact(type as ReactionType)}
                      className="reaction-emoji hover-lift"
                      title={config.label}
                    >
                      {config.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              className="hover:text-primary-500 transition-colors"
              onClick={() =>
                handleReact(
                  comment.user_reaction
                    ? comment.user_reaction
                    : ReactionType.LIKE,
                )
              }
            >
              {comment.user_reaction
                ? REACTION_CONFIG[comment.user_reaction].emoji
                : '👍'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
