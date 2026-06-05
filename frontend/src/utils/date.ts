import { formatDistanceToNow, format } from 'date-fns';

export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
};

export const formatShortDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
};

export const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
};
