import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, LS_ACCESS_TOKEN, CONV_SOCKET_EVENTS } from '../../constants';
import { Message } from '../../types';

interface UseConversationSocketOptions {
  conversationId: string | null;
  onNewMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
  onTyping?: (data: { userId: string; fullName: string; avatar: string }) => void;
  onStopTyping?: (data: { userId: string }) => void;
  onMessageReacted?: (data: any) => void;
  onMessageUnreacted?: (data: any) => void;
  onMessageRead?: (data: { conversationId: string; userId: string; lastReadTime: Date }) => void;
}

export const useConversationSocket = ({
  conversationId,
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
  onTyping,
  onStopTyping,
  onMessageReacted,
  onMessageUnreacted,
  onMessageRead,
}: UseConversationSocketOptions) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomRef = useRef<string | null>(null);

  // Connect to /conversation namespace
  useEffect(() => {
    const token = localStorage.getItem(LS_ACCESS_TOKEN);
    if (!token) return;

    const newSocket = io(`${SOCKET_URL}/conversation`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join/leave room when conversationId changes
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Leave previous room
    if (currentRoomRef.current && currentRoomRef.current !== conversationId) {
      // Socket.io handles room leaving on server side
      currentRoomRef.current = null;
    }

    // Join new room
    if (conversationId) {
      socket.emit(CONV_SOCKET_EVENTS.JOIN_ROOM, {
        conversationId,
      });
      currentRoomRef.current = conversationId;
    }
  }, [socket, isConnected, conversationId]);

  // Listen for events
  useEffect(() => {
    if (!socket) return;

    const handlers: Array<[string, (...args: any[]) => void]> = [];

    if (onNewMessage) {
      const handler = (msg: Message) => onNewMessage(msg);
      socket.on(CONV_SOCKET_EVENTS.NEW_MESSAGE, handler);
      handlers.push([CONV_SOCKET_EVENTS.NEW_MESSAGE, handler]);
    }

    if (onMessageUpdated) {
      const handler = (msg: Message) => onMessageUpdated(msg);
      socket.on(CONV_SOCKET_EVENTS.MESSAGE_UPDATED, handler);
      handlers.push([CONV_SOCKET_EVENTS.MESSAGE_UPDATED, handler]);
    }

    if (onMessageDeleted) {
      const handler = (msgId: string) => onMessageDeleted(msgId);
      socket.on(CONV_SOCKET_EVENTS.MESSAGE_DELETED, handler);
      handlers.push([CONV_SOCKET_EVENTS.MESSAGE_DELETED, handler]);
    }

    if (onTyping) {
      const handler = (data: { userId: string; fullName: string; avatar: string }) =>
        onTyping(data);
      socket.on(CONV_SOCKET_EVENTS.TYPING, handler);
      handlers.push([CONV_SOCKET_EVENTS.TYPING, handler]);
    }

    if (onStopTyping) {
      const handler = (data: { userId: string }) => onStopTyping(data);
      socket.on(CONV_SOCKET_EVENTS.STOP_TYPING, handler);
      handlers.push([CONV_SOCKET_EVENTS.STOP_TYPING, handler]);
    }

    if (onMessageReacted) {
      const handler = (data: any) => onMessageReacted(data);
      socket.on(CONV_SOCKET_EVENTS.MESSAGE_REACTED, handler);
      handlers.push([CONV_SOCKET_EVENTS.MESSAGE_REACTED, handler]);
    }

    if (onMessageUnreacted) {
      const handler = (data: any) => onMessageUnreacted(data);
      socket.on(CONV_SOCKET_EVENTS.MESSAGE_UNREACTED, handler);
      handlers.push([CONV_SOCKET_EVENTS.MESSAGE_UNREACTED, handler]);
    }

    if (onMessageRead) {
      const handler = (data: { conversationId: string; userId: string; lastReadTime: Date }) =>
        onMessageRead(data);
      socket.on(CONV_SOCKET_EVENTS.MESSAGE_READ, handler);
      handlers.push([CONV_SOCKET_EVENTS.MESSAGE_READ, handler]);
    }

    return () => {
      handlers.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [
    socket,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onTyping,
    onStopTyping,
    onMessageReacted,
    onMessageUnreacted,
    onMessageRead,
  ]);

  // Emit helpers
  const sendMessage = useCallback(
    (data: {
      conversation_id: string;
      content: string;
      message_type?: string;
      reply_message_id?: string;
    }) => {
      socket?.emit(CONV_SOCKET_EVENTS.SEND_MESSAGE, data);
    },
    [socket],
  );

  const emitTyping = useCallback(
    (convId: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.TYPING, { conversationId: convId });
    },
    [socket],
  );

  const emitStopTyping = useCallback(
    (convId: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.STOP_TYPING, { conversationId: convId });
    },
    [socket],
  );

  const updateMessage = useCallback(
    (convId: string, messageId: string, content: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.UPDATE_MESSAGE, {
        conversationId: convId,
        messageId,
        content,
      });
    },
    [socket],
  );

  const deleteMessage = useCallback(
    (convId: string, messageId: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.DELETE_MESSAGE, {
        conversationId: convId,
        messageId,
      });
    },
    [socket],
  );

  const addReaction = useCallback(
    (convId: string, messageId: string, reaction: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.ADD_REACTION, {
        conversationId: convId,
        messageId,
        reaction,
      });
    },
    [socket],
  );

  const updateReaction = useCallback(
    (convId: string, messageId: string, reaction: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.UPDATE_REACTION, {
        conversationId: convId,
        messageId,
        reaction,
      });
    },
    [socket],
  );

  const removeReaction = useCallback(
    (convId: string, messageId: string, reaction: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.REMOVE_REACTION, {
        conversationId: convId,
        messageId,
        reaction,
      });
    },
    [socket],
  );

  const emitMarkAsRead = useCallback(
    (convId: string) => {
      socket?.emit(CONV_SOCKET_EVENTS.MARK_AS_READ, { conversationId: convId });
    },
    [socket],
  );

  return {
    socket,
    isConnected,
    sendMessage,
    emitTyping,
    emitStopTyping,
    updateMessage,
    deleteMessage,
    addReaction,
    updateReaction,
    removeReaction,
    emitMarkAsRead,
  };
};
