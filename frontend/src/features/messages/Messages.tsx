import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { QK } from '../../constants';
import { Message } from '../../types';
import { useConversationSocket } from './useConversationSocket';
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { ConversationInfoPanel } from './ConversationInfoPanel';
import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../../api/conversations.api';

export const Messages = () => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const queryClient = useQueryClient();

  // Typing users state
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { fullName: string; avatar: string }>
  >(new Map());

  // ---- Conversation socket ----
  const {
    sendMessage,
    emitTyping,
    emitStopTyping,
    deleteMessage,
    addReaction,
    updateReaction,
    removeReaction,
    emitMarkAsRead,
  } = useConversationSocket({
    conversationId: activeConvId,
    onNewMessage: useCallback(
      (msg: Message) => {
        // Invalidate messages
        queryClient.invalidateQueries({
          queryKey: QK.MESSAGES(msg.conversation_id),
        });

        if (activeConvId === msg.conversation_id) {
          conversationsApi.markAsRead(msg.conversation_id).then(() => {
            queryClient.invalidateQueries({
              queryKey: QK.CONVERSATIONS,
            });
          }).catch((err) => {
            console.error('Failed to mark active conversation as read:', err);
          });
        } else {
          queryClient.invalidateQueries({
            queryKey: QK.CONVERSATIONS,
          });
        }
      },
      [queryClient, activeConvId],
    ),
    onMessageUpdated: useCallback(
      (msg: Message) => {
        queryClient.invalidateQueries({
          queryKey: QK.MESSAGES(msg.conversation_id),
        });
      },
      [queryClient],
    ),
    onMessageDeleted: useCallback(
      (msgId: string) => {
        if (activeConvId) {
          queryClient.invalidateQueries({
            queryKey: QK.MESSAGES(activeConvId),
          });
          queryClient.invalidateQueries({
            queryKey: QK.CONVERSATIONS,
          });
        }
      },
      [queryClient, activeConvId],
    ),
    onTyping: useCallback(
      (data: { userId: string; fullName: string; avatar: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, {
            fullName: data.fullName,
            avatar: data.avatar,
          });
          return next;
        });
      },
      [],
    ),
    onStopTyping: useCallback(
      (data: { userId: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
      },
      [],
    ),
    onMessageReacted: useCallback(
      () => {
        if (activeConvId) {
          queryClient.invalidateQueries({
            queryKey: QK.MESSAGES(activeConvId),
          });
        }
      },
      [queryClient, activeConvId],
    ),
    onMessageUnreacted: useCallback(
      () => {
        if (activeConvId) {
          queryClient.invalidateQueries({
            queryKey: QK.MESSAGES(activeConvId),
          });
        }
      },
      [queryClient, activeConvId],
    ),
    onMessageRead: useCallback(
      () => {
        queryClient.invalidateQueries({
          queryKey: QK.CONVERSATIONS,
        });
      },
      [queryClient],
    ),
  });

  // Clear typing users when conversation changes
  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setTypingUsers(new Map());
    setShowInfoPanel(false);
  };

  // ---- Active conversation data for info panel ----
  const { data: activeConv } = useQuery({
    queryKey: QK.CONVERSATION(activeConvId || ''),
    queryFn: () => conversationsApi.getConversation(activeConvId!),
    enabled: !!activeConvId,
  });

  return (
    <div className="flex h-[calc(100vh-4rem-env(safe-area-inset-bottom))] md:h-[calc(100vh-4rem)]  border-t border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-900 overflow-hidden">

      {/* Center: Chat area */}
      {activeConvId ? (
        <ChatArea
          conversationId={activeConvId}
          onBack={() => setActiveConvId(null)}
          onToggleInfo={() => setShowInfoPanel((p) => !p)}
          sendMessage={sendMessage}
          emitTyping={emitTyping}
          emitStopTyping={emitStopTyping}
          deleteMessage={deleteMessage}
          addReaction={addReaction}
          updateReaction={updateReaction}
          removeReaction={removeReaction}
          emitMarkAsRead={emitMarkAsRead}
          typingUsers={typingUsers}
        />
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white dark:bg-surface-900 p-8 text-center border-l border-gray-200 dark:border-white/[0.06]">
          <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
            <Send size={36} className="text-primary-500 ml-1" />
          </div>
          <h2 className="text-2xl font-display font-bold text-ink tracking-tight mb-2">
            Your Messages
          </h2>
          <p className="text-ink-muted max-w-md text-sm leading-relaxed">
            Select a conversation from the sidebar to start chatting with your
            friends and groups.
          </p>
        </div>
      )}

      {/* Right: Info panel */}
      {showInfoPanel && activeConv && (
        <ConversationInfoPanel
          conversation={activeConv}
          onClose={() => setShowInfoPanel(false)}
        />
      )}

      {/* Conversation list */}
      <ConversationList
        activeConvId={activeConvId}
        onSelect={handleSelectConv}
        isHidden={!!activeConvId}
      />
    </div>
  );
};
