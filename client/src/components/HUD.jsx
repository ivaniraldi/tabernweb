import {
    Coins,
    Gem,
    Zap,
    Settings,
    Package,
    MapPin,
    ChevronUp,
    ChevronDown,
    Users,
    User as UserIcon
} from 'lucide-react';

export const HUD = ({ user, mapId, pos, isMinimized, onToggleMinimize, onOpenSettings, onOpenInventory, onOpenProfile, onOpenSocial }) => {
    const totalXp = user.player.experience;

    // XP(n) = 100n^2 + 50n
    const calculateLevel = (xp) => {
        if (xp <= 0) return 1;
        // Resolver 100n^2 + 50n - XP = 0
        const n = Math.floor((-50 + Math.sqrt(2500 + 400 * xp)) / 200);
        return Math.max(1, n + 1);
    };

    const getXPForLevel = (level) => {
        const n = Math.max(0, level - 1);
        return 100 * (n * n) + 50 * n;
    };

    const currentLevel = calculateLevel(totalXp);
    const prevLevelXp = getXPForLevel(currentLevel);
    const nextLevelXp = getXPForLevel(currentLevel + 1);

    const progressXp = Math.max(0, totalXp - prevLevelXp);
    const requiredXpForNext = nextLevelXp - prevLevelXp;
    const expPercentage = requiredXpForNext > 0
        ? Math.min(100, (progressXp / requiredXpForNext) * 100)
        : 0;

    const mapNames = {
        'map1': 'Taberna',
        'map2': 'Mundo Exterior'
    };
    const currentMapName = mapNames[mapId] || 'Desconocido';

    return (
        <>
            <div className="hud">
                <div className={`player-stats ${isMinimized ? 'minimized' : 'expanded'}`}>
                    {/* Fila 1: Identidad y Acciones */}
                    <div className="hud-header">
                        <div className="header-left">
                            <span className="level-badge">LVL {currentLevel}</span>
                            <span className="name">{user.username}</span>
                            <span className="map-name">
                                <MapPin size={10} /> {currentMapName}
                            </span>
                        </div>
                        <div className="hud-actions">
                            <button className="icon-btn" onClick={onToggleMinimize} title={isMinimized ? "Expandir" : "Minimizar"}>
                                {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                            </button>
                            <button className="icon-btn" onClick={onOpenProfile} title="Perfil">
                                <UserIcon size={16} />
                            </button>
                            <button className="icon-btn" onClick={onOpenInventory} title="Inventario">
                                <Package size={16} />
                            </button>
                            <button className="icon-btn" onClick={onOpenSocial} title="Amigos">
                                <Users size={16} />
                            </button>
                            <button className="icon-btn" onClick={onOpenSettings} title="Ajustes">
                                <Settings size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Fila 2: Barras y Economía (Siempre visible) */}
                    <div className="stats-compact-row">
                        <div className="bars-group">
                            <div className="hud-bar-mini hp">
                                <div className="hud-bar-fill" style={{ width: `${((user.player.stats?.hp || 100) / (user.player.stats?.maxHp || 100)) * 100}%` }}></div>
                                <span className="hud-bar-text">HP {user.player.stats?.hp || 100}</span>
                            </div>
                            <div className="hud-bar-mini mp">
                                <div className="hud-bar-fill" style={{ width: `${((user.player.stats?.mp || 50) / (user.player.stats?.maxMp || 50)) * 100}%` }}></div>
                                <span className="hud-bar-text">MP {user.player.stats?.mp || 50}</span>
                            </div>
                        </div>

                        <div className="currency-group">
                            <div className="currency-item gold">
                                <Coins size={12} className="gold-val" />
                                <span className="val">{user.player.gold}</span>
                            </div>
                            <div className="currency-item diamond">
                                <Gem size={12} className="diamond-val" />
                                <span className="val">{user.player.diamonds}</span>
                            </div>
                        </div>
                    </div>

                    {/* Fila 3: Detalles (Solo si está expandido) */}
                    {!isMinimized && (
                        <div className="details-row">
                            <div className="detail-item">
                                <MapPin size={10} />
                                <span>{Math.round(pos.x)}, {Math.round(pos.y)}</span>
                            </div>
                            <div className="detail-item">
                                <Zap size={10} />
                                <span>FPS: 60</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Fixed EXP Bar */}
            <div className="exp-bar-fixed">
                <div className="exp-label-top">EXP</div>
                <div className="exp-progress-container">
                    <div className="exp-progress-fill" style={{ width: `${expPercentage}%` }}></div>
                    <div className="exp-text-inner">
                        {progressXp} / {requiredXpForNext}
                    </div>
                </div>
            </div>
            <style>{`
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .stats-compact-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding-top: 6px;
                    margin-top: 6px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .bars-group {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    flex: 1;
                    padding-top: 8px;
                }
                .hud-bar-mini {
                    height: 4px;
                    background: rgba(0, 0, 0, 0.3);
                    position: relative;
                    width: 100%;
                    max-width: 140px;
                    border-radius: 99px;
                }
                .hud-bar-mini .hud-bar-fill {
                    height: 100%;
                    border-radius: 99px;
                }
                .hp .hud-bar-fill { background: linear-gradient(90deg, #ef4444, #b91c1c); }
                .mp .hud-bar-fill { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
                
                .hud-bar-text {
                    position: absolute;
                    top: -11px;
                    left: 0;
                    font-size: 0.55rem;
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.9);
                    font-family: 'JetBrains Mono', monospace;
                    text-transform: uppercase;
                }
                .currency-group {
                    display: flex;
                    gap: 10px;
                }
                .currency-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: rgba(0,0,0,0.2);
                    padding: 2px 6px;
                }
                .currency-item .val {
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .map-name {
                    font-size: 0.65rem;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    margin-left: 4px;
                }
                .level-badge {
                    background: #6366f1;
                    color: white;
                    padding: 1px 4px;
                    font-size: 0.6rem;
                    font-weight: 900;
                }
                .name {
                    font-weight: 700;
                    font-size: 0.9rem;
                    color: white;
                }
                .details-row {
                    display: flex;
                    justify-content: space-between;
                    padding-top: 6px;
                    margin-top: 6px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.65rem;
                    color: #475569;
                    font-family: 'JetBrains Mono', monospace;
                }
                .hud-actions .icon-btn:first-child {
                    margin-left: 6px;
                }
                .icon-btn {
                    background: transparent;
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    color: #94a3b8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .icon-btn:focus, .icon-btn:active {
                    outline: none !important;
                    border: none !important;
                }
                .icon-btn:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </>
    );
};
