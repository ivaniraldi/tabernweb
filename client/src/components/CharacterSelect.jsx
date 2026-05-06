import { useState } from 'react';
import { Sword, Wand2, Target, Shield, Plus, LogIn } from 'lucide-react';
import { CharacterCreate } from './CharacterCreate';

const CLASS_META = {
    guerrero: { icon: Sword, color: '#ef4444', label: 'Guerrero' },
    mago:     { icon: Wand2,   color: '#a78bfa', label: 'Mago' },
    arquero:  { icon: Target,  color: '#10b981', label: 'Arquero' },
    tanque:   { icon: Shield,  color: '#3b82f6', label: 'Tanque' },
};

const calculateLevel = (xp) => {
    if (xp <= 0) return 1;
    const n = Math.floor((-50 + Math.sqrt(2500 + 400 * xp)) / 200);
    return Math.max(1, n + 1);
};

const PlayerSlot = ({ player, onSelect }) => {
    const meta = CLASS_META[player.class] || CLASS_META.guerrero;
    const Icon = meta.icon;
    const level = calculateLevel(player.experience);
    const stats = typeof player.stats === 'string' ? JSON.parse(player.stats) : player.stats;

    return (
        <button className="char-slot filled" style={{ '--slot-color': meta.color }} onClick={() => onSelect(player)}>
            <div className="slot-glow" style={{ background: `radial-gradient(ellipse at top, ${meta.color}22 0%, transparent 70%)` }} />
            <div className="slot-icon" style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}55` }}>
                <Icon size={40} color={meta.color} />
            </div>
            <div className="slot-info">
                <span className="slot-name">{player.name}</span>
                <span className="slot-class" style={{ color: meta.color }}>{meta.label}</span>
                <span className="slot-level">Nivel {level}</span>
            </div>
            <div className="slot-stats">
                <div className="mini-stat"><span style={{ color: '#ef4444' }}>STR</span> {stats?.str ?? 1}</div>
                <div className="mini-stat"><span style={{ color: '#10b981' }}>DEX</span> {stats?.dex ?? 1}</div>
                <div className="mini-stat"><span style={{ color: '#a78bfa' }}>INT</span> {stats?.int ?? 1}</div>
                <div className="mini-stat"><span style={{ color: '#3b82f6' }}>VIT</span> {stats?.vit ?? 1}</div>
            </div>
            <div className="slot-select-btn">
                <LogIn size={16} /> Jugar
            </div>
        </button>
    );
};

const EmptySlot = ({ onAdd }) => (
    <button className="char-slot empty" onClick={onAdd}>
        <Plus size={40} color="#334155" strokeWidth={1.5} />
        <span className="empty-label">Nuevo Personaje</span>
    </button>
);

export const CharacterSelect = ({ user, players, backendUrl, onSelect }) => {
    const [showCreate, setShowCreate] = useState(false);

    const handleCreated = (newPlayer) => {
        // Al crear un personaje nuevo, seleccionarlo directamente
        onSelect(newPlayer);
    };

    if (showCreate) {
        return (
            <CharacterCreate
                userId={user.id}
                username={user.username}
                backendUrl={backendUrl}
                onCreated={handleCreated}
                onBack={() => setShowCreate(false)}
            />
        );
    }

    const slots = [
        players[0] || null,
        players[1] || null,
    ];

    return (
        <div className="auth-overlay char-select-overlay">
            <div className="char-select-card">
                <div className="char-select-header">
                    <h2>Selecciona tu Personaje</h2>
                    <span className="char-select-subtitle">Bienvenido de vuelta, <strong>{user.username}</strong></span>
                </div>

                <div className="char-select-grid">
                    {slots.map((player, i) =>
                        player ? (
                            <PlayerSlot key={player.id} player={player} onSelect={onSelect} />
                        ) : (
                            <EmptySlot key={`empty-${i}`} onAdd={() => setShowCreate(true)} />
                        )
                    )}
                </div>

                <p className="char-select-hint">Puedes tener hasta 2 personajes por cuenta.</p>
            </div>

            <style>{`
                .char-select-overlay {
                    background: rgba(0, 0, 0, 0.85) !important;
                    backdrop-filter: blur(12px) !important;
                }
                .char-select-card {
                    background: rgba(15, 23, 42, 0.95);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-top: 3px solid #6366f1;
                    width: 100%;
                    max-width: 660px;
                    padding: 0;
                    color: white;
                    animation: fadeIn 0.4s ease-out;
                }
                .char-select-header {
                    padding: 28px 32px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.3);
                }
                .char-select-header h2 {
                    margin: 0 0 4px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: #f8fafc;
                }
                .char-select-subtitle {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .char-select-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    padding: 28px 32px;
                }
                .char-slot {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 28px 20px;
                    border: 1px solid rgba(255,255,255,0.07);
                    background: rgba(0,0,0,0.2);
                    cursor: pointer;
                    transition: all 0.25s;
                    overflow: hidden;
                    text-align: center;
                }
                .char-slot.filled {
                    border-color: rgba(var(--slot-color-rgb, 99,102,241), 0.25);
                }
                .char-slot.filled:hover {
                    border-color: var(--slot-color, #6366f1);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                }
                .slot-glow {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .char-slot.empty {
                    border: 1px dashed rgba(255,255,255,0.1);
                    color: #334155;
                    gap: 8px;
                }
                .char-slot.empty:hover {
                    border-color: rgba(99,102,241,0.4);
                    background: rgba(99,102,241,0.05);
                    color: #6366f1;
                    transform: translateY(-3px);
                }
                .slot-icon {
                    width: 72px;
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    z-index: 1;
                }
                .slot-info {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    position: relative;
                    z-index: 1;
                }
                .slot-name {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #f8fafc;
                }
                .slot-class {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                }
                .slot-level {
                    font-size: 0.7rem;
                    color: #475569;
                    font-weight: 600;
                }
                .slot-stats {
                    display: flex;
                    gap: 10px;
                    background: rgba(0,0,0,0.3);
                    padding: 8px 12px;
                    width: 100%;
                    justify-content: center;
                    position: relative;
                    z-index: 1;
                }
                .mini-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1px;
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: #94a3b8;
                    font-family: 'JetBrains Mono', monospace;
                }
                .mini-stat span {
                    font-size: 0.5rem;
                    font-weight: 900;
                    text-transform: uppercase;
                }
                .slot-select-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--slot-color, #6366f1);
                    color: white;
                    padding: 8px 20px;
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0;
                    transform: translateY(4px);
                    transition: all 0.2s;
                    position: relative;
                    z-index: 1;
                }
                .char-slot.filled:hover .slot-select-btn {
                    opacity: 1;
                    transform: translateY(0);
                }
                .empty-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .char-select-hint {
                    text-align: center;
                    color: #334155;
                    font-size: 0.7rem;
                    padding: 0 32px 20px;
                    margin: 0;
                }

                @media (max-width: 480px) {
                    .char-select-grid { grid-template-columns: 1fr; padding: 20px; }
                }
            `}</style>
        </div>
    );
};
