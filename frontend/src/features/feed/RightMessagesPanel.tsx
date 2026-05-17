import { MessageCircle, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';

interface Message {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  lastMessage: string;
  unread?: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
}

export const RightMessagesPanel = () => {
  // Mock data - replace with API calls
  const messages: Message[] = [
    {
      id: '1',
      sender: {
        id: '1',
        username: 'Roger Korsgaard',
        avatar_url:
          'https://ui-avatars.com/api/?name=Roger+Korsgaard&background=0058bc&color=fff',
      },
      lastMessage: 'Hey, how are you?',
      unread: true,
    },
    {
      id: '2',
      sender: {
        id: '2',
        username: 'Terry Torff',
        avatar_url:
          'https://ui-avatars.com/api/?name=Terry+Torff&background=0058bc&color=fff',
      },
      lastMessage: 'See you later',
      unread: false,
    },
    {
      id: '3',
      sender: {
        id: '3',
        username: 'Angel Bergson',
        avatar_url:
          'https://ui-avatars.com/api/?name=Angel+Bergson&background=0058bc&color=fff',
      },
      lastMessage: 'Thanks for the update',
      unread: false,
    },
    {
      id: '4',
      sender: {
        id: '4',
        username: 'Emerson Gouse',
        avatar_url:
          'https://ui-avatars.com/api/?name=Emerson+Gouse&background=0058bc&color=fff',
      },
      lastMessage: 'Great work!',
      unread: false,
    },
  ];

  const events: Event[] = [
    {
      id: '1',
      title: '10 Events Invites',
      date: '',
      location: '',
    },
    {
      id: '2',
      title: 'Design System Collaboration',
      date: 'Thu - Harpoon Mall, YK',
      location: '',
    },
    {
      id: '3',
      title: 'Web Dev 2.0 Meetup',
      date: 'Yoshkar-Ola, Russia',
      location: '',
    },
    {
      id: '4',
      title: "Prada's Invitation Birthday",
      date: '',
      location: '',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-2/5 max-w-md min-w-50 h-screen sticky top-0 bg-white dark:bg-surface-800 border border-border-subtle dark:border-white/10 overflow-y-auto z-30 rounded-xl">
      {/* Messages Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 bg-white dark:bg-surface-800 border-b border-border-subtle dark:border-white/10 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-text-primary dark:text-text-primary flex items-center gap-2">
              <MessageCircle size={20} className="text-primary-600" />
              Messages
            </h2>
            <button className="p-2 rounded-lg hover:bg-surface dark:hover:bg-surface-700 transition-colors">
              <ChevronRight size={18} className="text-text-tertiary" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="space-y-1 px-4 py-2">
            {messages.map((msg) => (
              <Link
                key={msg.id}
                to={`/messages`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface dark:hover:bg-surface-700 transition-colors group"
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={msg.sender.avatar_url}
                    alt={msg.sender.username}
                    size="sm"
                  />
                  {msg.unread && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-600 rounded-full border-2 border-white dark:border-surface-800"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold text-text-primary truncate ${msg.unread ? 'font-bold' : ''}`}
                  >
                    {msg.sender.username}
                  </p>
                  <p className="text-xs text-text-tertiary dark:text-text-tertiary truncate">
                    {msg.lastMessage}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-border-subtle dark:border-white/10 px-4 py-3">
          <Link
            to="/messages"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold text-center block"
          >
            View All Messages
          </Link>
        </div>
      </div>
    </aside>
  );
};
