import { useState, useEffect, useRef } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Send, Image as ImageIcon, Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { conversationsApi } from '../../api/conversations.api';
import { useAuth } from '../../store/AuthContext';
import { useSocket } from '../../socket/SocketContext';
import { QK, SOCKET_EVENTS } from '../../constants';
import { Conversation, Message, ConversationType } from '../../types';
import { formatTime } from '../../utils/date';

export const Messages = () => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-4rem-env(safe-area-inset-bottom))] md:h-[calc(100vh-4rem)] -mx-4 md:-mx-8 -mt-6 md:-mt-8 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-surface-50">
      <ConversationList activeConvId={activeConvId} onSelect={setActiveConvId} />
      {activeConvId ? (
        <ChatArea conversationId={activeConvId} onBack={() => setActiveConvId(null)} />
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white dark:bg-surface-50 p-8 text-center border-l border-gray-200 dark:border-white/10">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6">
            <Send size={40} className="text-primary-500 ml-1" />
          </div>
          <h2 className="text-2xl font-display font-bold text-ink mb-2">Your Messages</h2>
          <p className="text-ink-muted max-w-md">
            Select a conversation or start a new one to chat with your friends and groups.
          </p>
        </div>
      )}
    </div>
  );
};

const ConversationList = ({ activeConvId, onSelect }: { activeConvId: string | null, onSelect: (id: string) => void }) => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: QK.CONVERSATIONS,
    queryFn: () => conversationsApi.getConversations(50),
  });

  const convs = data?.data || [];

  const getConvName = (conv: Conversation) => {
    if (conv.type === ConversationType.GROUP) return conv.title || 'Group Chat';
    const otherMember = (conv.members || []).find((m) => m.user_id !== user?.id);
    return otherMember?.user.profile?.full_name || otherMember?.user.username || 'Unknown User';
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === ConversationType.GROUP) return null; // Can return a group avatar if supported
    const otherMember = (conv.members || []).find((m) => m.user_id !== user?.id);
    return otherMember?.user.profile?.avatar_url;
  };

  return (
    <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-surface-50 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="text-xl font-display font-bold text-ink mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full bg-gray-100 dark:bg-surface-200 pl-10 pr-4 py-2 rounded-xl text-sm text-gray-900 dark:text-ink placeholder:text-gray-500 dark:placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
           Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 mb-1">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton width="60%" />
                <Skeleton width="80%" />
              </div>
            </div>
          ))
        ) : convs.length === 0 ? (
          <div className="text-center p-8 text-gray-600 dark:text-ink-muted">No conversations yet</div>
        ) : (
          convs.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-1 ${
                activeConvId === conv.id ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-surface-50 dark:hover:bg-surface-200'
              }`}
            >
              <Avatar src={getConvAvatar(conv)} alt={getConvName(conv)} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-ink truncate text-sm">{getConvName(conv)}</h3>
                  {conv.last_message && (
                    <span className="text-xs text-ink-faint shrink-0 ml-2">
                      {formatTime(conv.last_message.sent_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-muted truncate">
                  {conv.last_message ? conv.last_message.content : 'No messages yet'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ChatArea = ({ conversationId, onBack }: { conversationId: string, onBack: () => void }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conv } = useQuery({
    queryKey: QK.CONVERSATION(conversationId),
    queryFn: () => conversationsApi.getConversation(conversationId),
    enabled: !!conversationId,
  });

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: QK.MESSAGES(conversationId),
    queryFn: ({ pageParam }) => conversationsApi.getMessages(conversationId, 50, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!conversationId,
  });

  const messages = messagesData?.pages.flatMap((page) => page.data).reverse() ?? [];

  // Scroll to bottom on new messages (simplified)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (newMessage: Message) => {
      // In a real app, update the react-query cache. Here we just invalidate.
      queryClient.invalidateQueries({ queryKey: QK.MESSAGES(conversationId) });
      queryClient.invalidateQueries({ queryKey: QK.CONVERSATIONS });
    });

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
    };
  }, [socket, conversationId, queryClient]);

  const [inputMsg, setInputMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket) return;

    // Send via socket
    socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      conversation_id: conversationId,
      content: inputMsg,
      message_type: 'text'
    });

    setInputMsg('');
  };

  const getConvName = () => {
    if (!conv) return '';
    if (conv.type === ConversationType.GROUP) return conv.title || 'Group Chat';
    const otherMember = (conv.members || []).find((m) => m.user_id !== user?.id);
    return otherMember?.user.profile?.full_name || otherMember?.user.username || 'Unknown User';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-surface-50">
      {/* Header */}
      <div className="h-16 px-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-3 bg-white/80 dark:bg-surface-50/80 backdrop-blur-md z-10 shrink-0">
        <button onClick={onBack} className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-200 text-gray-900 dark:text-ink">
          &larr;
        </button>
        <div className="font-semibold text-ink text-lg truncate">{getConvName()}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {hasNextPage && (
          <button 
            onClick={() => fetchNextPage()} 
            disabled={isFetchingNextPage}
            className="self-center text-sm text-primary-500 font-medium py-2"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
          </button>
        )}
        
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMine ? 'ml-auto flex-row-reverse' : ''}`}>
              {!isMine && (
                <Avatar src={msg.sender.profile?.avatar_url} alt={msg.sender.username} size="sm" className="shrink-0 mt-1" />
              )}
              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-[15px] ${
                  isMine 
                    ? 'bg-gradient-to-br from-primary-600 to-accent-500 text-white rounded-br-sm shadow-sm shadow-primary-500/20' 
                    : 'bg-white dark:bg-surface-200 text-ink rounded-bl-sm border border-border-base shadow-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-ink-faint mt-1 px-1">
                  {formatTime(msg.sent_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-surface-50 border-t border-gray-200 dark:border-white/10 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <button type="button" className="p-2 text-ink-muted hover:text-primary-500 transition-colors">
            <ImageIcon size={22} />
          </button>
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-surface-200 border-none rounded-full px-4 py-2.5 text-[15px] text-gray-900 dark:text-ink placeholder:text-gray-500 dark:placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <button 
            type="submit" 
            disabled={!inputMsg.trim()}
            className="p-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
