import { Link } from 'react-router-dom';
import { Post, ReactionType, ReactionTargetType } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { formatRelativeTime } from '../../utils/date';
import { MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { REACTION_CONFIG, PRIVACY_CONFIG } from '../../constants';
import { Dropdown } from '../../components/ui/Dropdown';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactionsApi } from '../../api/reactions.api';
import { QK } from '../../constants';
import { ReactionListModal } from './ReactionListModal';
import { useAuth } from '../../store/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { CommentSection } from '../comments/CommentSection';
import { SharePostModal } from '../posts/SharePostModal';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
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
      post.user_reaction === type
        ? reactionsApi.removeReaction(post.id, ReactionTargetType.POST)
        : post.user_reaction
          ? reactionsApi.updateReaction(post.id, ReactionTargetType.POST, type)
          : reactionsApi.addReaction(post.id, ReactionTargetType.POST, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.FEEDS });
    },
  });

  const handleReact = (type: ReactionType) => {
    reactMutation.mutate(type);
    setShowReactionPicker(false);
  };

  const isAuthor = user?.id === post.author_id;

  const dropdownItems = isAuthor
    ? [
        { label: 'Edit Post', onClick: () => console.log('edit') },
        {
          label: 'Delete Post',
          onClick: () => console.log('delete'),
          danger: true,
        },
      ]
    : [
        {
          label: 'Report Post',
          onClick: () => console.log('report'),
          danger: true,
        },
      ];

  const privacyIcon = PRIVACY_CONFIG[post.privacy].icon;

  return (
    <>
      <div className="bg-white dark:bg-surface-50 border border-gray-200/80 dark:border-white/10 rounded-[28px] p-4 sm:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-shadow duration-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author_id}`}>
              <Avatar
                src={post.author.profile?.avatar_url}
                alt={post.author.username}
                size="md"
              />
            </Link>
            <div>
              <Link
                to={`/profile/${post.author_id}`}
                className="font-semibold text-gray-900 dark:text-ink hover:text-primary-500 transition-colors"
              >
                {post.author.profile?.full_name || post.author.username}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-ink-muted">
                <span>{formatRelativeTime(post.created_at)}</span>
                <span>•</span>
                <span title={PRIVACY_CONFIG[post.privacy].label}>
                  {privacyIcon}
                </span>
                {post.group && (
                  <>
                    <span>•</span>
                    <Link
                      to={`/groups/${post.group_id}`}
                      className="font-medium hover:text-primary-500"
                    >
                      {post.group.name}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <Dropdown items={dropdownItems} />
        </div>

        {/* Content */}
        <div className="mb-4 text-gray-900 dark:text-ink whitespace-pre-wrap text-[15px]">
          {post.content}
        </div>

        {/* Media */}
        {post.postMedias?.length > 0 && (
          <div
            className={`mb-4 grid gap-1 rounded-xl overflow-hidden ${
              post.postMedias.length > 1
                ? post.postMedias.length > 2
                  ? 'media-grid-3'
                  : 'media-grid-2'
                : 'grid-cols-1'
            }`}
          >
            {post.postMedias.slice(0, 3).map((media, i) => (
              <div
                key={media.id}
                className="relative aspect-square sm:aspect-auto sm:max-h-96"
              >
                {media.media_type === 'video' ? (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-full object-cover bg-black"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt="Post media"
                    className="w-full h-full object-cover"
                  />
                )}
                {i === 2 && post.postMedias.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-[2px] cursor-pointer hover:bg-black/40 transition-colors">
                    +{post.postMedias.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {(post.react_count > 0 ||
          post.comment_count > 0 ||
          post.share_count > 0) && (
          <div className="flex items-center justify-between py-3 text-sm text-gray-600 dark:text-slate-400 border-b border-gray-200 dark:border-white/10 mb-2">
            <div className="flex items-center gap-1.5">
              {post.react_count > 0 && (
                <button
                  onClick={() => setShowReactors(true)}
                  className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <span className="flex -space-x-1">
                    <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-500/25 ring-1 ring-white dark:ring-[#1f2235] flex items-center justify-center text-[11px]">
                      👍
                    </span>
                  </span>
                  <span className="font-medium">{post.react_count}</span>
                </button>
              )}
            </div>
            <div className="flex gap-4">
              {post.comment_count > 0 && (
                <span>{post.comment_count} comments</span>
              )}
              {post.share_count > 0 && <span>{post.share_count} shares</span>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-stretch justify-between pt-0.5 relative gap-3">
          {/* Reaction Action */}
          <div
            className="relative flex-1"
            onMouseEnter={openReactionPicker}
            onMouseLeave={closeReactionPicker}
          >
            {showReactionPicker && (
              <div
                className="absolute bottom-full left-0 mb-2 pt-2 z-20"
                onMouseEnter={openReactionPicker}
                onMouseLeave={closeReactionPicker}
              >
                <div className="reaction-picker animate-slide-up pointer-events-auto">
                {Object.entries(REACTION_CONFIG).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => handleReact(type as ReactionType)}
                    className="reaction-emoji hover-lift tooltip-trigger"
                    title={config.label}
                  >
                    {config.emoji}
                  </button>
                ))}
                </div>
              </div>
            )}

            <button
              className={`flex items-center justify-center gap-2 w-full h-12 rounded-full font-semibold text-[15px] transition-colors border
                ${
                  post.user_reaction
                    ? 'text-primary-600 bg-primary-50 border-primary-100 dark:text-primary-200 dark:bg-primary-500/12 dark:border-primary-400/30'
                    : 'text-gray-600 dark:text-slate-300 bg-gray-50/80 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                }`}
              onClick={() => handleReact(post.user_reaction ? post.user_reaction : ReactionType.LIKE)}
            >
              {post.user_reaction ? (
                <span className="text-lg leading-none">
                  {REACTION_CONFIG[post.user_reaction].emoji}
                </span>
              ) : (
                <span className="text-lg leading-none grayscale opacity-70">
                  👍
                </span>
              )}
              <span className="hidden sm:inline">
                {post.user_reaction
                  ? REACTION_CONFIG[post.user_reaction].label
                  : 'Like'}
              </span>
            </button>
          </div>

          {/* Comment Action */}
          <button
            onClick={() => setShowComments(true)}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full font-semibold text-[15px] text-gray-600 dark:text-slate-300 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <MessageCircle size={23} />
            <span>Comment</span>
          </button>

          {/* Share Action */}
          <button
            onClick={() => setShowShare(true)}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full font-semibold text-[15px] text-gray-600 dark:text-slate-300 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <Share2 size={23} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ReactionListModal postId={post.id} isOpen={showReactors} onClose={() => setShowReactors(false)} />
      <Modal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        title="Comments"
        maxWidth="md"
      >
        <CommentSection postId={post.id} />
      </Modal>

      <SharePostModal
        post={post}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </>
  );
};
