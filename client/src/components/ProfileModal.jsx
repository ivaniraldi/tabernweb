import { X, Plus, Star, Shield, Sword, ShieldAlert, UserPlus, UserMinus, MessageSquare, Handshake } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ItemTooltip } from './ItemTooltip';

export const ProfileModal = ({ user, targetId, friends = [], backendUrl, onUpgradeStat, onAddFriend, onRemoveFriend, onSendMessage, onTrade, onClose }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const isMe = user.player.id === targetId;

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        if (isMe) {
            setProfileData(user);
            setLoading(false);
        } else {
            setLoading(true);
            fetch(`${backendUrl}/api/game/player/${targetId}`)
                .then(res => res.json())
                .then(data => {
                    setProfileData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching profile:", err);
                    setLoading(false);
                });
        }
    }, [targetId, user, isMe, backendUrl]);

    if (loading || !profileData) {
        return (
            <div className="auth-overlay">
                <div className="auth-card rpg-shop profile-modal">
                    <div className="rpg-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                        <div className="loading-spinner-small">Cargando perfil...</div>
                    </div>
                </div>
            </div>
        );
    }

    const player = profileData.player || profileData; // Handle both full user object and player object
    const username = profileData.username || profileData.user?.username || "Jugador";
    
    const baseStats = typeof player.stats === 'string' ? JSON.parse(player.stats) : player.stats;
    const statPoints = player.statPoints || 0;
    const equipment = typeof player.equipment === 'string' ? JSON.parse(player.equipment) : (player.equipment || {});
    const experience = player.experience || 0;
    const calculateLevel = (xp) => {
        if (xp <= 0) return 1;
        const n = Math.floor((-50 + Math.sqrt(2500 + 400 * xp)) / 200);
        return Math.max(1, n + 1);
    };
    const level = calculateLevel(experience);

    // Calculate total and bonus stats
    const totalStats = { armor: 0, ...baseStats };
    const bonusStats = { str: 0, dex: 0, int: 0, vit: 0, luk: 0, armor: 0 };
    const equippedItems = [];

    if (player.inventoryItems) {
        Object.values(equipment).forEach(invItemId => {
            const invItem = player.inventoryItems.find(i => i.id === invItemId);
            if (invItem && invItem.item.stats) {
                equippedItems.push(invItem.item);
                const itemStats = typeof invItem.item.stats === 'string' ? JSON.parse(invItem.item.stats) : invItem.item.stats;
                Object.keys(bonusStats).forEach(s => {
                    if (itemStats[s]) {
                        bonusStats[s] += itemStats[s];
                        totalStats[s] += itemStats[s];
                    }
                });
            }
        });
    }

    const statsConfig = [
        { key: 'str', label: 'Fuerza', desc: 'Aumenta el daño físico' },
        { key: 'dex', label: 'Destreza', desc: 'Aumenta la puntería y evasión' },
        { key: 'int', label: 'Inteligencia', desc: 'Aumenta el maná máximo' },
        { key: 'vit', label: 'Vitalidad', desc: 'Aumenta la vida máxima' },
        { key: 'luk', label: 'Suerte', desc: 'Aumenta el drop y crítico' },
        { key: 'armor', label: 'Armadura', desc: 'Reduce el daño físico recibido' },
    ];

    return (
        <div className="auth-overlay" onMouseMove={handleMouseMove}>
            <div className="auth-card rpg-shop profile-modal">
                <div className="rpg-header">
                    <div className="rpg-title">
                        <h2>{isMe ? 'Mi Perfil' : `Perfil de ${username}`}</h2>
                        <span className="rpg-subtitle" style={{textTransform: 'capitalize'}}>
                            {player.class || 'Aventurero'} • Nivel {level}
                        </span>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="rpg-body profile-body">
                    {/* Character Visual / Equipment Summary */}
                    <div className="profile-top-section">
                        <div className="profile-equipment-compact glass-panel">
                            <span className="mini-panel-label">Equipo Equipado</span>
                            <div className="compact-equip-grid">
                                {['head', 'torso', 'legs', 'arms', 'boots', 'necklace', 'ring', 'weapon'].map(slot => {
                                    const invItemId = equipment[slot];
                                    const invItem = player.inventoryItems?.find(i => i.id === invItemId);
                                    return (
                                        <div 
                                            key={slot} 
                                            className="mini-equip-slot" 
                                            title={invItem ? invItem.item.name : `Espacio de ${slot}`}
                                            onMouseEnter={() => invItem && setHoveredItem(invItem.item)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            onMouseMove={handleMouseMove}
                                        >
                                            {invItem ? (
                                                invItem.item.sprite_url ? (
                                                    <img src={invItem.item.sprite_url} alt={invItem.item.name} style={{ width: '24px', height: '24px', imageRendering: 'pixelated' }} />
                                                ) : (
                                                    <span style={{fontSize: '12px'}}>{getItemEmoji(invItem.item.type)}</span>
                                                )
                                            ) : (
                                                <Shield size={12} className="opacity-20" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Social Actions (Only for others) */}
                    {!isMe && (
                        <div className="social-actions-bar">
                            {!friends.some(f => f.id === targetId || f.friendId === targetId) && (
                                <button className="social-btn friend-btn" onClick={() => onAddFriend(username)}>
                                    <UserPlus size={16} /> Agregar Amigo
                                </button>
                            )}
                            <div className="social-row">
                                <button className="social-btn msg-btn" onClick={() => onSendMessage(username)}>
                                    <MessageSquare size={16} /> Mensaje
                                </button>
                                <button className="social-btn trade-btn" onClick={() => onTrade(targetId)}>
                                    <Handshake size={16} /> Comerciar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stat Points Badge (Only for ME) */}
                    {isMe && statPoints > 0 && (
                        <div className="stat-points-badge">
                            <Star size={16} className="text-yellow-400" />
                            <span>Puntos disponibles: <strong>{statPoints}</strong></span>
                        </div>
                    ) || (isMe && <div className="stat-points-badge inactive">Sin puntos disponibles</div>)}


                    <div className="stats-list">
                        {statsConfig.map(stat => (
                            <div key={stat.key} className="rpg-item-card stat-item">
                                <div className="rpg-item-info">
                                    <div className="stat-row">
                                        <span className="rpg-item-name">{stat.label}</span>
                                        <span className="stat-value-text">
                                            {totalStats[stat.key]}
                                            {bonusStats[stat.key] > 0 && <span style={{ color: '#10b981', fontSize: '0.75rem', marginLeft: '6px' }}>(+{bonusStats[stat.key]})</span>}
                                        </span>
                                    </div>
                                    <span className="rpg-item-type">{stat.desc}</span>
                                </div>
                                {isMe && statPoints > 0 && (
                                    <button 
                                        className="upgrade-btn"
                                        onClick={() => onUpgradeStat(stat.key)}
                                        title="Mejorar atributo"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Secondary Stats */}
                    <div className="secondary-stats-grid">
                        <div className="sec-stat">
                            <span>Ataque</span>
                            <span>{totalStats.atk + (totalStats.str * 2)}</span>
                        </div>
                        <div className="sec-stat">
                            <span>Defensa</span>
                            <span>{totalStats.def + (totalStats.vit * 2)}</span>
                        </div>
                        <div className="sec-stat">
                            <span>Velocidad</span>
                            <span>{totalStats.spd + Math.floor(totalStats.dex / 2)}</span>
                        </div>
                        <div className="sec-stat">
                            <span>Armadura</span>
                            <span>{totalStats.armor || 0}</span>
                        </div>
                    </div>

                    {!isMe && friends.some(f => f.id === targetId || f.friendId === targetId) && (
                        <button className="delete-friend-bottom-btn" onClick={() => onRemoveFriend(targetId)}>
                            <UserMinus size={14} /> Eliminar Amigo
                        </button>
                    )}
                </div>

                <div className="rpg-footer">
                    <div className="rpg-subtitle">XP: {experience}</div>
                    <button className="primary-btn mini" onClick={onClose} style={{ margin: 0, width: 'auto' }}>
                        Cerrar
                    </button>
                </div>
            </div>

            <style>{`
                .stats-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .stat-item {
                    cursor: default !important;
                    padding: 8px 12px !important;
                    background: rgba(15, 23, 42, 0.4);
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0px;
                }
                .stat-value-text {
                    font-weight: 800;
                    color: #6366f1;
                    font-size: 1rem;
                }
                .upgrade-btn {
                    background: #6366f1;
                    color: white;
                    border: none;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 4px;
                }
                .upgrade-btn:hover {
                    background: #4f46e5;
                    transform: scale(1.1);
                }
                .secondary-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 6px;
                    margin-top: 4px;
                }
                .sec-stat {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 6px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .sec-stat span:first-child {
                    font-size: 0.55rem;
                    text-transform: uppercase;
                    color: #64748b;
                }
                .sec-stat span:last-child {
                    font-weight: 800;
                    color: white;
                    font-size: 0.8rem;
                }
                .stat-points-badge {
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 4px;
                    color: #fbbf24;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .stat-points-badge.inactive {
                    background: rgba(255, 255, 255, 0.03);
                    border-color: rgba(255, 255, 255, 0.05);
                    color: #475569;
                    font-weight: 400;
                    margin-bottom: 4px;
                }
                .profile-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 16px;
                }
                .profile-top-section {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 8px;
                }
                .profile-equipment-compact {
                    width: 100%;
                    padding: 12px;
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .mini-panel-label {
                    font-size: 0.55rem;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 1px;
                    display: block;
                    margin-bottom: 8px;
                    text-align: center;
                    font-weight: 700;
                }
                .compact-equip-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                }
                .mini-equip-slot {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.05);
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                }
                .loading-spinner-small {
                    font-size: 0.8rem;
                    color: #6366f1;
                    font-weight: bold;
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                }

                .social-actions-bar {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                .social-row {
                    display: flex;
                    gap: 8px;
                }
                .social-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .friend-btn { background: rgba(99, 102, 241, 0.1); color: #818cf8; border-color: rgba(99, 102, 241, 0.2); }
                .friend-btn:hover { background: #6366f1; color: white; }
                .friend-btn.mini { display: none; }
                .delete-friend-bottom-btn {
                    margin-top: 15px;
                    background: rgba(244, 63, 94, 0.05);
                    color: #fb7185;
                    border: 1px solid rgba(244, 63, 94, 0.1);
                    padding: 8px;
                    width: 100%;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .delete-friend-bottom-btn:hover { background: #f43f5e; color: white; border-color: transparent; }
                .msg-btn { background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.2); }
                .msg-btn:hover { background: #10b981; color: white; }
                .trade-btn { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border-color: rgba(245, 158, 11, 0.2); }
                .trade-btn:hover { background: #f59e0b; color: white; }
            `}</style>
            
            {/* Tooltip */}
            <ItemTooltip item={hoveredItem} position={mousePos} />
        </div>
    );
};

function getItemEmoji(type) {
    switch (type) {
        case 'WEAPON': return '⚔️';
        case 'ARMOR': return '🛡️';
        case 'CONSUMABLE': return '🧪';
        case 'EQUIPMENT': return '💍';
        default: return '📦';
    }
}
