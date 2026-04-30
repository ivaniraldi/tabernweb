import { useEffect, useRef, useState } from 'react';
import { EventBus } from '../game/EventBus';

export const useSocket = (url) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!url) return;

        let reconnectTimeout;
        const connect = () => {
            if (socketRef.current?.readyState === WebSocket.OPEN) return;

            const socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = () => {
                setIsConnected(true);
                console.log('WS Connected');
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
            };

            socket.onclose = () => {
                setIsConnected(false);
                console.log('WS Disconnected, reconnecting...');
                reconnectTimeout = setTimeout(connect, 3000);
            };

            socket.onerror = (err) => {
                console.error('WS Error:', err);
                socket.close();
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    EventBus.emit('server_message', data);
                } catch (e) {
                    console.error('Error parsing WS message:', e);
                }
            };
        };

        connect();

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (socketRef.current) {
                socketRef.current.onclose = null; // Prevent reconnect on manual close
                socketRef.current.close();
            }
        };
    }, [url]);

    const sendMessage = (data) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        } else {
            console.warn('Cannot send message: Socket not open');
        }
    };

    return { isConnected, sendMessage };
};
