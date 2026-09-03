import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext({
  socket: null,
  connected: false
});

export const useSocket = () =>
  useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { token, user } =
    useContext(AuthContext);

  const socketRef = useRef(null);

  useEffect(() => {
    /*
     * No authenticated user:
     * disconnect existing socket.
     */
    if (!token || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setSocket(null);
      setConnected(false);

      return undefined;
    }

    const apiUrl =
      import.meta.env.VITE_API_URL ||
      'http://localhost:5000/api';

    /*
     * VITE_API_URL normally contains:
     *
     * http://localhost:5000/api
     *
     * Socket.IO needs:
     *
     * http://localhost:5000
     */
    const socketUrl = apiUrl.replace(
      /\/api\/?$/,
      ''
    );

    console.log(
      '[Socket] Connecting to:',
      socketUrl
    );

    const newSocket = io(socketUrl, {
      auth: {
        token
      },

      transports: [
        'websocket',
        'polling'
      ],

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,

      withCredentials: true
    });

    const pushNotification = (data) => {
      const notificationId =
        `${Date.now()}-${Math.random()}`;

      setNotifications((previous) => [
        ...previous,
        {
          id: notificationId,
          msg:
            data?.message ||
            'You have a new CivicFix update.'
        }
      ]);

      window.setTimeout(() => {
        setNotifications((previous) =>
          previous.filter(
            (notification) =>
              notification.id !==
              notificationId
          )
        );
      }, 5000);
    };

    const handleConnect = () => {
      console.log(
        '[Socket] Connected:',
        newSocket.id
      );

      setConnected(true);
    };

    const handleDisconnect = (reason) => {
      console.log(
        '[Socket] Disconnected:',
        reason
      );

      setConnected(false);
    };

    const handleConnectError = (error) => {
      console.error(
        '[Socket] Connection error:',
        error.message
      );

      setConnected(false);
    };

    const handleReconnect = () => {
      console.log(
        '[Socket] Reconnected'
      );

      setConnected(true);
    };

    newSocket.on(
      'connect',
      handleConnect
    );

    newSocket.on(
      'disconnect',
      handleDisconnect
    );

    newSocket.on(
      'connect_error',
      handleConnectError
    );

    newSocket.io.on(
      'reconnect',
      handleReconnect
    );

    /*
     * Citizen notifications.
     */
    newSocket.on(
      'notification:citizen',
      pushNotification
    );

    /*
     * Authority notifications.
     */
    newSocket.on(
      'notification:authority',
      pushNotification
    );

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log(
        '[Socket] Cleaning up connection'
      );

      newSocket.off(
        'connect',
        handleConnect
      );

      newSocket.off(
        'disconnect',
        handleDisconnect
      );

      newSocket.off(
        'connect_error',
        handleConnectError
      );

      newSocket.io.off(
        'reconnect',
        handleReconnect
      );

      newSocket.off(
        'notification:citizen',
        pushNotification
      );

      newSocket.off(
        'notification:authority',
        pushNotification
      );

      newSocket.disconnect();

      if (
        socketRef.current ===
        newSocket
      ) {
        socketRef.current = null;
      }

      setSocket(null);
      setConnected(false);
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected
      }}
    >
      {children}

      {/* REAL-TIME NOTIFICATIONS */}
      <div
        className="fixed bottom-20 md:bottom-4 right-4
                   z-[1000] flex flex-col gap-2
                   max-w-sm pointer-events-none"
      >
        {notifications.map(
          (notification) => (
            <div
              key={notification.id}
              className="bg-deep-green text-paper p-4
                         rounded-lg shadow-lg
                         border-l-4 border-civic-green
                         animate-in slide-in-from-right-8
                         fade-in"
            >
              <span className="font-semibold text-sm">
                {notification.msg}
              </span>
            </div>
          )
        )}
      </div>
    </SocketContext.Provider>
  );
};