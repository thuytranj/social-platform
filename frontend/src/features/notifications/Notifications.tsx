import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, Users } from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { Avatar } from '../../components/ui/Avatar';
import { NotificationType, Notification } from '../../types';
import { formatRelativeTime } from '../../utils/date';

export const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } =
    useNotifications();

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-ink">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 dark:bg-surface-200 rounded-2xl border border-gray-200 dark:border-white/10 border-dashed">
            <Bell
              size={48}
              className="mx-auto mb-4 text-gray-400 dark:text-ink-muted"
            />
            <p className="text-gray-600 dark:text-ink-muted">
              You're all caught up!
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => markAsRead(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const NotificationItem = ({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'post_reaction':
      case 'comment_reaction':
        return <Heart size={16} className="text-white" />;
      case 'post_comment':
      case 'comment_reply':
        return <MessageCircle size={16} className="text-white" />;
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus size={16} className="text-white" />;
      case 'group_join_request':
      case 'group_join_approved':
        return <Users size={16} className="text-white" />;
      default:
        return <Bell size={16} className="text-white" />;
    }
  };

  const getIconBg = () => {
    switch (notification.type) {
      case 'post_reaction':
      case 'comment_reaction':
        return 'bg-red-500';
      case 'post_comment':
      case 'comment_reply':
        return 'bg-blue-500';
      case 'friend_request':
      case 'friend_accepted':
        return 'bg-emerald-500';
      default:
        return 'bg-primary-500';
    }
  };

  const getLink = () => {
    if (notification.target_id && notification.type.startsWith('post'))
      return `/post/${notification.target_id}`;
    if (notification.target_id && notification.type.startsWith('friend'))
      return `/profile/${notification.actor?.id}`;
    if (notification.group_id) return `/groups/${notification.group_id}`;
    if (notification.conversation_id)
      return `/messages?conv=${notification.conversation_id}`;
    return '#';
  };

  return (
    <Link
      to={getLink()}
      onClick={() => {
        if (!notification.is_read) onRead();
      }}
      className={`block p-4 rounded-xl transition-colors relative ${
        notification.is_read
          ? 'hover:bg-gray-100 dark:hover:bg-surface-200'
          : 'bg-primary-50/50 dark:bg-primary-500/10 hover:bg-primary-50 dark:hover:bg-primary-500/20'
      }`}
    >
      {!notification.is_read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500" />
      )}
      <div
        className={`flex items-start gap-4 ${!notification.is_read ? 'pl-4' : ''}`}
      >
        <div className="relative shrink-0">
          <Avatar
            src={notification.actor?.profile?.avatar_url}
            alt={notification.actor?.username || 'User'}
            size="lg"
          />
          <div
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-50 ${getIconBg()}`}
          >
            {getIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] text-gray-900 dark:text-ink leading-snug">
            <span className="font-semibold hover:underline">
              {notification.actor?.profile?.full_name ||
                notification.actor?.username}
            </span>{' '}
            {notification.message}
          </p>
          <span className="text-xs text-gray-600 dark:text-ink-muted mt-1 block">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
};
