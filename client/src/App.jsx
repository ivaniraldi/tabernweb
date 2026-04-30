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

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const { isConnected, sendMessage } = useSocket(user ? `ws://${window.location.hostname}:3000` : null);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isGameReady, setIsGameReady] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isHudMinimized, setIsHudMinimized] = useState(false);
    const [settings, setSettings] = useState({
        showChatBubbles: true,
        showOtherPlayers: true,
        enableMusic: false
    });
    const phaserRef = useRef(null);

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
            await fetch(`/api/game/player/${user.player.id}`, {
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
                <Auth onAuthSuccess={handleAuthSuccess} />
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
