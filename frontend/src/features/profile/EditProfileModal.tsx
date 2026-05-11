import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { usersApi } from '../../api/users.api';
import { QK } from '../../constants';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Gender } from '../../types';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  bio: z.string().max(160, 'Bio must be under 160 characters').optional(),
  sex: z.nativeEnum(Gender).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.profile?.full_name || '',
      bio: user?.profile?.bio || '',
      sex: user?.profile?.sex || undefined,
    },
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      const formData = new FormData();
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.bio) formData.append('bio', data.bio);
      if (data.sex) formData.append('sex', data.sex);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('cover', coverFile);
      return usersApi.updateProfile(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.ME });
      queryClient.invalidateQueries({ queryKey: QK.USER(user!.id) });
      success('Profile updated successfully!');
      onClose();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'cover'
  ) => {
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

    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth="lg">
      <form onSubmit={handleSubmit((data) => updateProfile(data))} className="space-y-6">
        {/* Cover Photo */}
        <div>
          <label className="text-sm font-medium text-ink-muted mb-2 block">Cover Photo</label>
          <div className="relative h-32 bg-surface-200 rounded-xl overflow-hidden group">
            {(coverPreview || user?.profile?.cover_url) && (
              <img
                src={coverPreview || user?.profile?.cover_url!}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"
              >
                <Camera size={24} />
              </button>
            </div>
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'cover')}
            />
          </div>
        </div>

        {/* Avatar */}
        <div className="-mt-12 flex justify-center">
          <div className="relative group">
            <div className="p-1 bg-bg-elevated rounded-full">
              <Avatar
                src={avatarPreview || user?.profile?.avatar_url}
                alt={user?.username}
                size="2xl"
              />
            </div>
            <div className="absolute inset-1 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"
              >
                <Camera size={24} />
              </button>
            </div>
            <input
              type="file"
              ref={avatarInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'avatar')}
            />
          </div>
        </div>

        {/* Info Fields */}
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-muted ml-1">Bio</label>
            <textarea
              {...register('bio')}
              placeholder="Tell us about yourself..."
              className={`w-full rounded-xl border bg-surface-50 dark:bg-surface-200 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 transition-all duration-150 resize-none h-24 ${
                errors.bio ? 'border-red-500 focus:ring-red-500/20' : 'border-border-base focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
            {errors.bio && <span className="text-xs text-red-500 ml-1">{errors.bio.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-muted ml-1">Gender</label>
            <select
              {...register('sex')}
              className="w-full rounded-xl border border-border-base bg-surface-50 dark:bg-surface-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-150 appearance-none"
            >
              <option value="">Prefer not to say</option>
              <option value={Gender.MALE}>Male</option>
              <option value={Gender.FEMALE}>Female</option>
              <option value={Gender.OTHER}>Other</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="btn-gradient" isLoading={isPending}>
            <Save size={18} className="mr-2" /> Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
