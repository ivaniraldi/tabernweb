import { useState, useEffect, useRef } from 'react';
import { EventBus } from '../game/EventBus';
import { MessageSquare, X, Send } from 'lucide-react';

export const Chat = ({ onSendMessage, myPlayerId, disabled }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const handleServerMessage = (data) => {
            if (data.type === 'chat') {
                setMessages(prev => [...prev, data]);
            }
        };

        EventBus.on('server_message', handleServerMessage);
        return () => EventBus.off('server_message', handleServerMessage);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (disabled) return;
            if (e.key === 'Enter') {
                if (document.activeElement.id === 'chat-input') {
                    // Handled by onSubmit
                } else {
                    toggleChat(true);
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
        setIsVisible(show);
        EventBus.emit('chat-focus', show);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        onSendMessage({ type: 'chat', message: input });
        setInput('');
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
                        <span>Chat Global</span>
                    </div>
                    <button className="close-chat-btn" onClick={() => toggleChat(false)}>
                        <X size={18} />
                    </button>
                </div>

                <div className="messages-log">
                    {messages.map((msg, i) => (
                        <div key={i} className="chat-line">
                            <span className="sender" style={{ color: msg.playerId === myPlayerId ? '#fbbf24' : '#818cf8' }}>
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
                        placeholder="Escribe un mensaje..."
                        autoComplete="off"
                        onFocus={() => EventBus.emit('chat-focus', true)}
                        onBlur={() => EventBus.emit('chat-focus', false)}
                    />
                    <button type="submit" className="send-btn">
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </>
    );
};

