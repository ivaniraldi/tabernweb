import React, { useLayoutEffect, useRef, useState } from 'react';

export const ItemTooltip = ({ item, position }) => {
    const tooltipRef = useRef(null);
    const [coords, setCoords] = useState({ x: -1000, y: -1000 });

    useLayoutEffect(() => {
        if (!tooltipRef.current || !item) return;

        const { width, height } = tooltipRef.current.getBoundingClientRect();
        let x = position.x + 20;
        let y = position.y + 20;

        // Ajuste horizontal
        if (x + width > window.innerWidth) {
            x = position.x - width - 20;
        }

        // Ajuste vertical
        if (y + height > window.innerHeight) {
            y = position.y - height - 20;
        }

        setCoords({ x, y });
    }, [position, item]);

    if (!item) return null;

    const stats = item.stats ? (typeof item.stats === 'string' ? JSON.parse(item.stats) : item.stats) : {};
    const hasStats = Object.values(stats).some(v => v > 0);

    return (
        <div 
            ref={tooltipRef}
            className="item-tooltip-container"
            style={{ 
                left: coords.x, 
                top: coords.y,
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none',
                visibility: coords.x === -1000 ? 'hidden' : 'visible'
            }}
        >
            <div className={`item-tooltip-content rarity-border-${item.rarity.toLowerCase()}`}>
                <div className="tooltip-header">
                    <h4 className={`rarity-${item.rarity.toLowerCase()}`}>{item.name}</h4>
                    <span className="tooltip-type">{item.type} {item.slot ? `(${item.slot})` : ''}</span>
                </div>

                <div className="tooltip-body">
                    <p className="tooltip-description">{item.description || "Un objeto misterioso."}</p>
                    
                    {hasStats && item.type !== 'CONSUMABLE' && (
                        <div className="tooltip-stats">
                            {Object.entries(stats)
                                .filter(([_, val]) => val > 0)
                                .map(([stat, val]) => (
                                    <div key={stat} className="tooltip-stat-row">
                                        <span className="stat-name">{stat.toUpperCase()}</span>
                                        <span className="stat-val">+{val}</span>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {item.type === 'CONSUMABLE' && stats.effects && (
                        <div className="tooltip-stats effects">
                            <span className="effects-label">Efectos:</span>
                            {stats.effects.map((effect, i) => (
                                <div key={i} className="tooltip-stat-row effect-row">
                                    <span className="stat-name">{getEffectLabel(effect.type, effect.stat)}</span>
                                    <span className="stat-val">+{effect.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="tooltip-footer">
                        <div className="footer-item">
                            <span className="label">Nivel Req.</span>
                            <span className="val">{item.levelRequired || 1}</span>
                        </div>
                        <div className="footer-item">
                            <span className="label">Rareza</span>
                            <span className={`val rarity-${item.rarity.toLowerCase()}`}>{item.rarity}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .item-tooltip-container {
                    animation: tooltipFadeIn 0.15s ease-out;
                }
                .item-tooltip-content {
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px;
                    width: 220px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                }
                .tooltip-header {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    padding-bottom: 8px;
                    margin-bottom: 8px;
                }
                .tooltip-header h4 {
                    margin: 0;
                    font-size: 0.9rem;
                    letter-spacing: 0.5px;
                }
                .tooltip-type {
                    font-size: 0.65rem;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: bold;
                }
                .tooltip-description {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-bottom: 10px;
                    font-style: italic;
                    line-height: 1.3;
                }
                .tooltip-stats {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 6px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 10px;
                }
                .tooltip-stat-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                }
                .tooltip-stat-row .stat-name { color: #64748b; }
                .tooltip-stat-row .stat-val { color: #10b981; font-weight: bold; }

                .tooltip-footer {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .footer-item { display: flex; flex-direction: column; }
                .footer-item .label { font-size: 0.55rem; color: #64748b; text-transform: uppercase; }
                .footer-item .val { font-size: 0.7rem; font-weight: bold; }

                @keyframes tooltipFadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .rarity-border-legendary { border-left: 3px solid #eab308; }

                .effects-label {
                    display: block;
                    font-size: 0.55rem;
                    text-transform: uppercase;
                    color: #475569;
                    font-weight: 800;
                    margin-bottom: 4px;
                    letter-spacing: 0.5px;
                }
                .effect-row .stat-name {
                    color: #fbbf24 !important;
                }
                .tooltip-stats.effects {
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                }
            `}</style>
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
