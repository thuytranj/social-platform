import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { postsApi } from '../../api/posts.api';
import { QK } from '../../constants';
import { Post, PostPrivacy } from '../../types';

interface SharePostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const SharePostModal = ({
  post,
  isOpen,
  onClose,
}: SharePostModalProps) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [shareText, setShareText] = useState('');

  const { mutate: sharePost, isPending } = useMutation({
    mutationFn: () =>
      postsApi.sharePost(post.id, {
        content: shareText,
        privacy: PostPrivacy.PUBLIC,
      }),
    onSuccess: () => {
      success('Post shared');
      setShareText('');
      onClose();
      queryClient.invalidateQueries({ queryKey: QK.FEEDS });
    },
    onError: (err: any) =>
      error(err.response?.data?.message || 'Failed to share post'),
  });

  const handleShare = () => {
    sharePost();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Post" maxWidth="lg">
      <div className="space-y-4">
        {/* Original Post Preview */}
        <div className="bg-gray-50 dark:bg-surface-900 rounded-2xl p-4 border border-gray-200 dark:border-white/10">
          <div className="flex gap-2 mb-2">
            {post.author.profile?.avatar_url ?  <img
              src={post.author.profile?.avatar_url || undefined}
              alt={post.author.username}
              className="w-8 h-8 rounded-full border border-gray-200"
            />:<div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white font-semibold flex items-center justify-center text-sm">
                      {post.author.username.slice(0, 1).toUpperCase()}
                    </div>}
           
            <div className="text-sm">
              <p className="font-semibold text-gray-900 dark:text-ink">
                {post.author.profile?.full_name || post.author.username}
              </p>
              <p className="text-gray-600 dark:text-ink-muted text-xs">
                @{post.author.username}
              </p>
            </div>
          </div>
          <p className="text-gray-900 dark:text-ink text-sm whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Share Text Input */}
        <textarea
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          placeholder="Add a comment to your share (optional)..."
          className="w-full p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-900 text-gray-900 dark:text-ink placeholder:text-gray-500 dark:placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
          rows={4}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleShare} isLoading={isPending}>
            Share
          </Button>
        </div>
      </div>
    </Modal>
  );
};
