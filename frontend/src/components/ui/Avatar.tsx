import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'md',
  isOnline,
  className = '',
  onClick,
}: AvatarProps) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className={`relative inline-block ${sizes[size]} ${className}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover rounded-full bg-gray-100 border border-gray-200 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=random`;
          }}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white font-medium shadow-sm ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        >
          {getInitials(alt)}
        </div>
      )}

      {isOnline && (
        <span className="absolute bottom-0 right-0 block online-dot transform translate-x-1/4 translate-y-1/4" />
      )}
    </div>
  );
};
