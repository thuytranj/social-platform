import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Reply,
  Pencil,
  Trash2,
  SmilePlus,
  FileText,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Message, MessageType, User, ReactionType } from '../../types';
import { formatTime } from '../../utils/date';
import { MessageReactionListModal } from './MessageReactionListModal';
import { useAuth } from '../../store/AuthContext';
import { LightboxGallery } from '../../components/ui';
import { downloadFile } from '../../utils/file';
import { conversationsApi } from '../../api/conversations.api';

const REACTION_EMOJIS = [
  { type: ReactionType.LIKE, emoji: '👍' },
  { type: ReactionType.LOVE, emoji: '❤️' },
  { type: ReactionType.HAHA, emoji: '😂' },
  { type: ReactionType.WOW, emoji: '😮' },
  { type: ReactionType.SAD, emoji: '😢' },
  { type: ReactionType.ANGRY, emoji: '😡' },
];

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReact?: (message: Message, reactionType: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MessageBubble = ({
  message,
  isMine,
  showAvatar = true,
  isGroup = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) => {
  const { user } = useAuth();
  const isRevoked = message.message_type === MessageType.REVOKED;
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // ---- Revoked message ----
  if (isRevoked) {
    return (
      <div
        className={`flex gap-3 max-w-[75%] ${isMine ? 'ml-auto flex-row-reverse' : ''}`}
      >
        {!isMine && showAvatar && (
          <Link
            to={`/profile/${message.sender.id}`}
            className="shrink-0 mt-1 hover:opacity-85 transition-opacity"
          >
            <Avatar
              src={message.sender.profile?.avatar_url}
              alt={message.sender.username}
              size="sm"
            />
          </Link>
        )}
        <div
          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
        >
          <div className="px-4 py-2.5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 text-ink-faint italic text-sm flex items-center gap-2">
            This message was deleted
          </div>
          <span className="text-[10px] text-ink-faint mt-2 px-1">
            {formatTime(message.sent_at)}
          </span>
        </div>
      </div>
    );
  }

  // ---- Normal message ----
  const hasMedia =
    message.medias && message.medias.length > 0;
  const hasFiles = message.files && message.files.length > 0;

  return (
    <div
      className={`msg-bubble-wrapper group flex gap-2.5 max-w-[75%] ${isMine ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {!isMine && showAvatar && (
        <Link
          to={`/profile/${message.sender.id}`}
          className="shrink-0 mt-1 hover:opacity-85 transition-opacity"
        >
          <Avatar
            src={message.sender.profile?.avatar_url}
            alt={message.sender.username}
            size="sm"
          />
        </Link>
      )}

      {/* Bubble */}
      <div
        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} min-w-0`}
      >
        <div className={`relative max-w-full flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          {/* Reply quote */}
          {message.reply_message && (
            <button
              onClick={() => {
                const targetId = `message-${message.reply_message?.id}`;
                const element = document.getElementById(targetId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.remove('highlight-message');
                  void element.offsetWidth; // Trigger reflow to restart animation
                  element.classList.add('highlight-message');
                  setTimeout(() => {
                    element.classList.remove('highlight-message');
                  }, 1800);
                }
              }}
              className={`mb-2 w-full flex flex-col text-[12px] p-2 rounded-lg text-left transition-all cursor-pointer hover:opacity-90 active:scale-[0.98] bg-gray-100 dark:bg-surface-700/60 border-l-2 border-primary-500 dark:border-primary-400 text-ink-muted hover:bg-gray-200 dark:hover:bg-surface-700`}
            >
              <p className="truncate opacity-80">
                {message.reply_message.content || 'Attachment'}
              </p>
            </button>
          )}

          {/* Media attachments */}
          {hasMedia && (
            <>
              <div
                className={`mb-1 grid gap-1 max-w-xs ${message.medias.length === 1
                  ? 'grid-cols-1'
                  : message.medias.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2'
                  }`}
              >
                {message.medias.map((media, idx) => (
                  <button
                    key={media.id}
                    onClick={() => {
                      setActiveGalleryIndex(idx);
                      setIsGalleryOpen(true);
                    }}
                    className="relative rounded-xl overflow-hidden active:scale-[0.98] transition-transform duration-200 hover:brightness-95 focus:outline-none"
                  >
                    <img
                      src={media.url}
                      alt="attachment"
                      className="w-full h-auto max-h-64 object-cover rounded-xl"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
              <LightboxGallery
                images={message.medias.map((m) => m.url)}
                initialIndex={activeGalleryIndex}
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
              />
            </>
          )}

          {/* Text content */}
          {message.content && (
            <div
              className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${isMine
                ? 'bubble-sent rounded-br-sm'
                : 'bubble-received rounded-bl-sm'
                }`}
            >
              {message.content}
            </div>
          )}

          {/* File attachments */}
          {hasFiles && (
            <div className="mt-1 space-y-1.5 w-full max-w-xs">
              {message.files.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const fileName = file.file_name || file.url.substring(file.url.lastIndexOf('/') + 1);
                      const signedUrl = await conversationsApi.getFileDownloadUrl(
                        message.conversation_id,
                        fileName
                      );
                      downloadFile(signedUrl, file.original_name);
                    } catch (error) {
                      console.error('Failed to get download URL', error);
                      downloadFile(file.url, file.original_name);
                    }
                  }}
                  className="file-card flex items-center gap-3 px-3.5 py-2.5 hover:scale-[1.01] transition-transform cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <FileText
                      size={18}
                      className="text-primary-600 dark:text-primary-400"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {file.original_name}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                  <Download
                    size={16}
                    className="text-ink-faint shrink-0"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Absolute reaction pill */}
          {message.reactions && message.reactions.length > 0 ? (() => {
            const rxTypes = Array.from(new Set(message.reactions.map((r) => r.type)));
            const emojis = rxTypes.map((t) => REACTION_EMOJIS.find((re) => re.type === t)?.emoji || '').join('');
            return (
              <button
                onClick={() => setShowReactionsModal(true)}
                className={`absolute -bottom-2.5 z-10 bg-white dark:bg-surface-800 border border-gray-200 dark:border-white/10 rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px] shadow-sm hover:scale-105 transition-transform ${isMine ? 'right-2' : 'left-2'
                  }`}
              >
                <span className="flex items-center gap-0.5">{emojis}</span>
                {(message.reactions.length > 1 || isGroup) && (
                  <span className="font-semibold text-ink">{message.reactions.length}</span>
                )}
              </button>
            );
          })() : (message.react_count > 0 && (
            <button
              onClick={() => setShowReactionsModal(true)}
              className={`absolute -bottom-2.5 z-10 bg-white dark:bg-surface-800 border border-gray-200 dark:border-white/10 rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px] shadow-sm hover:scale-105 transition-transform ${isMine ? 'right-2' : 'left-2'
                }`}
            >
              <span>❤️</span>
              {(message.react_count > 1 || isGroup) && (
                <span className="font-semibold text-ink">{message.react_count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer: Timestamp */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-ink-faint mt-2">
            {formatTime(message.sent_at)}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div
        className={`msg-actions self-center flex items-center gap-0.5 ${isMine ? 'flex-row-reverse' : ''}`}
      >
        {onReply && (
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-600 text-ink-faint hover:text-ink transition-colors"
            title="Reply"
          >
            <Reply size={14} />
          </button>
        )}
        {onReact && (
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-600 text-ink-faint hover:text-ink transition-colors"
              title="React"
            >
              <SmilePlus size={14} />
            </button>
            {showReactionPicker && (() => {
              const myReaction = message.reactions?.find((rx) => rx.author_id === user?.id || rx.author?.id === user?.id);
              return (
                <div className={`absolute top-full mt-1 ${isMine ? 'right-0' : 'left-0'} flex items-center gap-1 bg-white dark:bg-surface-800 border border-gray-200 dark:border-white/10 shadow-lg rounded-full px-2 py-1.5 z-20`}>
                  {REACTION_EMOJIS.map((r) => {
                    const isActive = myReaction?.type === r.type;
                    return (
                      <button
                        key={r.type}
                        onClick={() => {
                          onReact(message, r.type);
                          setShowReactionPicker(false);
                        }}
                        className={`hover:scale-125 transition-all duration-150 text-base px-2 py-1 rounded-full ${isActive
                          ? 'border border-primary-500 bg-primary-500/10 dark:bg-primary-500/20'
                          : 'border border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                      >
                        {r.emoji}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
        {isMine && onEdit && (
          <button
            onClick={() => onEdit(message)}
            className="p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-600 text-ink-faint hover:text-ink transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
        )}
        {isMine && onDelete && (
          <button
            onClick={() => onDelete(message)}
            className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-faint hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {showReactionsModal && (
        <MessageReactionListModal
          reactions={message.reactions || []}
          isOpen={showReactionsModal}
          onClose={() => setShowReactionsModal(false)}
          onRemoveMyReaction={(reactionType) => {
            if (onReact) {
              onReact(message, reactionType);
            }
          }}
        />
      )}
    </div>
  );
};
