import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_WS, getToken } from './api';

let socketInstance: Socket | null = null;
let currentToken: string | null = null;
const eventListeners = new Set<(event: string, data: unknown) => void>();

export function getOrCreateSocket(): Socket | null {
  const token = getToken();
  if (!token) {
    disconnectSocket();
    return null;
  }

  if (socketInstance && currentToken === token) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  currentToken = token;
  const socket = io(API_WS, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  const events = [
    'gig:created', 'gig:updated', 'gig:cancelled',
    'gig:assigned', 'gig:started', 'gig:completed',
    'rider:online', 'rider:offline', 'analytics:updated', 'notification:new',
  ];

  for (const e of events) {
    socket.on(e, (data: unknown) => {
      console.log(`[WS Received: ${e}]`, data);
      eventListeners.forEach((listener) => {
        try {
          listener(e, data);
        } catch (err) {
          console.error('Error in socket listener:', err);
        }
      });
    });
  }

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  socketInstance = socket;
  return socket;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentToken = null;
  }
}

export function useSocket(onEvent?: (event: string, data: unknown) => void) {
  const [connected, setConnected] = useState<boolean>(() => socketInstance?.connected ?? false);

  useEffect(() => {
    const socket = getOrCreateSocket();
    if (!socket) {
      setConnected(false);
      return;
    }

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    setConnected(socket.connected);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (onEvent) {
      eventListeners.add(onEvent);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (onEvent) {
        eventListeners.delete(onEvent);
      }
    };
  }, [onEvent]);

  return { connected, socket: socketInstance };
}

