import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Unset VITE_API_URL means same-origin (dev proxy); set means the
    // absolute backend origin from the production build.
    const target = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') || undefined;
    const socket = io(target, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => socket.disconnect();
  }, []);

  const value = useMemo(() => ({ socket: socketRef.current, connected }), [connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
