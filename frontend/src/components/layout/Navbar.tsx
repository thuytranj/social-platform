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
    <header className="sticky top-0 z-40 bg-white dark:bg-surface-800 border-b border-border-subtle dark:border-white/10 h-16 flex items-center justify-between px-4 md:px-8 shadow-xs dark:shadow-dark-xs">
      {/* Mobile Logo */}
      <div className="md:hidden flex items-center gap-2 mr-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-display font-bold text-lg shadow-xs">
          V
        </div>
      </div>

      {/* Search */}
      <div className="md:flex flex-1 max-w-md mx-auto">
        <form className="relative w-full group" onSubmit={handleSearch}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              size={18}
              className="text-text-tertiary dark:text-text-tertiary group-focus-within:text-primary-600 transition-colors"
            />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="block w-full pl-11 pr-4 py-2.5 rounded-lg border border-border-subtle dark:border-white/10 bg-surface dark:bg-surface-700 text-sm text-text-primary dark:text-text-primary placeholder:text-text-tertiary dark:placeholder:text-text-tertiary focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            placeholder="Search VibeConnect..."
            aria-label="Search VibeConnect"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-surface dark:hover:bg-surface-700 text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary transition-colors focus:outline-none"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2 rounded-lg hover:bg-surface dark:hover:bg-surface-700 text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary transition-colors focus:outline-none">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 border-2 border-white dark:border-surface-800 rounded-full"></span>
          )}
        </button>

        {user && (
          <Dropdown
            align="right"
            trigger={
              <div className="p-0.5 ml-2 cursor-pointer rounded-lg hover:bg-surface dark:hover:bg-surface-700 transition-colors">
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
