import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Loader } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { commentsApi } from '../../api/comments.api';
import { QK } from '../../constants';
import { CommentCard } from './CommentCard';
import { Skeleton } from '../../components/ui/Skeleton';

interface CommentSectionProps {
  postId: string;
  onClose?: () => void;
}

export const CommentSection = ({ postId, onClose }: CommentSectionProps) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: commentsData, isLoading } = useQuery({
    queryKey: QK.POST_COMMENTS(postId),
    queryFn: () => commentsApi.getComments(postId, 50),
  });

  const comments = commentsData?.data || [];

  const { mutate: postComment, isPending: isPosting } = useMutation({
    mutationFn: () => commentsApi.createComment(postId, commentText),
    onSuccess: () => {
      setCommentText('');
      success('Comment posted');
      queryClient.invalidateQueries({ queryKey: QK.POST_COMMENTS(postId) });
      queryClient.invalidateQueries({ queryKey: QK.FEEDS });
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to post comment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      postComment();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[500px] md:max-h-none">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton width="40%" />
                <Skeleton width="80%" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-ink-muted">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} postId={postId} />
          ))
        )}
      </div>

      {/* Comment Input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
          <Avatar src={user.profile?.avatar_url} alt={user.username} size="sm" />
          <div className="flex-1 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-surface-200 text-gray-900 dark:text-ink placeholder:text-gray-500 dark:placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              disabled={isPosting}
            />
            <Button
              type="submit"
              size="icon"
              isLoading={isPosting}
              disabled={!commentText.trim() || isPosting}
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
