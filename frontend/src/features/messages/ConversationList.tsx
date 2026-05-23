import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { conversationsApi } from '../../api/conversations.api';
import { useAuth } from '../../store/AuthContext';
import { QK } from '../../constants';
import { Conversation, ConversationType } from '../../types';
import { formatRelativeTime } from '../../utils/date';

interface ConversationListProps {
  activeConvId: string | null;
  onSelect: (id: string) => void;
  isHidden?: boolean;
}

export const ConversationList = ({
  activeConvId,
  onSelect,
  isHidden = false,
}: ConversationListProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QK.CONVERSATIONS,
    queryFn: () => conversationsApi.getConversations(50),
  });

  const convs = data?.data || [];

  const getConvName = (conv: Conversation) => {
    if (conv.type === ConversationType.GROUP)
      return conv.title || 'Group Chat';
    const otherMember = conv.other_user;
    return (
      otherMember?.profile?.full_name ||
      otherMember?.username ||
      'Unknown User'
    );
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === ConversationType.GROUP) return conv.thumbnail_url;
    const otherMember = (conv.members || []).find(
      (m) => m.user_id !== user?.id,
    );
    return otherMember?.user.profile?.avatar_url;
  };

  const filteredConvs = searchQuery.trim()
    ? convs.filter((c) =>
        getConvName(c).toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : convs;

  return (
    <div
      className={`w-full md:w-80 lg:w-96 flex flex-col border-l border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-800 shrink-0 ${isHidden ? 'hidden md:flex' : 'flex'}`}
    >
      {/* Header */}
      <div className="p-4 pb-3 shrink-0">
        <h2 className="text-xl font-display font-bold text-ink tracking-tight mb-4">
          Chats
        </h2>
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            size={16}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-100 dark:bg-surface-600 pl-10 pr-4 py-2.5 rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-shadow"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 mb-1">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton width="60%" />
                <Skeleton width="80%" />
              </div>
            </div>
          ))
        ) : filteredConvs.length === 0 ? (
          <div className="text-center p-8 text-ink-faint text-sm">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          filteredConvs.map((conv, idx) => {
            const isActive = activeConvId === conv.id;
            const name = getConvName(conv);
            const avatar = getConvAvatar(conv);
            const lastMsg = conv.last_message;
            const unread = conv.unread_count || 0;

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={`conv-item-enter flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 mb-0.5 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 shadow-xs'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar src={avatar} alt={name} size="lg" />
                  {conv.type === ConversationType.GROUP && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-surface-100 dark:bg-surface-600 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-800">
                      <span className="text-[9px]">👥</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3
                      className={`font-semibold truncate text-sm ${
                        isActive
                          ? 'text-primary-700 dark:text-primary-400'
                          : 'text-ink'
                      }`}
                    >
                      {name}
                    </h3>
                    {lastMsg && (
                      <span className="text-[11px] text-ink-faint shrink-0 ml-2 tabular-nums">
                        {formatRelativeTime(lastMsg.sent_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-ink-muted truncate flex-1">
                      {(() => {
                        if (!lastMsg) return 'No messages yet';
                        if (lastMsg.message_type === 'revoked') {
                          return lastMsg.content || 'This message was deleted';
                        }
                        const isSentByMe = lastMsg.sender?.id === user?.id || lastMsg.sender_id === user?.id;
                        const baseContent = lastMsg.content || '📎 Attachment';
                        return isSentByMe ? `You: ${baseContent}` : baseContent;
                      })()}
                    </p>
                    {unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary-600 dark:bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
