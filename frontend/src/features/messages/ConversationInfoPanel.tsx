import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Users,
  FileText,
  Image as ImageIcon,
  LogOut,
  Download,
  Shield,
  Crown,
  Info,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { conversationsApi } from '../../api/conversations.api';
import { useAuth } from '../../store/AuthContext';
import { QK } from '../../constants';
import { LightboxGallery } from '../../components/ui';
import { downloadFile } from '../../utils/file';
import {
  Conversation,
  ConversationType,
  ConversationMemberRole,
} from '../../types';

interface ConversationInfoPanelProps {
  conversation: Conversation;
  onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ConversationInfoPanel = ({
  conversation,
  onClose,
}: ConversationInfoPanelProps) => {
  const { user } = useAuth();
  const isGroup = conversation.type === ConversationType.GROUP;
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // ---- Members ----
  const { data: membersData } = useQuery({
    queryKey: QK.CONVERSATION_MEMBERS(conversation.id),
    queryFn: () => conversationsApi.getConversationMembers(conversation.id, 50),
    enabled: isGroup,
  });
  const members = membersData?.data || [];

  // ---- Shared media ----
  const { data: mediasData } = useQuery({
    queryKey: QK.CONVERSATION_MEDIAS(conversation.id),
    queryFn: () =>
      conversationsApi.getConversationMedias(conversation.id, 100),
  });
  const medias = mediasData?.data || [];

  // ---- Shared files ----
  const { data: filesData } = useQuery({
    queryKey: QK.CONVERSATION_FILES(conversation.id),
    queryFn: () =>
      conversationsApi.getConversationFiles(conversation.id, 10),
  });
  const files = filesData?.data || [];

  // ---- Helpers ----
  const getOtherUser = () => {
    if (isGroup) return null;
    return conversation.other_user;
  };

  const otherUser = getOtherUser();

  const getDisplayName = () => {
    if (isGroup) return conversation.title || 'Group Chat';
    return (
      otherUser?.profile?.full_name ||
      otherUser?.username ||
      'Unknown User'
    );
  };

  const getAvatar = () => {
    if (isGroup) return conversation.thumbnail_url;
    return otherUser?.profile?.avatar_url;
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await conversationsApi.leaveConversation(conversation.id);
      onClose();
    } catch {
      // error handling
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer transition-opacity"
      />

      {/* Modal Dialog container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-surface-800 rounded-[28px] shadow-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden max-h-[85vh] flex flex-col z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] shrink-0">
          <h3 className="font-display font-semibold text-ink text-md tracking-tight">
            Conversation Info
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-600 text-ink-faint hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile / Group header */}
          <div className="flex flex-col items-center py-6 px-4">
            <Avatar
              src={getAvatar()}
              alt={getDisplayName()}
              size="2xl"
            />
            <h2 className="mt-4 text-lg font-display font-bold text-ink text-center tracking-tight">
              {getDisplayName()}
            </h2>
            {!isGroup && otherUser?.profile?.bio && (
              <p className="mt-1 text-sm text-ink-muted text-center max-w-[260px] leading-relaxed">
                {otherUser.profile.bio}
              </p>
            )}
            {isGroup && (
              <p className="mt-1 text-xs text-ink-faint text-center">
                Group · {members.length} members
              </p>
            )}
          </div>

          <div className="h-px bg-gray-100 dark:bg-white/[0.04] mx-4" />

          {/* ---- Group members ---- */}
          {isGroup && members.length > 0 && (
            <div className="py-4 px-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-ink-faint" />
                <h4 className="text-sm font-semibold text-ink tracking-tight">
                  Members
                </h4>
                <span className="ml-auto text-xs text-ink-faint tabular-nums">
                  {members.length}
                </span>
              </div>
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    <Avatar
                      src={member.user.profile?.avatar_url}
                      alt={
                        member.user.profile?.full_name ||
                        member.user.username
                      }
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {member.user.profile?.full_name ||
                          member.user.username}
                      </p>
                    </div>
                    {member.role === ConversationMemberRole.OWNER && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                        <Crown size={10} />
                        Owner
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- Private chat info ---- */}
          {!isGroup && otherUser && (
            <>
              <div className="h-px bg-gray-100 dark:bg-white/[0.04] mx-4" />
              <div className="py-4 px-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-ink-faint" />
                  <h4 className="text-sm font-semibold text-ink tracking-tight">
                    Information
                  </h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Username</span>
                    <span className="text-ink font-medium">
                      @{otherUser.username}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Email</span>
                    <span className="text-ink font-medium">
                      {otherUser.email}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {isGroup && (
            <div className="h-px bg-gray-100 dark:bg-white/[0.04] mx-4" />
          )}

          {/* ---- Shared Media ---- */}
          {medias.length > 0 && (
            <div className="py-4 px-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={16} className="text-ink-faint" />
                <h4 className="text-sm font-semibold text-ink tracking-tight">
                  Shared Media
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {medias.slice(0, 6).map((media, idx) => {
                  const isLast = idx === 5 && medias.length > 6;
                  const remainingCount = medias.length - 5;
                  return (
                    <button
                      key={media.id}
                      onClick={() => {
                        setActiveGalleryIndex(idx);
                        setIsGalleryOpen(true);
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-600 hover:opacity-90 active:scale-95 transition-all group"
                    >
                      <img
                        src={media.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isLast && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-sm group-hover:bg-black/50 transition-colors">
                          +{remainingCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {medias.length > 0 && files.length > 0 && (
            <div className="h-px bg-gray-100 dark:bg-white/[0.04] mx-4" />
          )}

          {/* ---- Shared Files ---- */}
          {files.length > 0 && (
            <div className="py-4 px-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-ink-faint" />
                <h4 className="text-sm font-semibold text-ink tracking-tight">
                  Shared Files
                </h4>
              </div>
              <div className="space-y-1.5">
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const fileName = file.file_name || file.url.substring(file.url.lastIndexOf('/') + 1);
                        const signedUrl = await conversationsApi.getFileDownloadUrl(
                          conversation.id,
                          fileName
                        );
                        downloadFile(signedUrl, file.original_name);
                      } catch (error) {
                        console.error('Failed to get download URL', error);
                        downloadFile(file.url, file.original_name);
                      }
                    }}
                    className="file-card flex items-center gap-3 px-3 py-2.5 hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                      <FileText
                        size={16}
                        className="text-primary-600 dark:text-primary-400"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">
                        {file.original_name}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>
                    <Download
                      size={14}
                      className="text-ink-faint shrink-0"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ---- Group actions ---- */}
          {isGroup && (
            <>
              <div className="h-px bg-gray-100 dark:bg-white/[0.04] mx-4" />
              <div className="py-4 px-4">
                <button
                  onClick={handleLeave}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Leave Group
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <LightboxGallery
        images={medias.map((m) => m.url)}
        initialIndex={activeGalleryIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  );
};
