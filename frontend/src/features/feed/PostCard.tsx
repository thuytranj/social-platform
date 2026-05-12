import { Link } from 'react-router-dom';
import { Post, ReactionType, ReactionTargetType } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { formatRelativeTime } from '../../utils/date';
import { MessageCircle, Share2, MoreHorizontal, ThumbsUp } from 'lucide-react';
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

  const privacyIcon = PRIVACY_CONFIG[post.privacy].getIcon();

  const formatCount = (count: number) => {
    if (count < 1000) return `${count}`;

    const compact = (count / 1000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    });

    return `${compact}K`;
  };

  const reactionBadges = post.user_reaction
    ? [
        post.user_reaction,
        post.user_reaction === ReactionType.LOVE
          ? ReactionType.LIKE
          : ReactionType.LOVE,
      ]
    : [ReactionType.LIKE, ReactionType.LOVE];

  return (
    <>
      <div className="bg-white dark:bg-surface-50 border border-gray-200/80 dark:border-white/10 rounded-[28px] p-4 sm:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-shadow duration-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author.id}`}>
              <Avatar
                src={post.author.profile?.avatar_url}
                alt={post.author.username}
                size="md"
              />
            </Link>
            <div>
              <Link
                to={`/profile/${post.author.id}`}
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
                {post.group_id && (
                  <>
                    <span>•</span>
                    <Link
                      to={`/groups/${post.group_id}`}
                      className="font-medium hover:text-primary-500"
                    >
                      {post.group_name}
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

        {/* Stats (interactive) */}
        {(post.react_count > 0 ||
          post.comment_count > 0 ||
          post.share_count > 0) && (
          <div className="flex items-center justify-between py-3 text-sm text-gray-600 dark:text-slate-400 border-b border-gray-200 dark:border-white/10 mb-2">
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="relative">
                {showReactionPicker && (
                  <div
                    className="absolute -bottom-16 left-0 mb-2 z-20"
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
                  onMouseEnter={openReactionPicker}
                  onMouseLeave={closeReactionPicker}
                  onClick={() => setShowReactors(true)}
                  className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                  aria-label={`${post.react_count} reactions`}
                >
                  <ThumbsUp
                    size={18}
                    className="text-gray-600 dark:text-slate-400"
                  />
                  <span className="text-[15px] font-medium text-gray-600 dark:text-slate-400">
                    {formatCount(post.react_count)}
                  </span>
                </button>
              </div>

              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-2.5"
              >
                <MessageCircle
                  size={18}
                  className="text-gray-600 dark:text-slate-400"
                />
                <span className="text-[15px] font-medium text-gray-600 dark:text-slate-400">
                  {formatCount(post.comment_count)}
                </span>
              </button>

              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2.5"
              >
                <Share2
                  size={18}
                  className="text-gray-600 dark:text-slate-400"
                />
                <span className="text-[15px] font-medium text-gray-600 dark:text-slate-400">
                  {formatCount(post.share_count)}
                </span>
              </button>
            </div>

            <div
              className="flex items-center -space-x-2 cursor-pointer"
              onClick={() => setShowReactors(true)}
            >
              {reactionBadges.map((type, index) => (
                <span
                  key={`${type}-${index}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] shadow-[0_2px_6px_rgba(15,23,42,0.12)] ring-2 ring-white dark:ring-[#13131b]"
                  style={{ backgroundColor: REACTION_CONFIG[type].color }}
                >
                  {REACTION_CONFIG[type].emoji}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReactionListModal
        postId={post.id}
        isOpen={showReactors}
        onClose={() => setShowReactors(false)}
      />
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
