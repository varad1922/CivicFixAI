import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext({ socket: null, connected: false });
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { token, user } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity
    });

    const pushNotification = (data) => {
      const id = `${Date.now()}-${Math.random()}`;
      setNotifications(prev => [...prev, { id, msg: data?.message || 'You have a new CivicFix update.' }]);
      window.setTimeout(() => setNotifications(prev => prev.filter(note => note.id !== id)), 5000);
    };

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleConnectError = (error) => {
      console.warn('Socket connection error:', error.message);
      setConnected(false);
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);
    newSocket.on('notification:citizen', pushNotification);
    newSocket.on('notification:authority', pushNotification);

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      newSocket.off('notification:citizen', pushNotification);
      newSocket.off('notification:authority', pushNotification);
      newSocket.disconnect();
      if (socketRef.current === newSocket) socketRef.current = null;
      setConnected(false);
    };
  }, [token, user?.id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-[1000] flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map(note => (
          <div key={note.id} className="bg-deep-green text-paper p-4 rounded-lg shadow-lg border-l-4 border-civic-green animate-in slide-in-from-right-8 fade-in">
            <span className="font-semibold text-sm">{note.msg}</span>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};
