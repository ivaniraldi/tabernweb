import { useState, useRef, useEffect } from 'react';
import { X, ArrowRightLeft, Coins, Check, AlertCircle, ShoppingBag, Plus, Lock, HelpCircle, Send, MessageSquare } from 'lucide-react';
import { showConfirm, showAlert, showPrompt } from '../lib/swalConfig';

// Helper to render item icon (Emoji or Sprite)
const ItemIcon = ({ item, size = 18 }) => {
    if (!item) return null;
    if (item.sprite_url) {
        return <img src={item.sprite_url} alt={item.name} style={{ width: size, height: size, objectFit: 'contain' }} />;
    }
    return <span style={{ fontSize: `${size - 2}px` }}>{item.icon}</span>;
};

export const TradeModal = ({ 
    myPlayer, 
    otherPlayerName, 
    otherOffers, 
    myOffer, 
    meLocked,
    meConfirmed, 
    chatMessages = [],
    onUpdate, 
    onLock,
    onConfirm, 
    onChat,
    onCancel 
}) => {
    const [showInventory, setShowInventory] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    const myGold = myOffer?.gold || 0;
    const myItems = myOffer?.items || [];
    
    const otherGold = otherOffers?.gold || 0;
    const otherItems = otherOffers?.items || [];
    const otherLocked = otherOffers?.locked || false;
    const otherConfirmed = otherOffers?.confirmed || false;

    const canConfirm = meLocked && otherLocked;

    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setHasUnread(false);
        } else if (chatMessages.length > 0) {
            const lastMsg = chatMessages[chatMessages.length - 1];
            if (lastMsg.sender === 'other') {
                setHasUnread(true);
            }
        }
    }, [chatMessages, isChatOpen]);

    const handleGoldChange = (val) => {
        if (meLocked) return;
        const amount = Math.min(Math.max(0, parseInt(val) || 0), myPlayer.gold);
        onUpdate(amount, myItems);
    };

    const addItem = (item) => {
        if (meLocked) return;
        if (myItems.find(i => i.id === item.id)) return;
        if (myItems.length >= 6) return;
        
        if (item.quantity > 1) {
            setShowInventory(false); // Close inventory to show prompt clearly
            showPrompt(
                'Cantidad',
                `¿Cuántos '${item.item.name}' quieres ofrecer? (Máx: ${item.quantity})`,
                'number',
                item.quantity.toString(),
                (val) => {
                    const qty = Math.min(Math.max(1, parseInt(val) || 1), item.quantity);
                    const newItems = [...myItems, { ...item, quantity: qty }];
                    onUpdate(myGold, newItems);
                }
            );
        } else {
            const newItems = [...myItems, { ...item, quantity: 1 }];
            onUpdate(myGold, newItems);
        }
    };

    const removeItem = (itemId) => {
        if (meLocked) return;
        const newItems = myItems.filter(i => i.id !== itemId);
        onUpdate(myGold, newItems);
    };

    const handleSendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        onChat(chatInput);
        setChatInput('');
    };

    return (
        <div className="trade-overlay">
            <div className="trade-card">
                <div className="trade-header">
                    <div className="header-left">
                        <ArrowRightLeft className="header-icon" size={18} />
                        <div className="header-text">
                            <h3>Comercio</h3>
                            <span>con {otherPlayerName}</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className={`header-btn chat-toggle ${isChatOpen ? 'active' : ''}`} onClick={() => setIsChatOpen(!isChatOpen)}>
                            <MessageSquare size={18} />
                            {hasUnread && <span className="unread-dot" />}
                        </button>
                        <button className="header-btn" onClick={() => showAlert('Ayuda', 'Añade ítems, bloquea tu oferta y confirma cuando ambos estén listos.', 'question')}>
                            <HelpCircle size={18} />
                        </button>
                        <button className="header-btn close" onClick={onCancel}><X size={18} /></button>
                    </div>
                </div>

                <div className="trade-viewport">
                    <div className="trade-main">
                        <div className={`trade-panel ${meLocked ? 'locked' : ''} ${meConfirmed ? 'confirmed' : ''}`}>
                            <div className="panel-tag">Tú {meLocked && <Lock size={10} />}</div>
                            
                            <div className="gold-row">
                                <div className="gold-icon"><Coins size={14} /></div>
                                <input 
                                    type="number" 
                                    value={myGold} 
                                    onChange={(e) => handleGoldChange(e.target.value)}
                                    disabled={meLocked}
                                />
                                <span className="gold-max">/ {myPlayer.gold}</span>
                            </div>

                            <div className="slots-grid">
                                {myItems.map(item => (
                                    <div key={item.id} className="item-slot filled" onClick={() => removeItem(item.id)}>
                                        <ItemIcon item={item.item} size={24} />
                                        <span className="qty">{item.quantity}</span>
                                        {!meLocked && <div className="slot-hover"><X size={12} /></div>}
                                    </div>
                                ))}
                                {[...Array(6 - myItems.length)].map((_, i) => (
                                    <div key={i} className="item-slot empty" onClick={() => !meLocked && setShowInventory(true)}>
                                        {!meLocked && <Plus size={12} />}
                                    </div>
                                ))}
                            </div>

                            {!meLocked ? (
                                <button className="action-btn lock" onClick={onLock}>Bloquear</button>
                            ) : (
                                <button 
                                    className={`action-btn confirm ${meConfirmed ? 'done' : ''} ${!canConfirm ? 'waiting' : ''}`} 
                                    onClick={onConfirm}
                                    disabled={!canConfirm || meConfirmed}
                                >
                                    {meConfirmed ? 'Confirmado' : canConfirm ? 'Confirmar' : 'Esperando...'}
                                </button>
                            )}
                        </div>

                        <div className="trade-panel other">
                            <div className="panel-tag">{otherPlayerName} {otherLocked && <Lock size={10} />}</div>
                            <div className="gold-row">
                                <div className="gold-icon"><Coins size={14} /></div>
                                <span className="gold-val">{otherGold.toLocaleString()}</span>
                            </div>
                            <div className="slots-grid">
                                {otherItems.map(item => (
                                    <div key={item.id} className="item-slot filled other">
                                        <ItemIcon item={item.item} size={24} />
                                        <span className="qty">{item.quantity}</span>
                                    </div>
                                ))}
                                {[...Array(6 - otherItems.length)].map((_, i) => (
                                    <div key={i} className="item-slot empty disabled"></div>
                                ))}
                            </div>
                            <div className="status-indicator">
                                {otherConfirmed ? '✓ Confirmado' : otherLocked ? '🔒 Bloqueado' : '... Eligiendo'}
                            </div>
                        </div>
                    </div>

                    <div className={`chat-overlay ${isChatOpen ? 'visible' : ''}`}>
                        <div className="chat-content">
                            <div className="chat-top">
                                <span>Mensajes</span>
                                <button onClick={() => setIsChatOpen(false)}><X size={14} /></button>
                            </div>
                            <div className="chat-body scrollable">
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`msg-bubble ${msg.sender}`}>{msg.text}</div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form className="chat-footer" onSubmit={handleSendChat}>
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Chat..." />
                                <button type="submit"><Send size={14} /></button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="trade-footer">
                    <AlertCircle size={12} /> Ambos deben bloquear para confirmar.
                </div>

                {showInventory && !meLocked && (
                    <div className="inv-overlay">
                        <div className="inv-modal">
                            <div className="inv-head">
                                <span>Seleccionar Objeto</span>
                                <button onClick={() => setShowInventory(false)}><X size={16} /></button>
                            </div>
                            <div className="inv-list scrollable">
                                {myPlayer.inventoryItems.map(item => {
                                    const inTrade = myItems.find(i => i.id === item.id);
                                    return (
                                        <div key={item.id} className={`inv-entry ${inTrade ? 'active' : ''}`} onClick={() => !inTrade && addItem(item)}>
                                            <ItemIcon item={item.item} size={32} />
                                            <div className="info">
                                                <span className="name">{item.item.name}</span>
                                                <span className="qty">Stock: {item.quantity}</span>
                                            </div>
                                            {inTrade && <Check size={14} className="check" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .trade-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 3000; display: flex; align-items: center; justify-content: center; }
                .trade-card { width: 500px; background: #0f172a; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; box-shadow: 0 30px 60px rgba(0,0,0,0.6); border-radius: 4px; overflow: hidden; position: relative; }
                
                .trade-header { padding: 12px 16px; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 110; position: relative; }
                .header-left { display: flex; align-items: center; gap: 12px; }
                .header-icon { color: #6366f1; }
                .header-text h3 { margin: 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: white; }
                .header-text span { font-size: 0.65rem; color: #475569; }
                
                .header-right { display: flex; gap: 8px; }
                .header-btn { background: transparent; border: none; color: #475569; cursor: pointer; transition: 0.2s; padding: 4px; position: relative; }
                .header-btn:hover, .header-btn.active { color: white; }
                .unread-dot { position: absolute; top: 0; right: 0; width: 6px; height: 6px; background: #ef4444; border-radius: 50%; border: 1.5px solid #0f172a; }

                .trade-viewport { position: relative; overflow: hidden; display: flex; flex-direction: column; }
                .trade-main { display: flex; padding: 16px; gap: 12px; transition: 0.3s; width: 100%; box-sizing: border-box; }
                
                .trade-panel { flex: 1; background: rgba(255, 255, 255, 0.01); padding: 12px; border: 1px solid rgba(255, 255, 255, 0.03); display: flex; flex-direction: column; gap: 12px; border-radius: 2px; }
                .trade-panel.locked { border-color: rgba(99, 102, 241, 0.2); }
                .trade-panel.confirmed { border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.02); }
                .panel-tag { font-size: 0.55rem; text-transform: uppercase; color: #475569; font-weight: 800; display: flex; align-items: center; gap: 6px; }
                
                .gold-row { display: flex; align-items: center; background: rgba(0,0,0,0.2); height: 32px; border: 1px solid rgba(255,255,255,0.03); border-radius: 2px; padding: 0 8px; gap: 8px; }
                .gold-icon { color: #fbbf24; display: flex; }
                .gold-row input { flex: 1; background: transparent; border: none; color: #fbbf24; font-size: 0.85rem; outline: none; font-weight: 800; }
                .gold-max { font-size: 0.55rem; color: #334155; }
                .gold-val { color: #fbbf24; font-weight: 800; font-size: 0.85rem; }

                .slots-grid { display: grid; grid-template-columns: repeat(3, 32px); gap: 8px; justify-content: center; }
                .item-slot { width: 32px; height: 32px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1rem; position: relative; border-radius: 2px; }
                .item-slot.empty { cursor: pointer; color: #1e293b; border-style: dashed; }
                .item-slot.filled { background: rgba(99, 102, 241, 0.05); border-color: rgba(99, 102, 241, 0.2); cursor: pointer; }
                .item-slot.other.filled { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); }
                .qty { position: absolute; bottom: 1px; right: 2px; font-size: 0.5rem; font-weight: 900; color: white; text-shadow: 1px 1px black; }
                .slot-hover { position: absolute; inset: 0; background: rgba(239, 68, 68, 0.8); display: flex; align-items: center; justify-content: center; opacity: 0; color: white; transition: 0.2s; border-radius: 2px; }
                .item-slot.filled:not(.disabled):hover .slot-hover { opacity: 1; }

                .action-btn { width: 100%; height: 32px; border: none; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; cursor: pointer; transition: 0.2s; border-radius: 2px; color: white; }
                .action-btn.lock { background: #312e81; }
                .action-btn.lock:hover { background: #3730a3; }
                .action-btn.confirm { background: #064e3b; }
                .action-btn.confirm:hover:not(:disabled) { background: #065f46; }
                .action-btn.waiting { opacity: 0.4; cursor: not-allowed; background: #1e293b; }
                .action-btn.done { background: #059669; cursor: default; }

                .status-indicator { height: 32px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; text-transform: uppercase; color: #475569; font-weight: 800; }

                .chat-overlay { position: absolute; right: 0; top: 0; bottom: 0; width: 250px; background: #0f172a; border-left: 1px solid rgba(255,255,255,0.1); transform: translateX(100%); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; pointer-events: none; }
                .chat-overlay.visible { transform: translateX(0); pointer-events: auto; }
                .chat-content { display: flex; flex-direction: column; height: 100%; width: 100%; }
                .chat-top { padding: 10px 12px; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; text-transform: uppercase; font-weight: 800; color: #6366f1; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .chat-top button { background: transparent; border: none; color: #475569; cursor: pointer; }
                .chat-body { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
                .msg-bubble { max-width: 90%; padding: 6px 10px; border-radius: 4px; font-size: 0.7rem; word-break: break-word; }
                .msg-bubble.me { align-self: flex-end; background: #312e81; color: #c7d2fe; }
                .msg-bubble.other { align-self: flex-start; background: #1e293b; color: #94a3b8; }
                .chat-footer { padding: 10px; display: flex; gap: 4px; border-top: 1px solid rgba(255,255,255,0.05); }
                .chat-footer input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 6px 8px; color: white; font-size: 0.7rem; outline: none; border-radius: 2px; }
                .chat-footer button { background: #312e81; border: none; color: white; width: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 2px; }

                .trade-footer { padding: 8px 16px; font-size: 0.55rem; color: #334155; display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.1); border-top: 1px solid rgba(255,255,255,0.02); }

                .inv-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .inv-modal { width: 100%; max-width: 300px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
                .inv-head { padding: 12px; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 800; color: white; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .inv-head button { background: transparent; border: none; color: #475569; cursor: pointer; }
                .inv-list { padding: 8px; max-height: 200px; display: flex; flex-direction: column; gap: 4px; }
                .inv-entry { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); cursor: pointer; border-radius: 2px; transition: 0.2s; }
                .inv-entry:hover { border-color: #6366f1; background: rgba(99,102,241,0.02); }
                .inv-entry.active { opacity: 0.3; cursor: default; }
                .inv-entry .info { flex: 1; display: flex; flex-direction: column; }
                .inv-entry .name { font-size: 0.7rem; color: white; font-weight: 700; }
                .inv-entry .qty { font-size: 0.6rem; color: #475569; }
                .check { color: #10b981; }
            `}</style>
        </div>
    );
};
