import { Link } from 'react-router-dom';
import { Users, TrendingUp, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  mutualFriends?: number;
}

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  postCount: number;
}

export const RightSidebar = () => {
  // Mock data - replace with API calls in real app
  const suggestedUsers: SuggestedUser[] = [
    {
      id: '1',
      username: 'alex_designer',
      full_name: 'Alex Designer',
      avatar_url:
        'https://ui-avatars.com/api/?name=Alex+Designer&background=0058bc&color=fff',
      mutualFriends: 5,
    },
    {
      id: '2',
      username: 'sarah_creative',
      full_name: 'Sarah Creative',
      avatar_url:
        'https://ui-avatars.com/api/?name=Sarah+Creative&background=0058bc&color=fff',
      mutualFriends: 3,
    },
    {
      id: '3',
      username: 'mike_developer',
      full_name: 'Mike Developer',
      avatar_url:
        'https://ui-avatars.com/api/?name=Mike+Developer&background=0058bc&color=fff',
      mutualFriends: 8,
    },
  ];

  const trendingTopics: TrendingTopic[] = [
    {
      id: '1',
      title: 'Web Development',
      category: 'Technology',
      postCount: 15420,
    },
    {
      id: '2',
      title: 'React Native',
      category: 'Technology',
      postCount: 12850,
    },
    {
      id: '3',
      title: 'Design Trends',
      category: 'Design',
      postCount: 9230,
    },
    {
      id: '4',
      title: 'Startup News',
      category: 'Business',
      postCount: 8560,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-80 h-screen sticky top-0 bg-white dark:bg-surface-800 border-l border-border-subtle dark:border-white/10 overflow-y-auto px-6 py-6 z-30 gap-6">
      {/* Search Trending */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search
            size={18}
            className="text-text-tertiary dark:text-text-tertiary"
          />
        </div>
        <input
          type="text"
          placeholder="Search trending..."
          className="block w-full pl-11 pr-4 py-2.5 rounded-lg border border-border-subtle dark:border-white/10 bg-surface dark:bg-surface-700 text-sm text-text-primary dark:text-text-primary placeholder:text-text-tertiary dark:placeholder:text-text-tertiary focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
        />
      </div>

      {/* Suggested Users */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Users
            size={18}
            className="text-primary-600 dark:text-primary-400 flex-shrink-0"
          />
          <h3 className="font-display font-semibold text-text-primary dark:text-text-primary">
            Suggested for You
          </h3>
        </div>

        <div className="space-y-3">
          {suggestedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface dark:hover:bg-surface-700 transition-colors group"
            >
              <Link
                to={`/profile/${user.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar src={user.avatar_url} alt={user.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-primary truncate group-hover:text-primary-600 transition-colors">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-text-tertiary dark:text-text-tertiary truncate">
                    @{user.username}
                  </p>
                  {user.mutualFriends && (
                    <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                      {user.mutualFriends} mutual friends
                    </p>
                  )}
                </div>
              </Link>
              <Button variant="primary" size="sm" className="flex-shrink-0">
                Follow
              </Button>
            </div>
          ))}
        </div>

        <Link
          to="/friends"
          className="block text-center text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors py-2"
        >
          See all suggestions
        </Link>
      </div>

      {/* Trending Topics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <TrendingUp
            size={18}
            className="text-primary-600 dark:text-primary-400 flex-shrink-0"
          />
          <h3 className="font-display font-semibold text-text-primary dark:text-text-primary">
            Trending Now
          </h3>
        </div>

        <div className="space-y-2">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.id}
              to={`/search?q=${encodeURIComponent(topic.title)}`}
              className="block p-3 rounded-lg hover:bg-surface dark:hover:bg-surface-700 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-tertiary dark:text-text-tertiary font-medium">
                    {topic.category}
                  </p>
                  <p className="text-sm font-semibold text-text-primary dark:text-text-primary group-hover:text-primary-600 transition-colors truncate">
                    {topic.title}
                  </p>
                  <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                    {(topic.postCount / 1000).toFixed(1)}K posts
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/search"
          className="block text-center text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors py-2"
        >
          Explore all trends
        </Link>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-6 border-t border-border-subtle dark:border-white/10 space-y-2 text-xs text-text-tertiary dark:text-text-tertiary text-center">
        <p>© 2024 VibeConnect. All rights reserved.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#" className="hover:text-text-secondary transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-text-secondary transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-text-secondary transition-colors">
            About
          </a>
        </div>
      </div>
    </aside>
  );
};
