import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Post, ReactionType, ReactionTargetType } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { formatRelativeTime } from '../../utils/date';
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ThumbsUp,
} from 'lucide-react';
import { REACTION_CONFIG, PRIVACY_CONFIG, QK } from '../../constants';
import { Dropdown } from '../../components/ui/Dropdown';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactionsApi } from '../../api/reactions.api';
import { ReactionListModal } from './ReactionListModal';
import { useAuth } from '../../store/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { CommentSection } from '../comments/CommentSection';
import { SharePostModal } from '../posts/SharePostModal';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
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
      if (reactionCloseTimer.current)
        window.clearTimeout(reactionCloseTimer.current);
    };
  }, []);

  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) =>
      post.user_reaction === type
        ? reactionsApi.removeReaction(post.id, ReactionTargetType.POST)
        : post.user_reaction
          ? reactionsApi.updateReaction(post.id, ReactionTargetType.POST, type)
          : reactionsApi.addReaction(post.id, ReactionTargetType.POST, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK.FEEDS }),
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
  const isGroupPost = Boolean(post.group_id || post.group_name || post.group);
  const groupName = post.group?.name || post.group_name || 'Group';
  const groupHref = post.group_id ? `/groups/${post.group_id}` : null;
  const groupCoverUrl =
    post.group?.cover_url ?? (post as any).group_cover_url ?? null;
  const displayName = post.author.profile?.full_name || post.author.username;

  const shouldCollapseContent =
    post.content.length > 280 || post.content.split('\n').length > 4;
  const contentPreviewClassName =
    shouldCollapseContent && !isContentExpanded
      ? 'max-h-32 overflow-hidden'
      : '';

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

  // Normalize media shapes: either { id, url, type/media_type } or { media: { id, url, type } }
  const medias = (post.postMedias ?? []).map((m: any) => ({
    id: m.id ?? m.media?.id,
    url: m.url ?? m.media?.url,
    media_type: m.media_type ?? m.type ?? m.media?.type,
  }));

  return (
    <>
      <div className="bg-white dark:bg-surface-50 border border-gray-200/80 dark:border-white/10 rounded-[28px] p-4 sm:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-shadow duration-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {isGroupPost ? (
              <div className="relative shrink-0 pt-1 pr-2">
                <Link
                  to={groupHref || '/groups'}
                  className="block h-12 w-12 overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-100 shadow-sm"
                >
                  {groupCoverUrl ? (
                    <img
                      src={groupCoverUrl}
                      alt={groupName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-500 to-accent-500 text-white font-semibold flex items-center justify-center">
                      {groupName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </Link>

                <Link
                  to={`/profile/${post.author.id}`}
                  className="absolute -bottom-1.5 right-0 rounded-full ring-2 ring-white dark:ring-surface-50 shadow-md"
                >
                  <Avatar
                    src={post.author.profile?.avatar_url}
                    alt={post.author.username}
                    size="sm"
                  />
                </Link>
              </div>
            ) : (
              <Link to={`/profile/${post.author.id}`} className="shrink-0">
                <Avatar
                  src={post.author.profile?.avatar_url}
                  alt={post.author.username}
                  size="md"
                />
              </Link>
            )}

            <div className="min-w-0 pt-1">
              {isGroupPost ? (
                groupHref ? (
                  <Link
                    to={groupHref}
                    className="block font-semibold text-gray-900 dark:text-ink hover:text-primary-500 transition-colors truncate"
                  >
                    {groupName}
                  </Link>
                ) : (
                  <span className="block font-semibold text-gray-900 dark:text-ink truncate">
                    {groupName}
                  </span>
                )
              ) : (
                <Link
                  to={`/profile/${post.author.id}`}
                  className="font-semibold text-gray-900 dark:text-ink hover:text-primary-500 transition-colors"
                >
                  {displayName}
                </Link>
              )}

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-ink-muted mt-0.5">
                {isGroupPost ? (
                  <>
                    <Link
                      to={`/profile/${post.author.id}`}
                      className="font-medium hover:text-primary-500 transition-colors"
                    >
                      {post.author.username}
                    </Link>
                    <span>•</span>
                  </>
                ) : null}
                <span>{formatRelativeTime(post.created_at)}</span>
                <span>•</span>
                <span title={PRIVACY_CONFIG[post.privacy].label}>
                  {privacyIcon}
                </span>
              </div>
            </div>
          </div>

          <Dropdown items={dropdownItems} />
        </div>

        {/* Content */}
        <div className="mb-4">
          <div
            className={`text-gray-900 dark:text-ink whitespace-pre-wrap text-[15px] transition-[max-height] duration-300 ${contentPreviewClassName}`}
          >
            {post.content}
          </div>

          {shouldCollapseContent && (
            <button
              type="button"
              onClick={() => setIsContentExpanded((p) => !p)}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors"
            >
              {isContentExpanded ? 'Ẩn bớt' : 'Xem thêm'}{' '}
              {isContentExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          )}
        </div>

        {/* Media */}
        {medias.length > 0 && (
          <div
            className={`mb-4 grid gap-1 rounded-xl overflow-hidden ${medias.length > 1 ? (medias.length > 2 ? 'media-grid-3' : 'media-grid-2') : 'grid-cols-1'}`}
          >
            {medias.slice(0, 3).map((media, i) => (
              <div
                key={media.id || i}
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
                {i === 2 && medias.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-[2px] cursor-pointer hover:bg-black/40 transition-colors">
                    +{medias.length - 3}
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
