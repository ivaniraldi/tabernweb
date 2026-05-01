import { useState } from 'react';
import { Settings, X, Volume2, Users, MessageSquare, ZoomIn, Terminal } from 'lucide-react';

export const SettingsModal = ({ settings, onSave, onClose, userRole }) => {
    const [localSettings, setLocalSettings] = useState(settings || {
        showChatBubbles: true,
        showOtherPlayers: true,
        enableMusic: false,
        zoom: 0,
        showHitboxes: false
    });

    const handleToggle = (key) => {
        setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="auth-overlay">
            <div className="auth-card rpg-shop">
                <div className="rpg-header">
                    <div className="rpg-title">
                        <h2>Preferencias</h2>
                        <span className="rpg-subtitle">Configuración del Sistema</span>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="rpg-body">
                    <div className="rpg-item-card stat-item">
                        <div className="rpg-item-icon">
                            <MessageSquare size={18} />
                        </div>
                        <div className="rpg-item-info">
                            <span className="rpg-item-name">Burbujas de Chat</span>
                            <span className="rpg-item-type">Visualización de mensajes</span>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={localSettings.showChatBubbles} 
                                onChange={() => handleToggle('showChatBubbles')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="rpg-item-card stat-item">
                        <div className="rpg-item-icon">
                            <Users size={18} />
                        </div>
                        <div className="rpg-item-info">
                            <span className="rpg-item-name">Mostrar Jugadores</span>
                            <span className="rpg-item-type">Ver a otros usuarios</span>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={localSettings.showOtherPlayers} 
                                onChange={() => handleToggle('showOtherPlayers')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="rpg-item-card stat-item">
                        <div className="rpg-item-icon">
                            <Volume2 size={18} />
                        </div>
                        <div className="rpg-item-info">
                            <span className="rpg-item-name">Música de Fondo</span>
                            <span className="rpg-item-type">Audio ambiental</span>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={localSettings.enableMusic} 
                                onChange={() => handleToggle('enableMusic')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="rpg-item-card stat-item vertical-setting">
                        <div className="setting-header-row">
                            <div className="rpg-item-icon">
                                <ZoomIn size={18} />
                            </div>
                            <div className="rpg-item-info">
                                <span className="rpg-item-name">Ajuste de Zoom: {localSettings.zoom > 0 ? '+' : ''}{localSettings.zoom?.toFixed(1)}</span>
                            </div>
                        </div>
                        <input 
                            type="range" 
                            min="-0.5" 
                            max="1" 
                            step="0.5" 
                            value={localSettings.zoom || 0} 
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                            className="zoom-slider"
                            style={{ marginTop: '8px' }}
                        />
                    </div>

                    {userRole === 'dev' && (
                        <div className="rpg-item-card stat-item dev-tools">
                            <div className="rpg-item-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <Terminal size={18} color="#ef4444" />
                            </div>
                            <div className="rpg-item-info">
                                <span className="rpg-item-name" style={{ color: '#ef4444' }}>Modo Debug (Hitboxes)</span>
                                <span className="rpg-item-type">Herramientas de Desarrollador</span>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={localSettings.showHitboxes} 
                                    onChange={() => handleToggle('showHitboxes')}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="rpg-footer">
                    <button className="secondary-btn mini" onClick={onClose} style={{ width: 'auto' }}>Cancelar</button>
                    <button className="primary-btn mini" onClick={handleSave} style={{ width: 'auto' }}>Guardar</button>
                </div>
            </div>

            <style>{`
                .vertical-setting {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 8px !important;
                }
                .setting-header-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                }
            `}</style>
        </div>
    );
};
