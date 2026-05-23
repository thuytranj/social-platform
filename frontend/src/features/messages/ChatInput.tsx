import { useState, useRef, useCallback } from 'react';
import {
  Send,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Message } from '../../types';
import { conversationsApi } from '../../api/conversations.api';

interface ChatInputProps {
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
  onSendViaSocket: (data: {
    conversation_id: string;
    content: string;
    message_type?: string;
    reply_message_id?: string;
  }) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ChatInput = ({
  conversationId,
  replyTo,
  onCancelReply,
  onSendViaSocket,
  onTypingStart,
  onTypingStop,
}: ChatInputProps) => {
  const [inputMsg, setInputMsg] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMsg(e.target.value);

    // Typing indicator
    if (!isTypingRef.current && e.target.value.trim()) {
      isTypingRef.current = true;
      onTypingStart?.();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop?.();
      }
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 10));
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputMsg.trim();
    if (!trimmed && files.length === 0) return;

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (files.length > 0) {
      // Use REST API for file uploads
      setIsSending(true);
      try {
        await conversationsApi.sendMessage(
          {
            conversation_id: conversationId,
            content: trimmed || undefined,
            message_type: 'text',
            reply_message_id: replyTo?.id,
          },
          files,
        );
        setInputMsg('');
        setFiles([]);
        onCancelReply();
      } catch {
        // toast error
      } finally {
        setIsSending(false);
      }
    } else {
      // Use socket for text-only
      onSendViaSocket({
        conversation_id: conversationId,
        content: trimmed,
        message_type: 'text',
        reply_message_id: replyTo?.id || undefined,
      });
      setInputMsg('');
      onCancelReply();
    }
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className="shrink-0 border-t border-gray-200 dark:border-white/[0.06] bg-white dark:bg-surface-900 p-0">
      <div className="max-w-4xl mx-auto flex flex-col">
        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-center justify-between bg-surface-100 dark:bg-surface-600/30 px-4 py-2.5 rounded-t-2xl border-x border-t border-gray-200 dark:border-white/[0.06] mb-[-1px] animate-[slide-in_0.2s_ease-out]">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                Replying to {replyTo.sender.profile?.full_name || replyTo.sender.username}
              </span>
              <p className="text-xs text-ink-muted truncate">
                {replyTo.content || 'Attachment'}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 hover:bg-surface-200 dark:hover:bg-surface-500 rounded-full transition-colors text-ink-faint hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* File previews */}
        {files.length > 0 && (
          <div className="px-4 py-3 bg-gray-50/50 dark:bg-surface-800/20 border-x border-t border-gray-200 dark:border-white/[0.06] mb-[-1px]">
            <div className="flex gap-2 flex-wrap">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="relative group"
                >
                  {isImage(file) ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="file-card flex items-center gap-2 px-3 py-2 pr-8">
                      <FileText
                        size={16}
                        className="text-primary-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink truncate max-w-[120px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-ink-faint">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <form
          onSubmit={handleSend}
          className={`flex items-end gap-3 bg-gray-50 dark:bg-surface-800/40 p-2 border border-gray-200 dark:border-white/[0.08] focus-within:border-primary-500/50 dark:focus-within:border-primary-400/50 transition-all ${
            replyTo ? 'rounded-b-3xl' : 'rounded-3xl'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-ink-muted hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            type="text"
            value={inputMsg}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-ink py-3 px-1 placeholder:text-ink-faint focus:outline-none text-[15px]"
          />
          
          <button
            type="submit"
            disabled={(!inputMsg.trim() && files.length === 0) || isSending}
            className="bg-primary-600 dark:bg-primary-500 text-white p-3 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
