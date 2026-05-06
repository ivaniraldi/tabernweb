import React, { useState, useRef } from 'react';
import { X, Coins, TrendingUp, Info, Trophy, Minus, Plus } from 'lucide-react';

export const SlotModal = ({ user, setUser, backendUrl, onClose }) => {
    const [bet, setBet] = useState(10);
    const [isSpinning, setIsSpinning] = useState(false);
    const [reels, setReels] = useState(['💎', '💎', '💎']);
    const [reelStates, setReelStates] = useState([false, false, false]);
    const [message, setMessage] = useState('¡PRUEBA TU SUERTE!');
    const [lastWin, setLastWin] = useState(0);
    const [showPaytable, setShowPaytable] = useState(false);

    const symbols = ['🍒', '🍋', '🍊', '🔔', '💎', '7️⃣'];
    const multipliers = { '🍒': 0.8, '🍋': 1.5, '🍊': 3, '🔔': 5, '💎': 15, '7️⃣': 30 };

    const reelStatesRef = useRef([false, false, false]);

    const handleSpin = async () => {
        if (isSpinning) return;
        if (user.player.gold < bet) {
            setMessage('ORO INSUFICIENTE');
            return;
        }

        setIsSpinning(true);
        setLastWin(0);
        setMessage('GIRANDO...');
        reelStatesRef.current = [true, true, true];
        setReelStates([true, true, true]);

        try {
            const res = await fetch(`${backendUrl}/api/game/slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: user.player.id, bet })
            });

            const data = await res.json();
            
            if (res.ok) {
                const spinInterval = setInterval(() => {
                    setReels(prev => prev.map((sym, i) => 
                        reelStatesRef.current[i] ? symbols[Math.floor(Math.random() * symbols.length)] : sym
                    ));
                }, 80);

                // Parada secuencial
                setTimeout(() => {
                    reelStatesRef.current = [false, true, true];
                    setReelStates([false, true, true]);
                    setReels(prev => [data.reels[0], prev[1], prev[2]]);
                }, 800);

                setTimeout(() => {
                    reelStatesRef.current = [false, false, true];
                    setReelStates([false, false, true]);
                    setReels(prev => [data.reels[0], data.reels[1], prev[2]]);
                }, 1600);

                setTimeout(() => {
                    clearInterval(spinInterval);
                    reelStatesRef.current = [false, false, false];
                    setReelStates([false, false, false]);
                    setReels(data.reels);
                    setIsSpinning(false);
                    setMessage(data.isWin ? '¡HAS GANADO!' : 'INTÉNTALO DE NUEVO');
                    setLastWin(data.winAmount);
                    setUser({ ...user, player: data.player });
                }, 2400);
            } else {
                setMessage(data.error || 'ERROR');
                setIsSpinning(false);
                setReelStates([false, false, false]);
            }
        } catch (err) {
            setMessage('ERROR DE RED');
            setIsSpinning(false);
            setReelStates([false, false, false]);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-card rpg-shop slots-mini-modal">
                <div className="rpg-header">
                    <div className="rpg-title">
                        <h2>Casino de la Taberna</h2>
                        <div className="slot-stats-mini">
                            <div className="stat-item gold"><Coins size={12}/> {user.player.gold.toLocaleString()}</div>
                            <div className="stat-item luck"><TrendingUp size={12}/> LUK: {user.player.stats?.luk || 0}</div>
                        </div>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="rpg-body slot-mini-body">
                    {/* Paytable Toggle */}
                    <button className="paytable-btn" onClick={() => setShowPaytable(!showPaytable)}>
                        <Info size={14} /> {showPaytable ? 'Ocultar Premios' : 'Ver Premios'}
                    </button>

                    {showPaytable && (
                        <div className="paytable-list glass-panel">
                            {Object.entries(multipliers).reverse().map(([s, m]) => (
                                <div key={s} className="pay-item">
                                    <span>{s}{s}{s}</span>
                                    <strong>x{m}</strong>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Reels */}
                    <div className="reels-view glass-panel">
                        {reels.map((symbol, i) => (
                            <div key={i} className={`reel-slot ${reelStates[i] ? 'is-spinning' : 'is-stopped'}`}>
                                {symbol}
                            </div>
                        ))}
                        <div className="target-line"></div>
                    </div>

                    {/* Message Area */}
                    <div className={`status-display ${lastWin > 0 ? 'is-win' : ''}`}>
                        <p>{message}</p>
                        {lastWin > 0 && <div className="win-badge"><Trophy size={14} /> +{lastWin}</div>}
                    </div>

                    {/* Betting & Play */}
                    <div className="action-area">
                        <div className="bet-config">
                            <span className="mini-label">TU APUESTA</span>
                            <div className="bet-input-row">
                                <button className="adj-btn" onClick={() => setBet(Math.max(5, bet - 10))} disabled={isSpinning}><Minus size={14}/></button>
                                <div className="bet-val">
                                    <input 
                                        type="number" 
                                        value={bet} 
                                        onChange={(e) => setBet(Math.min(1000, Math.max(5, parseInt(e.target.value) || 0)))}
                                        disabled={isSpinning}
                                    />
                                </div>
                                <button className="adj-btn" onClick={() => setBet(Math.min(1000, bet + 10))} disabled={isSpinning}><Plus size={14}/></button>
                            </div>
                            <div className="shortcuts-row">
                                <button onClick={() => setBet(5)} disabled={isSpinning}>MIN</button>
                                <button onClick={() => setBet(Math.min(1000, user.player.gold))} disabled={isSpinning}>MAX</button>
                            </div>
                        </div>

                        <button 
                            className={`play-btn ${isSpinning ? 'spinning' : ''}`}
                            onClick={handleSpin}
                            disabled={isSpinning || user.player.gold < bet}
                        >
                            {isSpinning ? 'ESPERANDO...' : '¡GIRAR!'}
                        </button>
                    </div>
                </div>

                <div className="rpg-footer">
                    <span className="footer-info">Apuesta mín: 5 | máx: 1000</span>
                    <button className="primary-btn mini" onClick={onClose} style={{width: 'auto', margin: 0}}>Cerrar</button>
                </div>

                <style>{`
                    .slots-mini-modal {
                        width: 95%;
                        max-width: 380px;
                        max-height: 95vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .slot-stats-mini { display: flex; gap: 10px; margin-top: 2px; }
                    .stat-item { font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; gap: 4px; }
                    .stat-item.gold { color: #facc15; }
                    .stat-item.luck { color: #4ade80; }

                    .slot-mini-body { padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
                    
                    .paytable-btn { background: none; border: none; color: #64748b; font-size: 0.6rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; align-self: flex-end; }
                    .paytable-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 0.7rem; background: rgba(0,0,0,0.3); border-radius: 8px; }
                    .pay-item { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 4px; }
                    .pay-item strong { color: #facc15; }

                    .reels-view { 
                        display: flex; 
                        justify-content: center; 
                        gap: 12px; 
                        padding: 32px 16px; 
                        background: rgba(0,0,0,0.6); 
                        position: relative; 
                        overflow: hidden; 
                        border-radius: 16px;
                        border: 1px solid rgba(255,255,255,0.1);
                        min-height: 180px;
                    }
                    .reel-slot { 
                        width: 90px; 
                        height: 140px; 
                        background: #0f172a; 
                        border-radius: 12px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        font-size: 4rem; 
                        border: 2px solid rgba(255,255,255,0.1);
                        box-shadow: inset 0 0 25px rgba(0,0,0,0.8);
                    }
                    
                    .is-spinning { animation: reel-blur-mini 0.1s infinite alternate; filter: blur(4px); }
                    @keyframes reel-blur-mini { from { transform: translateY(-4px); } to { transform: translateY(4px); } }
                    .is-stopped { animation: reel-pop-mini 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    @keyframes reel-pop-mini { from { transform: scale(0.8) translateY(10px); } to { transform: scale(1) translateY(0); } }
                    
                    .target-line { position: absolute; left: 0; right: 0; top: 50%; height: 3px; background: rgba(99, 102, 241, 0.4); pointer-events: none; box-shadow: 0 0 15px rgba(99, 102, 241, 0.3); z-index: 5; }

                    .status-display { text-align: center; min-height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                    .status-display p { font-size: 0.9rem; font-weight: 900; color: #94a3b8; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
                    .status-display.is-win p { color: #facc15; text-shadow: 0 0 10px rgba(250, 204, 21, 0.5); }
                    .win-badge { background: #facc15; color: #000; padding: 4px 16px; border-radius: 99px; font-weight: 900; font-size: 1.1rem; margin-top: 8px; display: flex; align-items: center; gap: 6px; animation: bounce 0.5s infinite; }

                    .action-area { display: flex; flex-direction: column; gap: 20px; }
                    .bet-config { background: rgba(0,0,0,0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                    .mini-label { font-size: 0.7rem; color: #64748b; font-weight: 800; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                    .bet-input-row { display: flex; gap: 10px; align-items: center; }
                    .adj-btn { width: 40px; height: 40px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; cursor: pointer; transition: all 0.2s; }
                    .adj-btn:hover:not(:disabled) { background: #334155; border-color: #6366f1; }
                    .bet-val { flex: 1; height: 40px; background: #000; border-radius: 8px; display: flex; align-items: center; padding: 0 12px; border: 1px solid rgba(99, 102, 241, 0.2); }
                    .bet-val input { background: none; border: none; color: #facc15; font-weight: 900; width: 100%; text-align: center; font-size: 1.2rem; outline: none; }
                    .shortcuts-row { display: flex; gap: 8px; margin-top: 10px; }
                    .shortcuts-row button { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid #1e293b; color: #94a3b8; font-size: 0.7rem; font-weight: 800; padding: 6px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
                    .shortcuts-row button:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: white; }

                    .play-btn { width: 100%; padding: 18px; background: #6366f1; color: white; border: none; border-radius: 12px; font-weight: 900; font-size: 1.2rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 0 #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
                    .play-btn:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 6px 0 #3730a3; }
                    .play-btn:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 0 0 #3730a3; }
                    .play-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

                    .footer-info { font-size: 0.65rem; color: #475569; font-weight: 700; letter-spacing: 0.5px; }

                    @media (max-width: 400px) {
                        .reel-slot { width: 75px; height: 110px; font-size: 3rem; }
                        .slots-mini-modal { width: 98%; }
                        .reels-view { min-height: 140px; padding: 20px 8px; }
                        .play-btn { padding: 14px; font-size: 1rem; }
                    }
                `}</style>
            </div>
        </div>
    );
};
