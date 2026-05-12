import { useEffect, useState, type FormEvent } from 'react';
import { Search, Bell, Moon, Sun, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useNotifications } from '../../store/NotificationContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from '../ui/Dropdown';
import { Avatar } from '../ui/Avatar';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (location.pathname !== '/search') return;

    const params = new URLSearchParams(location.search);
    setSearchValue(params.get('q') || '');
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = searchValue.trim();
    if (trimmedQuery) {
      navigate('/search', { state: { query: trimmedQuery } });
      return;
    }

    navigate('/search');
  };

  const userMenuItems = [
    {
      label: 'Profile',
      onClick: () => navigate(`/profile/${user?.id}`),
    },
    {
      label: 'Settings',
      icon: <Settings size={16} />,
      onClick: () => navigate('/settings'),
    },
    {
      label: 'Log Out',
      icon: <LogOut size={16} />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-50/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 h-16 flex items-center justify-between px-4 md:px-8">
      {/* Mobile Logo */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-xl shadow-glow-sm">
          V
        </div>
      </div>

      {/* Desktop Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-auto">
        <form className="relative w-full group" onSubmit={handleSearch}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={18}
              className="text-gray-400 dark:text-ink-faint group-focus-within:text-primary-500 transition-colors"
            />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="block w-full pl-10 pr-3 py-2 rounded-full border-none bg-gray-100 dark:bg-surface-200 text-sm placeholder:text-gray-500 dark:placeholder:text-ink-muted focus:ring-2 focus:ring-primary-500/50 transition-shadow focus:outline-none"
            placeholder="Search VibeConnect..."
            aria-label="Search VibeConnect"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-200 text-gray-600 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink transition-colors focus:outline-none"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-200 text-gray-600 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink transition-colors focus:outline-none">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-surface-50 rounded-full"></span>
          )}
        </button>

        {user && (
          <Dropdown
            align="right"
            trigger={
              <div className="p-0.5 ml-2 cursor-pointer">
                <Avatar
                  src={user.profile?.avatar_url}
                  alt={user.username}
                  size="sm"
                />
              </div>
            }
            items={userMenuItems}
          />
        )}
      </div>
    </header>
  );
};
