import { useState, useEffect, useRef } from 'react';
import { EventBus } from '../game/EventBus';
import { MessageSquare, X, Send, Lock } from 'lucide-react';

export const Chat = ({ onSendMessage, myPlayerId, disabled, isVisible, onToggle }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const handleServerMessage = (data) => {
            if (data.type === 'chat') {
                setMessages(prev => [...prev, data]);
            }
            if (data.type === 'private_message') {
                setMessages(prev => [...prev, {
                    ...data,
                    isPrivate: true,
                    type: 'chat',
                    username: `(De ${data.fromUsername})`,
                    color: '#f472b6' // Rosa para privados
                }]);
            }
            if (data.type === 'private_message_sent') {
                setMessages(prev => [...prev, {
                    ...data,
                    isPrivate: true,
                    type: 'chat',
                    username: `(Para ${data.toUsername})`,
                    color: '#f472b6'
                }]);
            }
        };

        const handlePrefill = (text) => {
            onToggle(true);
            setInput(text);
            // Wait for render to focus
            setTimeout(() => {
                const el = document.getElementById('chat-input');
                if (el) el.focus();
            }, 50);
        };

        const handleLocalMessage = (data) => {
            setMessages(prev => [...prev, {
                ...data,
                username: 'SISTEMA',
                color: '#10b981', // Verde esmeralda para sistema
                message: data.message
            }]);
        };

        EventBus.on('server_message', handleServerMessage);
        EventBus.on('chat-prefill', handlePrefill);
        EventBus.on('local-chat-message', handleLocalMessage);
        
        return () => {
            EventBus.off('server_message', handleServerMessage);
            EventBus.off('chat-prefill', handlePrefill);
            EventBus.off('local-chat-message', handleLocalMessage);
        };
    }, [onToggle]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (disabled) return;
            if (e.key === 'Enter') {
                if (document.activeElement.id === 'chat-input') {
                    // Handled by onSubmit
                } else {
                    onToggle(true);
                    setTimeout(() => {
                        document.getElementById('chat-input')?.focus();
                    }, 50);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [disabled]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isVisible]);

    const toggleChat = (show) => {
        if (disabled && show) return;
        onToggle(show);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) {
            document.getElementById('chat-input')?.blur();
            return;
        }

        // Command parsing: /msg {username} {message}
        if (input.startsWith('/msg ')) {
            const parts = input.split(' ');
            if (parts.length >= 3) {
                const toUsername = parts[1];
                const message = parts.slice(2).join(' ');
                onSendMessage({ type: 'private_message', toUsername, message });
                setInput('');
                document.getElementById('chat-input')?.blur();
                return;
            }
        }

        onSendMessage({ type: 'chat', message: input });
        setInput('');
        document.getElementById('chat-input')?.blur();
    };

    return (
        <>
            {!isVisible && (
                <button 
                    className="chat-toggle-btn" 
                    onClick={() => toggleChat(true)}
                    title="Abrir Chat"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            <div className={`chat-container ${!isVisible ? 'hidden' : ''}`}>
                <div className="chat-header">
                    <div className="header-info">
                        <MessageSquare size={16} />
                        <span>Chat {input.startsWith('/msg ') ? 'Privado' : 'Global'}</span>
                    </div>
                    <button className="close-chat-btn" onClick={() => toggleChat(false)}>
                        <X size={18} />
                    </button>
                </div>

                <div className="messages-log">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-line ${msg.isPrivate ? 'private' : ''}`}>
                            {msg.isPrivate && <Lock size={10} className="inline mr-1 text-pink-400" />}
                            <span className="sender" style={{ color: msg.color || (msg.playerId === myPlayerId ? '#fbbf24' : '#818cf8') }}>
                                {msg.username || `Jugador ${msg.playerId}`}:
                            </span>
                            <span className="text">{msg.message}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="chat-input-area">
                    <input
                        id="chat-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe /msg {nombre} para privado..."
                        autoComplete="off"
                        onFocus={() => EventBus.emit('chat-focus', true)}
                        onBlur={() => EventBus.emit('chat-focus', false)}
                    />
                    <button type="submit" className="send-btn">
                        <Send size={16} />
                    </button>
                </form>
            </div>

            <style>{`
                .chat-line.private {
                    background: rgba(244, 114, 182, 0.05);
                    border-radius: 4px;
                    padding-left: 4px;
                }
            `}</style>
        </>
    );
};
