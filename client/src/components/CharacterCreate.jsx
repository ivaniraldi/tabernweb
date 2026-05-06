import { useState } from 'react';
import { Sword, Wand2, Target, Shield, ChevronRight, User } from 'lucide-react';

const CLASSES = [
    {
        id: 'guerrero',
        name: 'Guerrero',
        icon: Sword,
        color: '#ef4444',
        description: 'Maestro del combate cuerpo a cuerpo. Alta fuerza y resistencia moderada.',
        stats: { str: 3, dex: 1, int: 0, vit: 1 },
        tagline: 'Fuerza y Honor'
    },
    {
        id: 'mago',
        name: 'Mago',
        icon: Wand2,
        color: '#a78bfa',
        description: 'Domina las artes arcanas. Inteligencia elevada para devastar con hechizos.',
        stats: { str: 0, dex: 0, int: 3, vit: 2 },
        tagline: 'Poder Arcano'
    },
    {
        id: 'arquero',
        name: 'Arquero',
        icon: Target,
        color: '#10b981',
        description: 'Precisión letal desde la distancia. Destreza suprema para golpes críticos.',
        stats: { str: 1, dex: 3, int: 1, vit: 0 },
        tagline: 'Precisión Letal'
    },
    {
        id: 'tanque',
        name: 'Tanque',
        icon: Shield,
        color: '#3b82f6',
        description: 'Bastión inquebrantable. Vitalidad máxima para absorber todos los golpes.',
        stats: { str: 1, dex: 0, int: 0, vit: 4 },
        tagline: 'Inquebrantable'
    },
];

const STAT_LABELS = {
    str: { label: 'STR', color: '#ef4444', desc: 'Fuerza' },
    dex: { label: 'DEX', color: '#10b981', desc: 'Destreza' },
    int: { label: 'INT', color: '#a78bfa', desc: 'Inteligencia' },
    vit: { label: 'VIT', color: '#3b82f6', desc: 'Vitalidad' },
};

export const CharacterCreate = ({ userId, username, backendUrl, onCreated, onBack }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [charName, setCharName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!charName.trim()) return setError('Ingresa un nombre para tu personaje');
        if (!selectedClass) return setError('Selecciona una clase');
        if (charName.trim().length < 3) return setError('El nombre debe tener al menos 3 caracteres');
        if (charName.trim().length > 20) return setError('El nombre no puede tener más de 20 caracteres');

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${backendUrl}/api/auth/create-character`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, name: charName.trim(), className: selectedClass.id })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Error al crear el personaje');
            } else {
                onCreated(data.player);
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const cls = selectedClass;

    return (
        <div className="auth-overlay char-create-overlay">
            <div className="char-create-card">
                {/* Header */}
                <div className="char-create-header">
                    <div>
                        <h2>Crear Personaje</h2>
                        <span className="char-create-subtitle">Bienvenido, <strong>{username}</strong>. Define tu destino.</span>
                    </div>
                    {onBack && (
                        <button className="char-back-btn" onClick={onBack}>← Volver</button>
                    )}
                </div>

                <div className="char-create-body">
                    {/* Selector de clase */}
                    <div className="char-class-section">
                        <p className="char-section-label">Elige tu Clase</p>
                        <div className="char-class-grid">
                            {CLASSES.map(c => {
                                const Icon = c.icon;
                                const isSelected = selectedClass?.id === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        className={`char-class-card ${isSelected ? 'selected' : ''}`}
                                        style={{ '--class-color': c.color }}
                                        onClick={() => setSelectedClass(c)}
                                    >
                                        <div className="class-icon-wrap" style={{ background: `${c.color}22`, border: `1px solid ${c.color}66` }}>
                                            <Icon size={28} color={c.color} />
                                        </div>
                                        <span className="class-name">{c.name}</span>
                                        <span className="class-tagline" style={{ color: c.color }}>{c.tagline}</span>
                                        {isSelected && <div className="class-selected-glow" style={{ background: c.color }} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview de stats + nombre */}
                    <div className="char-right-panel">
                        {/* Descripción de clase */}
                        {cls ? (
                            <div className="char-class-info" style={{ borderColor: `${cls.color}44` }}>
                                <p className="char-class-desc">{cls.description}</p>
                                <div className="char-stats-preview">
                                    {Object.entries(STAT_LABELS).map(([key, meta]) => {
                                        const base = 1;
                                        const bonus = cls.stats[key] || 0;
                                        const total = base + bonus;
                                        const maxVal = 5;
                                        return (
                                            <div key={key} className="stat-preview-row">
                                                <span className="stat-preview-label" style={{ color: meta.color }}>{meta.label}</span>
                                                <span className="stat-preview-desc">{meta.desc}</span>
                                                <div className="stat-preview-bar-track">
                                                    <div
                                                        className="stat-preview-bar-fill"
                                                        style={{ width: `${(total / maxVal) * 100}%`, background: meta.color }}
                                                    />
                                                </div>
                                                <span className="stat-preview-val">{total}</span>
                                                {bonus > 0 && <span className="stat-preview-bonus">+{bonus}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="char-empty-info">
                                <User size={48} color="#334155" />
                                <p>Selecciona una clase para ver sus atributos</p>
                            </div>
                        )}

                        {/* Nombre del personaje */}
                        <div className="char-name-section">
                            <p className="char-section-label">Nombre del Personaje</p>
                            <input
                                id="char-name-input"
                                type="text"
                                className="char-name-input"
                                placeholder="Ej: Thorin, Luna, Izael..."
                                value={charName}
                                onChange={e => setCharName(e.target.value)}
                                maxLength={20}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            />
                            <span className="char-name-counter">{charName.length}/20</span>
                        </div>

                        {error && <p className="char-error">{error}</p>}

                        <button
                            className="char-create-btn"
                            onClick={handleCreate}
                            disabled={loading || !selectedClass || !charName.trim()}
                            style={cls ? { background: cls.color, boxShadow: `0 0 20px ${cls.color}44` } : {}}
                        >
                            {loading ? 'Creando...' : (
                                <>Crear Personaje <ChevronRight size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .char-create-overlay {
                    background: rgba(0, 0, 0, 0.85) !important;
                    backdrop-filter: blur(12px) !important;
                }
                .char-create-card {
                    background: rgba(15, 23, 42, 0.95);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-top: 3px solid #6366f1;
                    width: 100%;
                    max-width: 780px;
                    max-height: 90vh;
                    overflow-y: auto;
                    color: white;
                    animation: fadeIn 0.4s ease-out;
                }
                .char-create-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 24px 28px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.3);
                }
                .char-create-header h2 {
                    margin: 0 0 4px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.6rem;
                    font-weight: 800;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: #f8fafc;
                }
                .char-create-subtitle {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .char-back-btn {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #64748b;
                    padding: 6px 14px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.2s;
                }
                .char-back-btn:hover { color: white; border-color: rgba(255,255,255,0.3); }

                .char-create-body {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0;
                    padding: 0;
                }

                .char-class-section {
                    padding: 24px;
                    border-right: 1px solid rgba(255,255,255,0.05);
                }
                .char-right-panel {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .char-section-label {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #475569;
                    font-weight: 800;
                    margin: 0 0 12px;
                }

                .char-class-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .char-class-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    padding: 16px 12px;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.06);
                    cursor: pointer;
                    transition: all 0.2s;
                    overflow: hidden;
                }
                .char-class-card:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: var(--class-color, #6366f1);
                    transform: translateY(-2px);
                }
                .char-class-card.selected {
                    border-color: var(--class-color, #6366f1);
                    background: rgba(0,0,0,0.4);
                }
                .class-selected-glow {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    opacity: 0.8;
                }
                .class-icon-wrap {
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0;
                }
                .class-name {
                    font-weight: 800;
                    font-size: 0.9rem;
                    font-family: 'Outfit', sans-serif;
                    color: #f1f5f9;
                }
                .class-tagline {
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .char-class-info {
                    border: 1px solid rgba(99,102,241,0.3);
                    padding: 16px;
                    background: rgba(0,0,0,0.2);
                }
                .char-class-desc {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin: 0 0 16px;
                }
                .char-stats-preview {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .stat-preview-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .stat-preview-label {
                    font-size: 0.65rem;
                    font-weight: 900;
                    font-family: 'JetBrains Mono', monospace;
                    width: 32px;
                    text-transform: uppercase;
                }
                .stat-preview-desc {
                    font-size: 0.65rem;
                    color: #475569;
                    width: 70px;
                }
                .stat-preview-bar-track {
                    flex: 1;
                    height: 4px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .stat-preview-bar-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.4s ease;
                }
                .stat-preview-val {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #f1f5f9;
                    width: 16px;
                    text-align: right;
                }
                .stat-preview-bonus {
                    font-size: 0.6rem;
                    color: #10b981;
                    font-weight: 700;
                    width: 24px;
                }
                .char-empty-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: #334155;
                    font-size: 0.8rem;
                    padding: 32px;
                    border: 1px dashed rgba(255,255,255,0.06);
                    text-align: center;
                }

                .char-name-section {
                    position: relative;
                }
                .char-name-input {
                    width: 100%;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-bottom: 2px solid #6366f1;
                    color: white;
                    padding: 12px 14px;
                    font-size: 1rem;
                    font-family: 'Outfit', sans-serif;
                    outline: none;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .char-name-input:focus { border-color: #818cf8; background: rgba(0,0,0,0.5); }
                .char-name-counter {
                    position: absolute;
                    right: 8px;
                    bottom: -18px;
                    font-size: 0.6rem;
                    color: #475569;
                }

                .char-error {
                    color: #ef4444;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 0;
                }
                .char-create-btn {
                    width: 100%;
                    padding: 14px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    font-weight: 800;
                    font-size: 0.9rem;
                    font-family: 'Outfit', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: auto;
                }
                .char-create-btn:hover:not(:disabled) {
                    filter: brightness(1.15);
                    transform: translateY(-1px);
                }
                .char-create-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                @media (max-width: 640px) {
                    .char-create-body { grid-template-columns: 1fr; }
                    .char-class-section { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
                }
            `}</style>
        </div>
    );
};
