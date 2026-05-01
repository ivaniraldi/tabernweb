import { useState, useEffect } from 'react';
import { Coins, X, Briefcase, Plus, Minus, Trash2, Eye, Shield, Sword, FlaskConical, Sparkles } from 'lucide-react';
import { ItemTooltip } from './ItemTooltip';
import Swal from 'sweetalert2';

const getItemEmoji = (type) => {
    switch(type?.toLowerCase()) {
        case 'weapon': return <Sword size={16} />;
        case 'armor': return <Shield size={16} />;
        case 'potion': return <FlaskConical size={16} />;
        default: return <Sparkles size={16} />;
    }
};

export const ShopModal = ({ gold, inventoryItems = [], onBuy, onSell, onClose, backendUrl }) => {
    const [shopItems, setShopItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('buy');
    const [order, setOrder] = useState([]);
    const [inspectingItem, setInspectingItem] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/game/shop`);
                const data = await res.json();
                setShopItems(data);
            } catch (err) {
                console.error("Error fetching shop:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchShop();
    }, [backendUrl]);

    useEffect(() => {
        if (activeTab === 'sell') setOrder([]);
    }, [inventoryItems, activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setOrder([]);
        setHoveredItem(null);
    };

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const addToOrder = (dataItem) => {
        const isSell = activeTab === 'sell';
        setOrder(prev => {
            const id = isSell ? dataItem.id : dataItem.id;
            const existing = prev.find(i => i.id === id);
            
            if (existing) {
                if (isSell && existing.quantity >= dataItem.quantity) return prev;
                return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
            } else {
                return [...prev, { 
                    id, 
                    item: isSell ? dataItem.item : dataItem, 
                    quantity: 1, 
                    maxQuantity: isSell ? dataItem.quantity : 99 
                }];
            }
        });
    };

    const updateQuantity = (id, delta) => {
        setOrder(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, Math.min(i.quantity + delta, i.maxQuantity));
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const removeFromOrder = (id) => {
        setOrder(prev => prev.filter(i => i.id !== id));
    };

    const totalCost = activeTab === 'buy' ? order.reduce((sum, c) => sum + (c.item.buyPrice * c.quantity), 0) : 0;
    const totalGain = activeTab === 'sell' ? order.reduce((sum, c) => sum + (c.item.sellPrice * c.quantity), 0) : 0;

    const handleCheckout = () => {
        if (order.length === 0) return;

        if (activeTab === 'buy') {
            if (gold < totalCost) {
                Swal.fire({
                    title: 'Oro Insuficiente',
                    text: `Te faltan ${totalCost - gold} monedas para completar la compra.`,
                    icon: 'error',
                    confirmButtonColor: '#6366f1',
                    background: '#1e293b',
                    color: '#f8fafc'
                });
                return;
            }

            Swal.fire({
                title: '¿Confirmar Compra?',
                text: `Pagarás ${totalCost} monedas por ${order.length} lote(s) de objetos.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#6366f1',
                cancelButtonColor: '#ef4444',
                confirmButtonText: 'Sí, comprar',
                cancelButtonText: 'Cancelar',
                background: '#1e293b',
                color: '#f8fafc'
            }).then((result) => {
                if (result.isConfirmed) {
                    const payload = order.map(c => ({ itemId: c.id, quantity: c.quantity }));
                    onBuy(payload);
                    setOrder([]);
                }
            });
        } else {
            Swal.fire({
                title: '¿Confirmar Venta?',
                text: `Recibirás ${totalGain} monedas por ${order.length} lote(s) de objetos.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#ef4444',
                confirmButtonText: 'Sí, vender',
                cancelButtonText: 'Cancelar',
                background: '#1e293b',
                color: '#f8fafc'
            }).then((result) => {
                if (result.isConfirmed) {
                    const payload = order.map(c => ({ inventoryItemId: c.id, quantity: c.quantity }));
                    onSell(payload);
                    setOrder([]);
                }
            });
        }
    };

    return (
        <>
            <div className="auth-overlay">
            <div className="auth-card rpg-shop shop-order-modal">
                <div className="rpg-header">
                    <div className="rpg-title">
                        <h2>El Bazar Arcano</h2>
                        <span className="rpg-subtitle">Mercancías de Calidad Superior</span>
                    </div>
                    <div className="rpg-gold" style={{marginLeft: 'auto', marginRight: '16px'}}>
                        <Coins size={18} className="gold-val"/>
                        <span style={{fontWeight: 'bold', color: 'white'}}>{gold}</span>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="rpg-tabs">
                    <button 
                        className={`rpg-tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
                        onClick={() => handleTabChange('buy')}
                    >
                        Comprar
                    </button>
                    <button 
                        className={`rpg-tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
                        onClick={() => handleTabChange('sell')}
                    >
                        Vender
                    </button>
                </div>

                <div className="shop-body-layout">
                    <div className="shop-items-panel">
                        {activeTab === 'buy' ? (
                            loading ? (
                                <div className="status-text">Examinando estantes...</div>
                            ) : shopItems.map(item => (
                                <div 
                                    key={item.id} 
                                    className="rpg-item-card shop-card-revamp"
                                    onMouseEnter={() => setHoveredItem(item)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    onMouseMove={handleMouseMove}
                                >
                                    <div className="rpg-item-icon">
                                        {item.sprite_url ? (
                                            <img src={item.sprite_url} alt={item.name} style={{ width: '32px', height: '32px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                                        ) : (
                                            getItemEmoji(item.type)
                                        )}
                                        <div className={`rarity-glow ${item.rarity.toLowerCase()}`}></div>
                                    </div>
                                    <div className="rpg-item-info">
                                        <span className={`rpg-item-name rarity-${item.rarity.toLowerCase()}`}>{item.name}</span>
                                        <span className="rpg-item-type-small">{item.type}</span>
                                    </div>
                                    <div className="shop-card-actions">
                                        <button className="info-btn" onClick={() => setInspectingItem(item)} title="Ver Información">
                                            <Eye size={14} />
                                        </button>
                                        <button className="add-btn" onClick={() => addToOrder(item)}>
                                            <span className="price-tag">{item.buyPrice} <Coins size={10} /></span>
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            inventoryItems.length > 0 ? (
                                inventoryItems.map(invItem => (
                                    <div 
                                        key={invItem.id} 
                                        className="rpg-item-card shop-card-revamp"
                                        onMouseEnter={() => setHoveredItem(invItem.item)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        onMouseMove={handleMouseMove}
                                    >
                                        <div className="rpg-item-icon">
                                            {invItem.item.sprite_url ? (
                                                <img src={invItem.item.sprite_url} alt={invItem.item.name} style={{ width: '32px', height: '32px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                                            ) : (
                                                getItemEmoji(invItem.item.type)
                                            )}
                                        </div>
                                        <div className="rpg-item-info">
                                            <span className={`rpg-item-name rarity-${invItem.item.rarity.toLowerCase()}`}>
                                                {invItem.item.name} {invItem.quantity > 1 && <span className="item-qty-badge">x{invItem.quantity}</span>}
                                            </span>
                                            <span className="rpg-item-type-small">{invItem.item.type}</span>
                                        </div>
                                        <div className="shop-card-actions">
                                            <button className="info-btn" onClick={() => setInspectingItem(invItem.item)} title="Ver Información">
                                                <Eye size={14} />
                                            </button>
                                            <button 
                                                className="add-btn sell-variant" 
                                                onClick={() => addToOrder(invItem)}
                                                disabled={order.find(o => o.id === invItem.id)?.quantity >= invItem.quantity}
                                            >
                                                <span className="price-tag">{invItem.item.sellPrice} <Coins size={10} /></span>
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="status-text">Tu morral está vacío.</div>
                            )
                        )}
                    </div>

                    <div className="shop-order-panel">
                        <div className="order-header">
                            <Briefcase size={16} />
                            <span>Tu Lote ({order.length})</span>
                        </div>
                        
                        <div className="order-items-list">
                            {order.length === 0 ? (
                                <div className="empty-order-msg">No has seleccionado nada.</div>
                            ) : (
                                order.map(c => (
                                    <div 
                                        key={c.id} 
                                        className="order-item-row"
                                        onMouseEnter={() => setHoveredItem(c.item)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        onMouseMove={handleMouseMove}
                                    >
                                        <div className="order-item-icon-small">
                                            {c.item.sprite_url ? (
                                                <img src={c.item.sprite_url} alt={c.item.name} style={{ width: '24px', height: '24px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                                            ) : (
                                                <span style={{ fontSize: '14px' }}>{getItemEmoji(c.item.type)}</span>
                                            )}
                                        </div>
                                        <div className="order-item-details">
                                            <span className={`order-item-name rarity-${c.item.rarity.toLowerCase()}`}>{c.item.name}</span>
                                            <span className="order-item-price">
                                                {activeTab === 'buy' ? c.item.buyPrice : c.item.sellPrice} <Coins size={10} className="gold-val" style={{display: 'inline'}}/>
                                            </span>
                                        </div>
                                        <div className="order-qty-controls">
                                            <button onClick={() => updateQuantity(c.id, -1)}><Minus size={12}/></button>
                                            <span className="order-qty-val">{c.quantity}</span>
                                            <button onClick={() => updateQuantity(c.id, 1)} disabled={c.quantity >= c.maxQuantity}><Plus size={12}/></button>
                                        </div>
                                        <button className="order-remove-btn" onClick={() => removeFromOrder(c.id)}>
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="order-summary">
                            <div className="order-total">
                                <span>{activeTab === 'buy' ? 'Total a Pagar:' : 'Total a Recibir:'}</span>
                                <span className={activeTab === 'buy' ? 'text-red-400' : 'text-emerald-400'}>
                                    {activeTab === 'buy' ? totalCost : totalGain} <Coins size={14} style={{display: 'inline'}}/>
                                </span>
                            </div>
                            <button 
                                className="primary-btn checkout-btn" 
                                disabled={order.length === 0 || (activeTab === 'buy' && gold < totalCost)}
                                onClick={handleCheckout}
                                style={{ background: activeTab === 'buy' ? '#6366f1' : '#10b981' }}
                            >
                                {activeTab === 'buy' ? 'Finalizar Compra' : 'Confirmar Venta'}
                            </button>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Item Inspection Sub-Modal */}
                {inspectingItem && (
                    <div className="info-sub-modal-overlay" onClick={() => setInspectingItem(null)}>
                        <div className="info-sub-modal" onClick={e => e.stopPropagation()}>
                            <div className="info-modal-header">
                                <div className="info-modal-icon">
                                    {inspectingItem.sprite_url ? (
                                        <img src={inspectingItem.sprite_url} alt={inspectingItem.name} style={{ width: '48px', height: '48px', imageRendering: 'pixelated' }} />
                                    ) : (
                                        getItemEmoji(inspectingItem.type)
                                    )}
                                </div>
                                <div className="info-modal-title">
                                    <h3 className={`rarity-${inspectingItem.rarity.toLowerCase()}`}>{inspectingItem.name}</h3>
                                    <span className="item-type-badge">{inspectingItem.type}</span>
                                </div>
                                <button className="close-sub-btn" onClick={() => setInspectingItem(null)}><X size={16}/></button>
                            </div>
                            <div className="info-modal-body">
                                <p className="item-description">{inspectingItem.description || "Un objeto misterioso de procedencia desconocida."}</p>
                                
                                {inspectingItem.stats && Object.keys(inspectingItem.stats).some(k => inspectingItem.stats[k] > 0) && (
                                    <div className="info-stats-grid">
                                        {Object.entries(inspectingItem.stats)
                                            .filter(([_, val]) => val > 0)
                                            .map(([stat, val]) => (
                                                <div key={stat} className="stat-info-row">
                                                    <span className="stat-label">{stat.toUpperCase()}</span>
                                                    <span className="stat-value">+{val}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}

                                <div className="info-extra-grid">
                                    <div className="extra-info-box">
                                        <span className="label">Rareza</span>
                                        <span className={`val rarity-${inspectingItem.rarity.toLowerCase()}`}>{inspectingItem.rarity}</span>
                                    </div>
                                    <div className="extra-info-box">
                                        <span className="label">Nivel Req.</span>
                                        <span className="val">{inspectingItem.levelRequired || 1}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reusable Tooltip */}
                <ItemTooltip item={hoveredItem} position={mousePos} />
            </div>

            <style>{`
                .auth-card.rpg-shop.shop-order-modal {
                    max-width: 1000px !important;
                    width: 95% !important;
                    display: flex !important;
                    flex-direction: column !important;
                    max-height: 85vh !important;
                    height: 700px;
                }

                .shop-body-layout {
                    display: flex;
                    flex-direction: row;
                    flex: 1;
                    overflow: hidden;
                }

                @media (max-width: 768px) {
                    .shop-body-layout {
                        flex-direction: column;
                        overflow-y: auto;
                    }
                }

                .shop-items-panel {
                    flex: 1;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    align-content: flex-start;
                    gap: 12px;
                    padding: 16px;
                    overflow-y: auto;
                    border-right: 1px solid rgba(255,255,255,0.05);
                }

                .shop-card-revamp {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    transition: all 0.2s ease;
                }

                .shop-card-revamp:hover {
                    transform: translateY(-4px);
                    border-color: rgba(99, 102, 241, 0.4);
                    background: rgba(99, 102, 241, 0.08);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                }

                .rpg-item-type-small {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #64748b;
                    margin-top: 2px;
                    display: block;
                }

                .shop-card-actions {
                    display: flex;
                    gap: 6px;
                    margin-top: auto;
                }

                .info-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .info-btn:hover {
                    background: rgba(255,255,255,0.15);
                    color: white;
                    border-color: rgba(255,255,255,0.2);
                }

                .add-btn {
                    flex: 1;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: #6366f1;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 10px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.2s;
                }

                .add-btn:hover {
                    background: #4f46e5;
                    transform: scale(1.02);
                }

                .add-btn.sell-variant {
                    background: #10b981;
                }

                .add-btn.sell-variant:hover {
                    background: #059669;
                }

                .price-tag {
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* Info Sub-Modal Styles */
                .info-sub-modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    animation: fadeIn 0.2s ease;
                }

                .info-sub-modal {
                    width: 320px;
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    overflow: hidden;
                    animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .info-modal-header {
                    padding: 20px;
                    background: rgba(255,255,255,0.02);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    position: relative;
                }

                .info-modal-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(0,0,0,0.2);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .info-modal-title h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    letter-spacing: 0.5px;
                }

                .item-type-badge {
                    font-size: 0.65rem;
                    background: rgba(99, 102, 241, 0.1);
                    color: #818cf8;
                    padding: 2px 8px;
                    border-radius: 100px;
                    font-weight: bold;
                    display: inline-block;
                    margin-top: 4px;
                }

                .close-sub-btn {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 4px;
                }

                .info-modal-body {
                    padding: 20px;
                }

                .item-description {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    line-height: 1.5;
                    margin: 0 0 20px 0;
                    font-style: italic;
                }

                .info-stats-grid {
                    background: rgba(0,0,0,0.2);
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 20px;
                }

                .stat-info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                }

                .stat-label { color: #64748b; font-weight: bold; }
                .stat-value { color: #10b981; font-weight: bold; }

                .info-extra-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .extra-info-box {
                    background: rgba(255,255,255,0.03);
                    padding: 10px;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .extra-info-box .label {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: bold;
                }

                .extra-info-box .val {
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: #f1f5f9;
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                .shop-order-panel {
                    flex: 0 0 300px;
                    display: flex;
                    flex-direction: column;
                    background: rgba(0,0,0,0.3);
                }

                @media (max-width: 768px) {
                    .shop-order-panel {
                        flex: none;
                        width: 100%;
                        border-top: 1px solid rgba(255,255,255,0.05);
                    }
                }

                .order-header {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    color: #94a3b8;
                }

                .order-items-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .empty-order-msg {
                    text-align: center;
                    color: #64748b;
                    font-size: 0.8rem;
                    padding: 20px 0;
                }

                .order-item-row {
                    display: flex;
                    align-items: center;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 6px;
                    padding: 6px 8px;
                    gap: 10px;
                }

                .order-item-icon-small {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.2);
                    border-radius: 4px;
                    flex-shrink: 0;
                }

                .order-item-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .order-item-name {
                    font-size: 0.75rem;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .order-item-price {
                    font-size: 0.65rem;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .order-qty-controls {
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.4);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .order-qty-controls button {
                    background: transparent;
                    border: none;
                    color: white;
                    padding: 4px 6px;
                    cursor: pointer;
                }

                .order-qty-controls button:hover:not(:disabled) {
                    background: rgba(255,255,255,0.1);
                }

                .order-qty-controls button:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .order-qty-val {
                    font-size: 0.75rem;
                    font-weight: bold;
                    width: 20px;
                    text-align: center;
                }

                .order-remove-btn {
                    background: transparent;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 4px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                .order-remove-btn:hover {
                    opacity: 1;
                }

                .order-summary {
                    padding: 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.4);
                }

                .order-total {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    margin-bottom: 12px;
                    font-size: 0.9rem;
                }

                .checkout-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 6px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .checkout-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #475569 !important;
                }

                .rarity-glow {
                    position: absolute;
                    inset: 0;
                    opacity: 0.2;
                }
                .rarity-glow.legendary { background: radial-gradient(circle, #fbbf24 0%, transparent 70%); }
                .rarity-glow.epic { background: radial-gradient(circle, #a78bfa 0%, transparent 70%); }
                .rarity-glow.rare { background: radial-gradient(circle, #38bdf8 0%, transparent 70%); }
                .item-qty-badge {
                    background: rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    font-size: 0.55rem;
                    padding: 1px 4px;
                    border-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    font-weight: 800;
                    margin-left: 4px;
                }

                .add-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    background: #475569 !important;
                }
            `}</style>
        </>
    );
};


