import { Package, X, Shield, Sword, Eye, Plus, Sparkles, Heart, Zap, User } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ItemTooltip } from './ItemTooltip';

export const InventoryModal = ({ inventoryItems = [], equipment = {}, onEquip, onUnequip, onUse, onClose }) => {
    const [filter, setFilter] = useState('ALL');
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [inspectingItem, setInspectingItem] = useState(null);

    const eqObj = useMemo(() => typeof equipment === 'string' ? JSON.parse(equipment) : (equipment || {}), [equipment]);

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const filteredItems = useMemo(() => {
        if (filter === 'ALL') return inventoryItems;
        return inventoryItems.filter(i => i.item.type === filter);
    }, [inventoryItems, filter]);

    const SLOTS = [
        { id: 'head', label: 'Cabeza', icon: <Package size={16}/> },
        { id: 'necklace', label: 'Collar', icon: <Heart size={16}/> },
        { id: 'torso', label: 'Pecho', icon: <Shield size={16}/> },
        { id: 'weapon', label: 'Arma', icon: <Sword size={16}/> },
        { id: 'ring', label: 'Anillo', icon: <Zap size={16}/> },
        { id: 'legs', label: 'Piernas', icon: <Shield size={16}/> },
        { id: 'boots', label: 'Pies', icon: <Package size={16}/> },
        { id: 'arms', label: 'Manos', icon: <Shield size={16}/> }
    ];

    const getEquippedItem = (slotId) => {
        const invItemId = eqObj[slotId];
        if (!invItemId) return null;
        return inventoryItems.find(i => i.id === invItemId);
    };

    return (
        <div className="auth-overlay" onMouseMove={handleMouseMove}>
            <div className="inventory-v2-container">
                {/* Header Section */}
                <div className="inv-v2-header">
                    <div className="player-brand">
                        <div className="brand-icon"><User size={20}/></div>
                        <div className="brand-text">
                            <h3>Inventario Real</h3>
                            <span>Administra tus tesoros</span>
                        </div>
                    </div>
                    <button className="close-btn-v2" onClick={onClose}><X size={24}/></button>
                </div>

                <div className="inv-v2-body">
                    {/* Left: Paperdoll / Character Area */}
                    <div className="character-section">
                        <div className="paperdoll-container">
                            <div className="paperdoll-silhouette"></div>
                            {SLOTS.map(slot => {
                                const equipped = getEquippedItem(slot.id);
                                return (
                                    <div 
                                        key={slot.id} 
                                        className={`v2-slot slot-${slot.id} ${equipped ? 'active' : ''}`}
                                        onMouseEnter={() => equipped && setHoveredItem(equipped.item)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        onClick={() => equipped && onUnequip(slot.id)}
                                    >
                                        <div className="v2-slot-inner">
                                            {equipped ? (
                                                <img src={equipped.item.sprite_url} alt={equipped.item.name} />
                                            ) : (
                                                <div className="v2-slot-placeholder">{slot.icon}</div>
                                            )}
                                        </div>
                                        <label>{slot.label}</label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Bag / List Area */}
                    <div className="bag-section">
                        <div className="bag-filters">
                            {['ALL', 'WEAPON', 'ARMOR', 'CONSUMABLE', 'EQUIPMENT'].map(f => (
                                <button 
                                    key={f}
                                    className={`filter-chip ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === 'ALL' ? 'Todo' : f === 'WEAPON' ? 'Armas' : f === 'ARMOR' ? 'Armaduras' : f === 'CONSUMABLE' ? 'Pociones' : 'Accesorios'}
                                </button>
                            ))}
                        </div>

                        <div className="bag-grid-container scrollable-v2">
                            <div className="bag-grid">
                                {filteredItems.map(invItem => {
                                    const isEquipped = Object.values(eqObj).includes(invItem.id);
                                    const rarity = invItem.item.rarity.toLowerCase();
                                    
                                    return (
                                        <div 
                                            key={invItem.id} 
                                            className={`v2-item-card ${isEquipped ? 'is-equipped' : ''} rarity-${rarity}`}
                                            onMouseEnter={() => setHoveredItem(invItem.item)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                        >
                                            <div className="v2-item-visual">
                                                {invItem.item.sprite_url ? (
                                                    <img src={invItem.item.sprite_url} alt={invItem.item.name} />
                                                ) : (
                                                    <div className="v2-item-emoji-fallback">{getItemEmoji(invItem.item.type)}</div>
                                                )}
                                                {invItem.quantity > 1 && <span className="v2-qty">x{invItem.quantity}</span>}
                                                <div className="rarity-glow-v2"></div>
                                            </div>
                                            
                                            <div className="v2-item-meta">
                                                <span className="v2-name">{invItem.item.name}</span>
                                                <div className="v2-actions">
                                                    <button onClick={(e) => { e.stopPropagation(); setInspectingItem(invItem.item); }} title="Ver info"><Eye size={12}/></button>
                                                    {isEquipped ? (
                                                        <span className="equipped-tag">Equipado</span>
                                                    ) : (
                                                        invItem.item.type === 'CONSUMABLE' ? (
                                                            <button onClick={(e) => { e.stopPropagation(); onUse(invItem.id); }} className="use-btn" title="Usar"><Sparkles size={12}/></button>
                                                        ) : (
                                                            <button onClick={(e) => { e.stopPropagation(); onEquip(invItem.id); }} className="equip-btn" title="Equipar"><Plus size={12}/></button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tooltip */}
                <ItemTooltip item={hoveredItem} position={mousePos} />
                
                {/* Inspection Modal */}
                {inspectingItem && (
                    <div className="v2-inspection-overlay" onClick={() => setInspectingItem(null)}>
                        <div className="v2-inspection-card" onClick={e => e.stopPropagation()}>
                            <div className="v2-insp-header">
                                <div className="v2-insp-icon">
                                    {inspectingItem.sprite_url ? <img src={inspectingItem.sprite_url} alt=""/> : getItemEmoji(inspectingItem.type)}
                                </div>
                                <div className="v2-insp-titles">
                                    <h4 className={`rarity-${inspectingItem.rarity.toLowerCase()}`}>{inspectingItem.name}</h4>
                                    <span>{inspectingItem.type}</span>
                                </div>
                                <button className="close-mini" onClick={() => setInspectingItem(null)}><X size={16}/></button>
                            </div>
                            <div className="v2-insp-body">
                                <p>{inspectingItem.description || "Un objeto misterioso de la taberna."}</p>
                                
                                {inspectingItem.type !== 'CONSUMABLE' && inspectingItem.stats && (
                                    <div className="v2-insp-stats">
                                        {Object.entries(inspectingItem.stats).map(([k, v]) => (
                                            <div key={k} className="v2-stat-row">
                                                <span className="stat-name">{k.toUpperCase()}</span>
                                                <span className="stat-val">+{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="v2-insp-stats consumable-effects" style={{ marginTop: '8px' }}>
                                    <span className="insp-label">Clase requerida:</span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                                        {inspectingItem.allowedClasses === 'all' ? 'Todas' : inspectingItem.allowedClasses}
                                    </span>
                                </div>
                                {inspectingItem.type === 'CONSUMABLE' && inspectingItem.stats?.effects && (
                                     <div className="v2-insp-stats consumable-effects">
                                         <span className="insp-label">Efectos al usar:</span>
                                         {inspectingItem.stats.effects.map((eff, i) => (
                                             <div key={i} className="v2-stat-row effect-item">
                                                 <span>{getEffectLabel(eff.type, eff.stat)}</span>
                                                 <span>+{eff.value}</span>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    .inventory-v2-container {
                        width: 900px;
                        max-width: calc(100vw - 60px);
                        max-height: calc(100vh - 60px);
                        margin: 30px;
                        background: #0f172a;
                        border: 1px solid rgba(255,255,255,0.1);
                        box-shadow: 0 0 40px rgba(0,0,0,0.8);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        border-radius: 12px;
                        animation: modalShow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }

                    @keyframes modalShow {
                        from { transform: scale(0.9) translateY(20px); opacity: 0; }
                        to { transform: scale(1) translateY(0); opacity: 1; }
                    }

                    .inv-v2-header {
                        padding: 15px 25px;
                        background: rgba(255,255,255,0.03);
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .player-brand { display: flex; gap: 15px; align-items: center; }
                    .brand-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #4f46e5); display: flex; align-items: center; justify-content: center; border-radius: 10px; color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
                    .brand-text h3 { margin: 0; font-size: 1.2rem; color: #f8fafc; font-weight: 800; letter-spacing: -0.5px; }
                    .brand-text span { font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }

                    .close-btn-v2 { background: transparent; border: none; color: #64748b; cursor: pointer; transition: all 0.2s; padding: 5px; border-radius: 50%; }
                    .close-btn-v2:hover { color: #f1f5f9; background: rgba(255,255,255,0.05); }

                    .inv-v2-body { display: flex; flex: 1; overflow: hidden; }

                    /* Character Area */
                    .character-section {
                        flex: 0 0 350px;
                        background: rgba(0,0,0,0.2);
                        border-right: 1px solid rgba(255,255,255,0.05);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        background-image: radial-gradient(circle at center, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
                    }

                    .paperdoll-container {
                        display: grid;
                        grid-template-columns: repeat(3, 75px);
                        grid-template-rows: repeat(4, 75px);
                        gap: 15px;
                        position: relative;
                    }

                    .paperdoll-silhouette {
                        position: absolute;
                        inset: 30px;
                        background: url('https://img.icons8.com/ios-filled/100/ffffff/human-head.png') no-repeat center center;
                        background-size: contain;
                        opacity: 0.03;
                        pointer-events: none;
                    }

                    .v2-slot {
                        background: rgba(15, 23, 42, 0.8);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 12px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .v2-slot:hover { border-color: #6366f1; background: rgba(99, 102, 241, 0.15); transform: translateY(-2px); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2); }
                    .v2-slot.active { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }

                    .v2-slot-inner { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; }
                    .v2-slot-inner img { width: 36px; height: 36px; image-rendering: pixelated; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); }
                    .v2-slot-placeholder { opacity: 0.2; color: #94a3b8; }

                    .v2-slot label { font-size: 0.5rem; text-transform: uppercase; color: #475569; position: absolute; bottom: 6px; font-weight: 800; letter-spacing: 0.5px; pointer-events: none; }

                    /* Slot Positions */
                    .slot-head { grid-column: 2; grid-row: 1; }
                    .slot-necklace { grid-column: 3; grid-row: 1; }
                    .slot-torso { grid-column: 2; grid-row: 2; }
                    .slot-weapon { grid-column: 1; grid-row: 2; height: 165px; grid-row: span 2; }
                    .slot-arms { grid-column: 3; grid-row: 2; }
                    .slot-ring { grid-column: 3; grid-row: 3; }
                    .slot-legs { grid-column: 2; grid-row: 3; }
                    .slot-boots { grid-column: 2; grid-row: 4; }

                    /* Bag Area */
                    .bag-section { flex: 1; display: flex; flex-direction: column; background: #0b1120; }
                    .bag-filters { padding: 15px; display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); overflow-x: auto; }
                    .filter-chip { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #94a3b8; padding: 6px 14px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-weight: 600; }
                    .filter-chip:hover { background: rgba(255,255,255,0.08); color: white; }
                    .filter-chip.active { background: #6366f1; color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

                    .bag-grid-container { flex: 1; overflow-y: auto; padding: 20px; }
                    .bag-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; }

                    .v2-item-card {
                        background: rgba(30, 41, 59, 0.4);
                        border: 1px solid rgba(255,255,255,0.05);
                        padding: 10px;
                        border-radius: 12px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        position: relative;
                        cursor: default;
                    }

                    .v2-item-card:hover { transform: translateY(-5px); border-color: rgba(99, 102, 241, 0.3); background: rgba(30, 41, 59, 0.8); box-shadow: 0 8px 25px rgba(0,0,0,0.5); }
                    .v2-item-card.is-equipped { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }

                    .v2-item-visual { height: 90px; background: rgba(0,0,0,0.4); border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.02); }
                    .v2-item-visual img { width: 44px; height: 44px; image-rendering: pixelated; z-index: 2; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6)); }
                    .v2-qty { position: absolute; top: 6px; right: 6px; font-size: 0.65rem; background: #6366f1; color: white; padding: 2px 6px; border-radius: 6px; font-weight: 800; z-index: 3; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }

                    .v2-item-meta { display: flex; flex-direction: column; gap: 8px; }
                    .v2-name { font-size: 0.8rem; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }
                    .v2-actions { display: flex; gap: 6px; }
                    .v2-actions button { flex: 1; height: 28px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                    .v2-actions button:hover { background: #6366f1; color: white; border-color: transparent; transform: scale(1.05); }
                    .v2-actions button.equip-btn:hover { background: #10b981; }
                    .v2-actions button.use-btn:hover { background: #f59e0b; }
                    
                    .equipped-tag { flex: 1; font-size: 0.6rem; color: #10b981; font-weight: 800; text-transform: uppercase; text-align: center; line-height: 28px; letter-spacing: 0.5px; }

                    .scrollable-v2::-webkit-scrollbar { width: 8px; }
                    .scrollable-v2::-webkit-scrollbar-track { background: transparent; }
                    .scrollable-v2::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                    .scrollable-v2::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }

                    @media (max-width: 900px) and (min-width: 769px) {
                        .inventory-v2-container { width: 100%; margin: 20px; max-width: calc(100vw - 40px); }
                        .character-section { flex: 0 0 280px; }
                        .paperdoll-container { transform: scale(0.85); transform-origin: center; }
                        .bag-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
                        .v2-item-card { min-width: 0; }
                    }

                    @media (max-width: 768px) {
                        .inventory-v2-container { height: 90vh; width: 100vw; max-width: 100vw; border-radius: 0; }
                        .inv-v2-body { flex-direction: column; overflow-y: auto; }
                        .character-section { flex: none; height: 380px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 20px 0; }
                        .bag-section { flex: none; height: auto; min-height: 500px; }
                    }

                    .rarity-common { border-top: 3px solid #94a3b8; }
                    .rarity-uncommon { border-top: 3px solid #22c55e; }
                    .rarity-rare { border-top: 3px solid #3b82f6; }
                    .rarity-epic { border-top: 3px solid #a855f7; }
                    .rarity-legendary { border-top: 3px solid #eab308; }

                    .v2-inspection-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(8px); animation: fadeIn 0.2s ease; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    
                    .v2-inspection-card { width: 340px; background: #1e293b; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 25px; box-shadow: 0 25px 60px rgba(0,0,0,0.8); animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                    @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

                    .v2-insp-header { display: flex; gap: 18px; margin-bottom: 20px; align-items: center; position: relative; }
                    .v2-insp-icon { width: 64px; height: 64px; background: rgba(0,0,0,0.4); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); }
                    .v2-insp-icon img { width: 44px; height: 44px; image-rendering: pixelated; }
                    .v2-insp-titles h4 { margin: 0; font-size: 1.2rem; color: white; font-weight: 800; }
                    .v2-insp-titles span { font-size: 0.7rem; color: #6366f1; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
                    .v2-insp-body p { font-size: 0.9rem; color: #94a3b8; font-style: italic; margin: 0 0 20px 0; line-height: 1.5; }
                    .v2-insp-stats { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255,255,255,0.02); }
                    .v2-stat-row { display: flex; justify-content: space-between; font-size: 0.8rem; }
                    .v2-stat-row span:first-child { color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 0.7rem; }
                    .v2-stat-row span:last-child { color: #10b981; font-weight: 800; }
                    .close-mini { position: absolute; top: -35px; right: -35px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                    .close-mini:hover { background: #ef4444; transform: rotate(90deg); }

                    .v2-insp-stats.consumable-effects {
                        background: rgba(245, 158, 11, 0.1);
                        border-color: rgba(245, 158, 11, 0.2);
                    }
                    .insp-label { font-size: 0.6rem; color: #64748b; text-transform: uppercase; margin-bottom: 8px; display: block; font-weight: 800; }
                    .effect-item span:first-child { color: #fbbf24 !important; }
                `}</style>
            </div>
        </div>
    );
};

function getEffectLabel(type, stat) {
    switch (type) {
        case 'get_gold': return 'ORO';
        case 'get_diamonds': return 'DIAMANTES';
        case 'get_xp': return 'EXP';
        case 'get_stat_point': return stat ? stat.toUpperCase() : 'STAT';
        default: return 'EFECTO';
    }
}

function getItemEmoji(type) {
    switch (type) {
        case 'WEAPON': return '⚔️';
        case 'ARMOR': return '🛡️';
        case 'CONSUMABLE': return '🧪';
        case 'EQUIPMENT': return '💍';
        default: return '📦';
    }
}
