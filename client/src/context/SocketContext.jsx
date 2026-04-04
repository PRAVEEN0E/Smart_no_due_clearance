import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (token && user) {
            const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
            const newSocket = io(backendUrl, {
                transports: ['websocket'],
                query: { token }
            });

            newSocket.emit('join', user.id);

            newSocket.on('new_notification', (notification) => {
                toast(notification.title, {
                    icon: '🔔',
                    description: notification.message
                });
            });

            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [token, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
