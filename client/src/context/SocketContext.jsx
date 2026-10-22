import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { getSocketUrl } from '../services/api';
import { Bell, CheckCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SocketContext = createContext({
  socket: null,
  connected: false
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { token, user } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    // No authenticated user: disconnect socket
    if (!token || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    const socketUrl = getSocketUrl();

    const newSocket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 6000,
      withCredentials: true
    });

    const pushNotification = (data) => {
      const notificationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const message =
        typeof data === 'string'
          ? data
          : data?.message || data?.title || 'You have a new CivicFix update.';

      setNotifications((prev) => [
        {
          id: notificationId,
          msg: message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev.slice(0, 4) // Keep max 5 notifications
      ]);

      // Auto-dismiss after 6 seconds
      window.setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      }, 6000);
    };

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', () => {
      setConnected(false);
    });

    newSocket.io.on('reconnect', () => {
      setConnected(true);
    });

    // Subscriptions
    newSocket.on('notification:citizen', pushNotification);
    newSocket.on('notification:authority', pushNotification);
    newSocket.on('issue:assigned', (issue) => {
      pushNotification({ message: `New issue assigned: "${issue.title || 'Civic issue'}"` });
    });
    newSocket.on('issue:status:updated', (data) => {
      pushNotification({ message: `Issue status updated: ${data.status || 'Updated'}` });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('notification:citizen');
      newSocket.off('notification:authority');
      newSocket.off('issue:assigned');
      newSocket.off('issue:status:updated');
      newSocket.disconnect();

      if (socketRef.current === newSocket) {
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
    };
  }, [token, user?.id]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected
      }}
    >
      {children}

      {/* Real-time Toast Notifications with Glassmorphism and Motion */}
      <div
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6
                   z-[9999] flex flex-col gap-2.5
                   w-[90vw] max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {notifications.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto bg-stone-900/90 text-stone-100 p-4
                         rounded-xl shadow-2xl backdrop-blur-md
                         border border-emerald-500/30 flex items-start gap-3"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    Live Civic Alert
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-sm font-medium text-stone-200 mt-0.5 leading-snug break-words">
                  {item.msg}
                </p>
              </div>
              <button
                onClick={() => removeNotification(item.id)}
                className="text-stone-400 hover:text-stone-100 p-1 -mr-1 rounded-md transition-colors"
                aria-label="Dismiss alert"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SocketContext.Provider>
  );
};