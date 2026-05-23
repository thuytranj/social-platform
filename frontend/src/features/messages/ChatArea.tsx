import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowLeft,
  Info,
  Loader2,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { conversationsApi } from '../../api/conversations.api';
import { useAuth } from '../../store/AuthContext';
import { QK } from '../../constants';
import {
  Conversation,
  ConversationType,
  Message,
} from '../../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ChatAreaProps {
  conversationId: string;
  onBack: () => void;
  onToggleInfo: () => void;
  sendMessage: (data: {
    conversation_id: string;
    content: string;
    message_type?: string;
    reply_message_id?: string;
  }) => void;
  emitTyping: (convId: string) => void;
  emitStopTyping: (convId: string) => void;
  deleteMessage: (convId: string, messageId: string) => void;
  addReaction: (convId: string, messageId: string, reaction: string) => void;
  updateReaction: (convId: string, messageId: string, reaction: string) => void;
  removeReaction: (convId: string, messageId: string, reaction: string) => void;
  emitMarkAsRead: (convId: string) => void;
  typingUsers: Map<string, { fullName: string; avatar: string }>;
}

const getDayLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export const ChatArea = ({
  conversationId,
  onBack,
  onToggleInfo,
  sendMessage,
  emitTyping,
  emitStopTyping,
  deleteMessage,
  addReaction,
  updateReaction,
  removeReaction,
  emitMarkAsRead,
  typingUsers,
}: ChatAreaProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  // ---- Conversation detail ----
  const { data: conv } = useQuery({
    queryKey: QK.CONVERSATION(conversationId),
    queryFn: () => conversationsApi.getConversation(conversationId),
    enabled: !!conversationId,
  });

  // ---- Messages (infinite scroll) ----
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
  } = useInfiniteQuery({
    queryKey: QK.MESSAGES(conversationId),
    queryFn: ({ pageParam }) =>
      conversationsApi.getMessages(
        conversationId,
        50,
        pageParam as string | undefined,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!conversationId,
  });

  const messages =
    messagesData?.pages.flatMap((page) => page.data).reverse() ?? [];

  // ---- Scroll to bottom on new messages ----
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      // Only auto-scroll if we're near the bottom
      const container = scrollContainerRef.current;
      if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight <
          150;
        if (isNearBottom || prevMsgCountRef.current === 0) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  // ---- Mark conversation as read on load/change ----
  useEffect(() => {
    if (!conversationId) return;
    
    emitMarkAsRead(conversationId);
    
    conversationsApi.markAsRead(conversationId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: QK.CONVERSATIONS });
      })
      .catch((err) => {
        console.error('Failed to mark conversation as read:', err);
      });
  }, [conversationId, queryClient, emitMarkAsRead]);

  // ---- Helpers ----
  const getConvName = () => {
    if (!conv) return '';
    if (conv.type === ConversationType.GROUP)
      return conv.title || 'Group Chat';
    const otherMember = conv.other_user;
    return (
      otherMember?.profile?.full_name ||
      otherMember?.username ||
      'Unknown User'
    );
  };

  const getConvAvatar = () => {
    if (!conv) return null;
    if (conv.type === ConversationType.GROUP) return conv.thumbnail_url;
    const otherMember = conv.other_user;
    return otherMember?.profile?.avatar_url;
  };

  const handleReply = (msg: Message) => setReplyTo(msg);
  const handleCancelReply = () => setReplyTo(null);

  const handleDelete = (msg: Message) => {
    setMessageToDelete(msg);
  };

  const handleReact = (msg: Message, reaction: string) => {
    const myReaction = msg.reactions?.find(
      (r) => r.author_id === user?.id || r.author?.id === user?.id,
    );
    if (myReaction) {
      if (myReaction.type === reaction) {
        removeReaction(conversationId, msg.id, reaction);
      } else {
        updateReaction(conversationId, msg.id, reaction);
      }
    } else {
      addReaction(conversationId, msg.id, reaction);
    }
  };

  // Group messages by day
  const getMessageGroups = () => {
    const groups: Array<{ label: string; messages: Message[] }> = [];
    let currentGroup: { label: string; messages: Message[] } | null = null;

    for (const msg of messages) {
      const label = getDayLabel(msg.sent_at);
      if (!currentGroup || currentGroup.label !== label) {
        currentGroup = { label, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    }

    return groups;
  };

  // Typing indicator text
  const typingText = (() => {
    const entries = Array.from(typingUsers.values());
    if (entries.length === 0) return null;
    if (entries.length === 1) return `${entries[0].fullName} is typing`;
    if (entries.length === 2)
      return `${entries[0].fullName} and ${entries[1].fullName} are typing`;
    return `${entries[0].fullName} and ${entries.length - 1} others are typing`;
  })();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-surface-900">
      {/* ---- Header ---- */}
      <div className="glass-header h-16 px-4 flex items-center gap-3 z-10 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-600 text-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <Avatar src={getConvAvatar()} alt={getConvName()} size="md" />

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-ink text-[15px] truncate tracking-tight">
            {getConvName()}
          </h3>
          {typingText ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span className="text-xs text-primary-500 font-medium">
                {typingText}
              </span>
            </div>
          ) : (
            <p className="text-xs text-ink-faint">
              {conv?.type === ConversationType.GROUP
                ? `${conv.members?.length || 0} members`
                : 'Online'}
            </p>
          )}
        </div>

        <button
          onClick={onToggleInfo}
          className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-600 text-ink-muted hover:text-ink transition-colors"
          title="Conversation info"
        >
          <Info size={20} />
        </button>
      </div>

      {/* ---- Messages ---- */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col"
      >
        {/* Load older */}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="self-center mb-4 text-sm text-primary-500 font-medium py-2 px-4 rounded-full hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors flex items-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading...
              </>
            ) : (
              'Load older messages'
            )}
          </button>
        )}

        {isLoadingMessages ? (
          <div className="space-y-4 mt-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex gap-3 ${i % 2 === 0 ? '' : 'justify-end'}`}
              >
                {i % 2 === 0 && (
                  <Skeleton variant="circular" width={32} height={32} />
                )}
                <Skeleton width={200 + Math.random() * 100} height={40} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-ink-muted text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {getMessageGroups().map((group) => (
              <div key={group.label}>
                {/* Day separator */}
                <div className="day-separator">
                  <span className="text-[11px] font-medium text-ink-faint tracking-wide uppercase px-2">
                    {group.label}
                  </span>
                </div>

                {/* Messages in group */}
                <div className="space-y-3">
                  {group.messages.map((msg, idx) => {
                    const isMine = msg.sender.id === user?.id;
                    const showAvatar = !isMine;

                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                    const timeDiff = prevMsg
                      ? new Date(msg.sent_at).getTime() - new Date(prevMsg.sent_at).getTime()
                      : 0;
                    const showTimeSeparator = timeDiff > 60 * 60 * 1000; // > 1 hour

                    return (
                      <div key={msg.id} id={`message-${msg.id}`} className="msg-slide-in">
                        {showTimeSeparator && (
                          <div className="flex justify-center my-6">
                            <span className="text-[10px] font-semibold text-ink-faint bg-surface-100 dark:bg-surface-800/40 px-3 py-1 rounded-full border border-gray-200/50 dark:border-white/[0.04] select-none">
                              {format(new Date(msg.sent_at), 'HH:mm MMMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <MessageBubble
                          message={msg}
                          isMine={isMine}
                          showAvatar={showAvatar}
                          isGroup={conv?.type === ConversationType.GROUP}
                          onReply={handleReply}
                          onDelete={isMine ? handleDelete : undefined}
                          onReact={handleReact}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Typing indicators */}
        {Array.from(typingUsers.entries()).map(([userId, typingUser]) => (
          <div key={userId} className="flex gap-3 items-end mt-2 mb-4 animate-pulse">
            <Avatar src={typingUser.avatar} alt={typingUser.fullName || 'User'} size="sm" />
            <div className="bg-gray-100 dark:bg-surface-800 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5 border border-gray-200/50 dark:border-white/[0.04]">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input ---- */}
      <ChatInput
        conversationId={conversationId}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        onSendViaSocket={sendMessage}
        onTypingStart={() => emitTyping(conversationId)}
        onTypingStop={() => emitStopTyping(conversationId)}
      />

      {messageToDelete && (
        <ConfirmDeleteModal
          isOpen={!!messageToDelete}
          onClose={() => setMessageToDelete(null)}
          onConfirm={() => {
            if (messageToDelete) {
              deleteMessage(conversationId, messageToDelete.id);
            }
          }}
        />
      )}
    </div>
  );
};
