import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    if (token && user) {
      const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('Socket connected');
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('notification:citizen', (data) => {
        setNotifications(prev => [...prev, { id: Date.now(), msg: data.message }]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 5000);
      });

      newSocket.on('notification:authority', (data) => {
        setNotifications(prev => [...prev, { id: Date.now(), msg: data.message }]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 5000);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((note, idx) => (
          <div key={note.id} className="bg-deep-green text-paper p-4 rounded-lg shadow-lg flex items-center justify-between border-l-4 border-civic-green animate-in slide-in-from-right-8 fade-in">
            <span className="font-semibold text-sm">{note.msg}</span>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};
