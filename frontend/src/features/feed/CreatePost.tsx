import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Video, X, Globe, Users, Lock } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Dropdown } from '../../components/ui/Dropdown';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { postsApi } from '../../api/posts.api';
import { PostPrivacy } from '../../types';
import { QK, PRIVACY_CONFIG } from '../../constants';

export interface CreatePostProps {
  groupId?: string;
}

export const CreatePost = ({ groupId }: CreatePostProps) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>(PostPrivacy.PUBLIC);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: () => postsApi.createPost({ content, privacy, group_id: groupId }, files),
    onSuccess: () => {
      setContent('');
      setFiles([]);
      setPreviewUrls([]);
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: QK.GROUP_POSTS(groupId) });
      }
      queryClient.invalidateQueries({ queryKey: QK.FEEDS });
      success('Post created successfully!');
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to create post');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = files.length + newFiles.length;

      if (totalFiles > 10) {
        error('You can only attach up to 10 files per post.');
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);

      const newUrls = newFiles.map((f) => URL.createObjectURL(f));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const privacyItems = Object.entries(PRIVACY_CONFIG).map(([key, config]) => ({
    label: config.label,
    icon: <span>{config.getIcon()}</span>,
    onClick: () => setPrivacy(key as PostPrivacy),
  }));

  return (
    <div className="bg-white dark:bg-surface-800 border border-border-subtle dark:border-white/10 rounded-xl p-4 sm:p-5 mb-6 shadow-xs dark:shadow-dark-xs">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Avatar
            src={user?.profile?.avatar_url}
            alt={user?.username}
            size="md"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-text-primary dark:text-text-primary placeholder:text-text-tertiary dark:placeholder:text-text-tertiary resize-none focus:outline-none min-h-[60px] text-[15px]"
            rows={Math.min(Math.max(content.split('\n').length, 2), 10)}
          />

          {previewUrls.length > 0 && (
            <div
              className={`mt-3 grid gap-2 ${previewUrls.length > 1 ? (previewUrls.length > 2 ? 'media-grid-3' : 'media-grid-2') : 'grid-cols-1'}`}
            >
              {previewUrls.map((url, i) => (
                <div
                  key={i}
                  className="relative rounded-lg overflow-hidden group aspect-video sm:aspect-auto sm:max-h-64"
                >
                  <img
                    src={url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border-subtle dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors"
            aria-label="Add Photo/Video"
          >
            <ImageIcon size={20} />
          </button>

          <Dropdown
            align="left"
            trigger={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary dark:text-text-secondary hover:bg-surface dark:hover:bg-surface-700 transition-colors ml-2">
                <span>{PRIVACY_CONFIG[privacy].getIcon()}</span>
                <span className="hidden sm:inline">
                  {PRIVACY_CONFIG[privacy].label}
                </span>
              </button>
            }
            items={privacyItems}
          />
        </div>

        <Button
          onClick={() => createPost()}
          disabled={!content.trim() && files.length === 0}
          isLoading={isPending}
          size="sm"
          variant="primary"
          className="px-6"
        >
          Post
        </Button>
      </div>
    </div>
  );
};
