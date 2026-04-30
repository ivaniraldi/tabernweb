import { useState, useEffect, useRef } from 'react';
import { Auth } from './components/Auth';
import { PhaserGame } from './components/PhaserGame';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import { InventoryModal } from './components/InventoryModal';
import { useSocket } from './hooks/useSocket';
import { EventBus } from './game/EventBus';
import {
    Coins,
    Gem,
    Zap,
    Settings,
    Package,
    MapPin,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://tabernweb-tpq1.onrender.com';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://tabernweb-tpq1.onrender.com';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Conexión dinámica: usa Render por defecto, pero permite localhost para pruebas locales si es necesario
    const socketUrl = user ? (window.location.hostname === 'localhost' ? `ws://localhost:3000` : WS_URL) : null;
    const { isConnected, sendMessage } = useSocket(socketUrl);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isGameReady, setIsGameReady] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isHudMinimized, setIsHudMinimized] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { x, y, playerId, username }
    const [settings, setSettings] = useState({
        showChatBubbles: true,
        showOtherPlayers: true,
        enableMusic: false
    });
    const phaserRef = useRef(null);

    useEffect(() => {
        const handleShowMenu = (data) => {
            setContextMenu(data);
        };
        EventBus.on('show-player-menu', handleShowMenu);
        return () => EventBus.off('show-player-menu', handleShowMenu);
    }, []);

    // Close menu on click elsewhere
    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        if (contextMenu) {
            window.addEventListener('click', closeMenu);
            return () => window.removeEventListener('click', closeMenu);
        }
    }, [contextMenu]);

    useEffect(() => {
        if (user?.player?.settings) {
            setSettings(user.player.settings);
        }
    }, [user]);

    useEffect(() => {
        const handleGameReady = () => {
            setIsGameReady(true);
        };
        EventBus.on('current-scene-ready', handleGameReady);
        return () => EventBus.off('current-scene-ready', handleGameReady);
    }, []);

    useEffect(() => {
        if (isConnected && user && isGameReady) {
            console.log('Sending login to server...');
            sendMessage({ type: 'login', playerId: user.player.id });
            setPos({ x: user.player.x, y: user.player.y });
        }
    }, [isConnected, user, isGameReady]);

    useEffect(() => {
        const handlePlayerMove = (data) => {
            sendMessage({ type: 'move', ...data });
            setPos(data);
        };

        EventBus.on('player_move', handlePlayerMove);
        return () => {
            EventBus.off('player_move', handlePlayerMove);
        };
    }, [sendMessage]);

    const isAnyModalOpen = isSettingsOpen || isInventoryOpen;

    useEffect(() => {
        if (isGameReady) {
            EventBus.emit('chat-focus', isAnyModalOpen);
        }
    }, [isAnyModalOpen, isGameReady]);

    // Send settings updates to Phaser and Backend
    useEffect(() => {
        if (isGameReady) {
            EventBus.emit('settings-changed', settings);
        }
    }, [settings, isGameReady]);

    const handleAuthSuccess = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    const saveSettings = async (newSettings) => {
        setSettings(newSettings);
        try {
            await fetch(`${BACKEND_URL}/api/game/player/${user.player.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: newSettings })
            });
        } catch (err) {
            console.error('Error saving settings:', err);
        }
    };

    return (
        <div className="app-container">
            {!user ? (
                <Auth onAuthSuccess={handleAuthSuccess} backendUrl={BACKEND_URL} />
            ) : (
                <>
                    <PhaserGame userData={user} ref={phaserRef} />
                    <HUD
                        user={user}
                        pos={pos}
                        isMinimized={isHudMinimized}
                        onToggleMinimize={() => setIsHudMinimized(!isHudMinimized)}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenInventory={() => setIsInventoryOpen(true)}
                    />
                    <Chat
                        onSendMessage={sendMessage}
                        myPlayerId={user.player.id}
                        disabled={isAnyModalOpen}
                    />

                    {contextMenu && (
                        <PlayerContextMenu 
                            data={contextMenu} 
                            onClose={() => setContextMenu(null)} 
                            phaserRef={phaserRef}
                        />
                    )}
                    
                    {isSettingsOpen && (
                        <SettingsModal
                            settings={settings}
                            onSave={saveSettings}
                            onClose={() => setIsSettingsOpen(false)}
                        />
                    )}

                    {isInventoryOpen && (
                        <InventoryModal
                            onClose={() => setIsInventoryOpen(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
}

const PlayerContextMenu = ({ data, onClose, phaserRef }) => {
    const [pos, setPos] = useState({ x: data.x, y: data.y });

    useEffect(() => {
        let frame;
        const updatePos = () => {
            if (phaserRef.current) {
                const scene = phaserRef.current.game.scene.getScene('MainScene');
                if (scene) {
                    const screenPos = scene.getPlayerScreenPos(data.playerId);
                    if (!screenPos || screenPos.outOfBounds) {
                        onClose();
                        return;
                    }
                    // Ajustamos el menú para que aparezca a la derecha y un poco arriba del centro del jugador
                    setPos({ x: screenPos.x + 30, y: screenPos.y - 40 });
                }
            }
            frame = requestAnimationFrame(updatePos);
        };
        updatePos();
        return () => cancelAnimationFrame(frame);
    }, [data.playerId, onClose, phaserRef]);

    return (
        <div 
            className="player-context-menu"
            style={{ left: pos.x, top: pos.y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="menu-header">Opciones: {data.username}</div>
            <div className="menu-options">
                <button onClick={() => { console.log("Perfil", data.playerId); onClose(); }}>Ver Perfil</button>
                <button onClick={() => { console.log("Comerciar", data.playerId); onClose(); }}>Comerciar</button>
                <button onClick={() => { console.log("Mensaje", data.playerId); onClose(); }}>Mensaje</button>
                <button onClick={() => { console.log("Amigos", data.playerId); onClose(); }}>Amigos</button>
            </div>
        </div>
    );
};

const HUD = ({ user, pos, isMinimized, onToggleMinimize, onOpenSettings, onOpenInventory }) => (
    <div className="hud">
        <div className={`player-stats ${isMinimized ? 'minimized' : ''}`}>
            <div className="hud-header">
                <span className="name">{user.username}</span>
                <div className="hud-actions">
                    <button className="icon-btn" onClick={onToggleMinimize} title={isMinimized ? "Expandir" : "Minimizar"}>
                        {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                    {!isMinimized && (
                        <>
                            <button className="icon-btn" onClick={onOpenInventory} title="Inventario">
                                <Package size={18} />
                            </button>
                            <button className="icon-btn" onClick={onOpenSettings} title="Ajustes">
                                <Settings size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-box">
                    <div className="stat-label-group">
                        <Coins size={14} className="gold-val" />
                        <span className="stat-label">Oro</span>
                    </div>
                    <span className="stat-value gold-val">{user.player.gold}</span>
                </div>

                {!isMinimized && (
                    <div className="stat-box">
                        <div className="stat-label-group">
                            <Gem size={14} className="diamond-val" />
                            <span className="stat-label">Diamantes</span>
                        </div>
                        <span className="stat-value diamond-val">{user.player.diamonds}</span>
                    </div>
                )}

                <div className="stat-box">
                    <div className="stat-label-group">
                        <Zap size={14} className="exp-val" />
                        <span className="stat-label">Experiencia</span>
                    </div>
                    <span className="stat-value exp-val">{user.player.experience} XP</span>
                </div>
            </div>

            {!isMinimized && (
                <div className="pos-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {Math.round(pos.x)}, {Math.round(pos.y)}
                    </span>
                    <span style={{ opacity: 0.5 }}>FPS: 60</span>
                </div>
            )}
        </div>
    </div>
);

export default App;
