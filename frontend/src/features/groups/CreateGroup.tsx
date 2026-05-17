import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { groupsApi } from '../../api/groups.api';
import { useToast } from '../../store/ToastContext';
import { QK } from '../../constants';

const groupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  privacy: z.enum(['public', 'private']),
});

type GroupFormValues = z.infer<typeof groupSchema>;

export const CreateGroup = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { privacy: 'public' },
  });

  const { mutate: createGroup, isPending } = useMutation({
    mutationFn: (data: GroupFormValues) => {
      return groupsApi.createGroup({
        ...data,
        coverFile: coverFile || undefined,
      });
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: QK.GROUPS });
      success('Group created successfully!');
      navigate(`/groups/${newGroup.id}`);
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to create group');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error('File size must be less than 10MB');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/groups')}
          className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-200 text-ink-muted transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-display font-bold text-ink">Create New Group</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit((data) => createGroup(data))} className="space-y-6">
          {/* Cover Photo */}
          <div>
            <label className="text-sm font-medium text-ink-muted mb-2 block">Group Cover Photo</label>
            <div className="relative h-48 bg-surface-200 rounded-xl overflow-hidden group">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm font-medium">Add Cover Photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium backdrop-blur-sm transition-colors flex items-center gap-2"
                >
                  <Camera size={18} /> {coverPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
              <input
                type="file"
                ref={coverInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Group Name"
              placeholder="e.g. Next.js Developers"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-muted ml-1">Description (Optional)</label>
              <textarea
                {...register('description')}
                placeholder="What is this group about?"
                className={`w-full rounded-xl border bg-surface-50 dark:bg-surface-900 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 transition-all duration-150 resize-none h-24 ${
                  errors.description ? 'border-red-500 focus:ring-red-500/20' : 'border-border-base focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
              {errors.description && <span className="text-xs text-red-500 ml-1">{errors.description.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-muted ml-1">Privacy</label>
              <select
                {...register('privacy')}
                className="w-full rounded-xl border border-border-base bg-surface-50 dark:bg-surface-900 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-150 appearance-none"
              >
                <option value="public">Public - Anyone can see who's in the group and what they post</option>
                <option value="private">Private - Only members can see who's in the group and what they post</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border-base flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/groups')}>
              Cancel
            </Button>
            <Button type="submit" className="btn-gradient" isLoading={isPending}>
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
