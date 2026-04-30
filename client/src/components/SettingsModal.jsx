import { useState } from 'react';

export const SettingsModal = ({ settings, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = useState(settings || {
        showChatBubbles: true,
        showOtherPlayers: true,
        enableMusic: false
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
            <div className="auth-card settings-card">
                <h2>Configuración</h2>
                
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Burbujas de Chat</span>
                            <span className="setting-desc">Muestra mensajes sobre los jugadores</span>
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

                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Mostrar Jugadores</span>
                            <span className="setting-desc">Ver a otros usuarios en el mapa</span>
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

                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Música de Fondo</span>
                            <span className="setting-desc">Activa la música del mundo</span>
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
                </div>

                <div className="settings-actions">
                    <button className="primary-btn" onClick={handleSave}>Guardar Cambios</button>
                    <button className="secondary-btn" onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};
