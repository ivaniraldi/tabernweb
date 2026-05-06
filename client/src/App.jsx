import { useState, useEffect, useRef } from 'react';
import { Home } from 'lucide-react';
import { Auth } from './components/Auth';
import { PhaserGame } from './components/PhaserGame';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import { InventoryModal } from './components/InventoryModal';
import { ShopModal } from './components/ShopModal';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileModal } from './components/ProfileModal';
import { useSocket } from './hooks/useSocket';
import { EventBus } from './game/EventBus';
import { HUD } from './components/HUD';
import { PlayerContextMenu } from './components/PlayerContextMenu';
import { ChestModal } from './components/ChestModal';
import { DoorModal } from './components/DoorModal';
import { TradeModal } from './components/TradeModal';
import { SocialModal } from './components/SocialModal';
import { SlotModal } from './components/SlotModal';
import { GatheringModal } from './components/GatheringModal';
import { GatheringConfirmModal } from './components/GatheringConfirmModal';
import { showAlert, showConfirm, closeAllModals } from './lib/swalConfig';


import './App.css';


const IS_DEV = import.meta.env.DEV;
const BACKEND_URL = IS_DEV ? 'http://localhost:3000' : 'https://tabernweb-tpq1.onrender.com';
const WS_URL = IS_DEV ? 'ws://localhost:3000' : 'wss://tabernweb-tpq1.onrender.com';

const MAP_SPAWNS = {
    'map1': { x: 100, y: 150 },
    'map2': { x: 250, y: 150 }
};

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    const socketUrl = (user && user.player) ? WS_URL : null;
    const { isConnected, sendMessage } = useSocket(socketUrl);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isGameReady, setIsGameReady] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [profileTargetId, setProfileTargetId] = useState(null);
    const [isSocialOpen, setIsSocialOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
    const [isHudMinimized, setIsHudMinimized] = useState(true);
    const [contextMenu, setContextMenu] = useState(null); 
    const [isTradeOpen, setIsTradeOpen] = useState(false);
    const [tradeData, setTradeData] = useState(null); // { otherId, otherPlayerName, otherOffers: { gold, items, confirmed }, meConfirmed, myOffer: { gold, items } }
    const [chestData, setChestData] = useState(null);
    const [isSlotsOpen, setIsSlotsOpen] = useState(false);


    const [doorData, setDoorData] = useState(null);
    const [gatheringData, setGatheringData] = useState(null); // { itemName, sessionAmount }
    const [gatheringConfirmData, setGatheringConfirmData] = useState(null); // { itemName }
    const [settings, setSettings] = useState({
        showChatBubbles: true,
        showOtherPlayers: true,
        enableMusic: false,
        zoom: 0,
        showHitboxes: false
    });

    const phaserRef = useRef(null);

    // Estado de carga
    const [loadingStatus, setLoadingStatus] = useState('Iniciando');
    const [currentMapId, setCurrentMapId] = useState('map1');
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [minLoadingDone, setMinLoadingDone] = useState(false);

    const isAnyModalOpen = isSettingsOpen || isInventoryOpen || isShopOpen || profileTargetId || isSocialOpen || chestData || doorData || isSlotsOpen || gatheringData || gatheringConfirmData || isTradeOpen;
    const showLoading = user && (!isConnected || !isGameReady || !minLoadingDone);

    // Sincronizar el mapa inicial desde el personaje seleccionado
    useEffect(() => {
        if (user?.player?.mapId) {
            setCurrentMapId(user.player.mapId);
        }
    }, [user?.player?.id]); // Solo cuando cambia el personaje activo

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                setMinLoadingDone(true);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setMinLoadingDone(false);
        }
    }, [user]);

    const fetchSocialData = async () => {
        if (!user) return;
        try {
            const friendsRes = await fetch(`${BACKEND_URL}/api/social/friends/${user.id}`);
            if (friendsRes.ok) setFriends(await friendsRes.json());
            
            const requestsRes = await fetch(`${BACKEND_URL}/api/social/requests/${user.id}`);
            if (requestsRes.ok) setRequests(await requestsRes.json());
        } catch (err) {
            console.error("Error fetching social data:", err);
        }
    };

    useEffect(() => {
        if (user?.player?.mapId) {
            setCurrentMapId(user.player.mapId);
        }
        if (user) {
            fetchSocialData();
            const interval = setInterval(fetchSocialData, 10000); // Polling cada 10s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleServerMessage = (data) => {
            if (data.type === 'trade_request') {
                showConfirm(
                    'Petición de Comercio',
                    `${data.senderName} quiere comerciar contigo.`,
                    () => {
                        sendMessage({ type: 'trade_response', senderId: data.senderId, accepted: true });
                    },
                    () => {
                        sendMessage({ type: 'trade_response', senderId: data.senderId, accepted: false });
                    }
                );
            }

            if (data.type === 'trade_start') {
                closeAllModals();
                setIsTradeOpen(true);
                const otherId = data.participants.find(id => id !== user.id);
                setTradeData({ 
                    otherId, 
                    otherPlayerName: 'Jugador',
                    otherOffers: { gold: 0, items: [], locked: false, confirmed: false },
                    myOffer: { gold: 0, items: [] },
                    meLocked: false,
                    meConfirmed: false,
                    chatMessages: []
                });
            }

            if (data.type === 'trade_updated') {
                setTradeData(prev => ({
                    ...prev,
                    otherOffers: { 
                        ...prev.otherOffers, 
                        gold: data.offers[prev.otherId].gold, 
                        items: data.offers[prev.otherId].items, 
                        locked: false,
                        confirmed: false 
                    },
                    meLocked: false,
                    meConfirmed: false
                }));
            }

            if (data.type === 'trade_locked') {
                setTradeData(prev => ({
                    ...prev,
                    otherOffers: { ...prev.otherOffers, locked: data.offers[prev.otherId].locked },
                    meLocked: data.offers[user.id].locked
                }));
            }

            if (data.type === 'trade_confirmed') {
                setTradeData(prev => ({
                    ...prev,
                    otherOffers: { ...prev.otherOffers, confirmed: data.offers[prev.otherId].confirmed },
                    meConfirmed: data.offers[user.id].confirmed
                }));
            }

            if (data.type === 'trade_complete') {
                setUser({ ...user, player: data.player });
                setIsTradeOpen(false);
                setTradeData(null);
                showAlert("Trato Hecho", "El intercambio se ha realizado con éxito.", 'success');
            }

            if (data.type === 'trade_cancelled') {
                setIsTradeOpen(false);
                setTradeData(null);
                showAlert("Comercio Cancelado", "El otro jugador ha cancelado el trato.");
            }

            if (data.type === 'trade_rejected') {
                closeAllModals();
                showAlert("Comercio Rechazado", `${data.targetName} ha rechazado tu oferta.`);
            }

            if (data.type === 'trade_error') {
                showAlert("Error en Comercio", data.message, 'error');
            }

            if (data.type === 'trade_chat') {
                setTradeData(prev => ({
                    ...prev,
                    chatMessages: [...prev.chatMessages, { sender: 'other', text: data.message }]
                }));
            }

            if (data.type === 'equipment_updated') {
                setUser(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        equipment: data.equipment
                    }
                }));
            }

            if (data.type === 'item_used') {
                setUser(prev => ({ ...prev, player: data.player }));
                showAlert("Objeto Usado", data.message, "success");
            }
        };

        EventBus.on('server_message', handleServerMessage);
        return () => EventBus.off('server_message', handleServerMessage);
    }, [user, sendMessage]);

    useEffect(() => {
        const handleMapChanged = ({ mapId, pos }) => {
            setCurrentMapId(mapId);
            setPos(pos); // Update HUD position immediately
            if (isConnected) {
                sendMessage({ 
                    type: 'change_map', 
                    mapId: mapId,
                    x: pos.x,
                    y: pos.y
                });
            }
        };
        EventBus.on('map-changed', handleMapChanged);
        return () => EventBus.off('map-changed', handleMapChanged);
    }, [isConnected, sendMessage]);

    useEffect(() => {
        const handleOpenChest = (data) => setChestData(data);
        const handleOpenDoor = (data) => setDoorData(data);
        const handleOpenShop = () => setIsShopOpen(true);
        
        EventBus.on('open-chest', handleOpenChest);
        EventBus.on('open-door', handleOpenDoor);
        EventBus.on('open-shop', handleOpenShop);
        EventBus.on('open-slots', () => setIsSlotsOpen(true));
        EventBus.on('player-data-updated', (playerData) => {
            setUser(prev => ({ ...prev, player: playerData }));
        });
        EventBus.on('start-gathering', (data) => setGatheringData({ ...data, sessionAmount: 0 }));
        EventBus.on('update-gathering-session', (amount) => {
            setGatheringData(prev => prev ? { ...prev, sessionAmount: amount } : null);
        });
        EventBus.on('stop-gathering', () => setGatheringData(null));
        EventBus.on('open-gathering-confirm', (data) => setGatheringConfirmData(data));
        
        return () => {
            EventBus.off('open-chest', handleOpenChest);
            EventBus.off('open-door', handleOpenDoor);
            EventBus.off('open-shop', handleOpenShop);
            EventBus.off('open-slots');
            EventBus.off('player-data-updated');
            EventBus.off('start-gathering');
            EventBus.off('update-gathering-session');
            EventBus.off('stop-gathering');
            EventBus.off('open-gathering-confirm');
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.key) return;
            // Bloquear si hay un input enfocado
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

            if (e.key.toLowerCase() === 'i') {
                if (isAnyModalOpen && !isInventoryOpen) return;
                setIsInventoryOpen(prev => !prev);
            }
            if (e.key.toLowerCase() === 'p') {
                if (isAnyModalOpen && !profileTargetId) return;
                if (user && user.player) {
                    setProfileTargetId(prev => prev ? null : user.player.id);
                }
            }
            if (e.key.toLowerCase() === 'o') {
                if (isAnyModalOpen && !isSocialOpen) return;
                setIsSocialOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [user, isAnyModalOpen, isInventoryOpen, profileTargetId, isSocialOpen]); // Añadir dependencias para evitar cierres obsoletos

    useEffect(() => {
        const handleShowMenu = (data) => {
            setContextMenu(data);
        };
        EventBus.on('show-player-menu', handleShowMenu);
        return () => EventBus.off('show-player-menu', handleShowMenu);
    }, []);

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
            setLoadingStatus('Estableciendo conexión');
        };
        EventBus.on('current-scene-ready', handleGameReady);
        return () => EventBus.off('current-scene-ready', handleGameReady);
    }, []);

    useEffect(() => {
        if (user && !isGameReady) {
            setLoadingStatus('Cargando recursos del mapa');
        }
    }, [user, isGameReady]);

    const hasLoggedIn = useRef(false);

    useEffect(() => {
        if (isConnected && user && isGameReady && !hasLoggedIn.current) {
            setLoadingStatus('Finalizando');
            sendMessage({ 
                type: 'login', 
                playerId: user.player.id,
                mapId: user.player.mapId || currentMapId 
            });
            setPos({ x: user.player.x, y: user.player.y });
            hasLoggedIn.current = true;
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

    useEffect(() => {
        if (isGameReady) {
            EventBus.emit('chat-focus', isAnyModalOpen || showLoading);
        }
    }, [isAnyModalOpen, showLoading, isGameReady]);

    useEffect(() => {
        if (isGameReady) {
            EventBus.emit('settings-changed', settings);
        }
    }, [settings, isGameReady]);

    const handleAuthSuccess = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    const claimChest = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/game/chest/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, playerId: user.player.id })
            });
            const data = await res.json();

            if (!res.ok) {
                // Mostrar el mensaje de cooldown en el modal
                setChestData(prev => ({ ...prev, cooldownMessage: data.message }));
                return;
            }

            setUser({ ...user, player: data.player });
            setChestData(null);
        } catch (err) {
            console.error('Error claiming chest:', err);
        }
    };

    const handleBuyItems = async (cartItems) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/game/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: user.player.id, items: cartItems })
            });
            
            const data = await res.json();
            if (res.ok) {
                setUser({ ...user, player: data.player });
            } else {
                showAlert("Error de Compra", data.error || "Error al comprar", 'error');
            }
        } catch (err) {
            console.error("Error buying item:", err);
        }
    };

    const handleSellItems = async (cartItems) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/game/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: user.player.id, items: cartItems })
            });
            
            const data = await res.json();
            if (res.ok) {
                setUser({ ...user, player: data.player });
            } else {
                showAlert("Error de Venta", data.error || "Error al vender", 'error');
            }
        } catch (err) {
            console.error("Error selling item:", err);
        }
    };

    const handleEquip = (inventoryItemId) => {
        sendMessage({ type: 'equip_item', inventoryItemId });
    };

    const handleUnequip = (slot) => {
        sendMessage({ type: 'unequip_item', slot });
    };

    const handleUseItem = (inventoryItemId) => {
        const invItem = user.player.inventoryItems.find(i => i.id === inventoryItemId);
        const itemName = invItem ? invItem.item.name : "este objeto";

        showConfirm(
            "Usar Objeto",
            `¿Estás seguro de que quieres usar ${itemName}?`,
            () => {
                sendMessage({ type: 'use_item', inventoryItemId });
            }
        );
    };

    const handleUpgradeStat = async (statName) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/game/upgrade-stat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: user.player.id, statName })
            });
            
            const data = await res.json();
            if (res.ok) {
                setUser({ ...user, player: data.player });
            } else {
                showAlert("Error", data.error || "Error al mejorar stat", 'error');
            }
        } catch (err) {
            console.error("Error upgrading stat:", err);
        }
    };

    const handleAddFriend = async (targetUsername) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/social/friends/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, friendUsername: targetUsername })
            });
            const data = await res.json();
            
            // Pequeño delay para asegurar que el modal anterior (si existe) se haya cerrado
            setTimeout(() => {
                if (res.ok) {
                    showAlert("Éxito", `Solicitud enviada a ${targetUsername}`, 'success');
                    fetchSocialData(); // Actualizar inmediatamente
                } else {
                    showAlert("Aviso", data.error || "Error al enviar solicitud", 'warning');
                }
            }, 100);
        } catch (err) {
            console.error("Error adding friend:", err);
            setTimeout(() => {
                showAlert("Error", "Error de conexión", 'error');
            }, 100);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/social/friends/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, friendId })
            });
            if (res.ok) {
                showAlert("Éxito", "Amigo eliminado", 'success');
                fetchSocialData();
            }
        } catch (err) {
            console.error("Error removing friend:", err);
        }
    };

    const handleSendMessageToPlayer = (targetUsername) => {
        setProfileTargetId(null); // Cerrar perfil
        setTimeout(() => {
            EventBus.emit('chat-prefill', `/msg ${targetUsername} `);
        }, 100);
    };

    const handleTradeRequest = (targetId) => {
        sendMessage({ type: 'trade_request', targetId });
        showAlert("Petición Enviada", "Esperando respuesta del otro jugador...");
    };

    const handleUpdateTrade = (gold, items) => {
        setTradeData(prev => ({
            ...prev,
            myOffer: { gold, items },
            meLocked: false,
            meConfirmed: false
        }));
        sendMessage({ type: 'trade_update', gold, items });
    };

    const handleLockTrade = () => {
        sendMessage({ type: 'trade_lock' });
    };

    const handleConfirmTrade = () => {
        sendMessage({ type: 'trade_confirm' });
    };

    const handleSendTradeChat = (message) => {
        setTradeData(prev => ({
            ...prev,
            chatMessages: [...prev.chatMessages, { sender: 'me', text: message }]
        }));
        sendMessage({ type: 'trade_chat', message });
    };

    const handleCancelTrade = () => {
        sendMessage({ type: 'trade_cancel' });
        setIsTradeOpen(false);
        setTradeData(null);
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
            {(!user || !user.player) ? (
                <Auth onAuthSuccess={handleAuthSuccess} backendUrl={BACKEND_URL} />
            ) : (
                <>
                    {isTradeOpen && tradeData && (
                        <TradeModal
                            myPlayer={user.player}
                            otherPlayerName={tradeData.otherPlayerName}
                            otherOffers={tradeData.otherOffers}
                            myOffer={tradeData.myOffer}
                            meLocked={tradeData.meLocked}
                            meConfirmed={tradeData.meConfirmed}
                            chatMessages={tradeData.chatMessages}
                            onUpdate={handleUpdateTrade}
                            onLock={handleLockTrade}
                            onConfirm={handleConfirmTrade}
                            onChat={handleSendTradeChat}
                            onCancel={handleCancelTrade}
                        />
                    )}

                    {isSocialOpen && (
                        <SocialModal
                            userId={user.id}
                            BACKEND_URL={BACKEND_URL}
                            onClose={() => setIsSocialOpen(false)}
                            initialFriends={friends}
                            initialRequests={requests}
                            onRefresh={fetchSocialData}
                        />
                    )}
                    {showLoading && <LoadingScreen status={loadingStatus} />}
                    
                    <PhaserGame userData={user} ref={phaserRef} />
                    
                    {!showLoading && (
                        <>
                            <HUD
                                user={user}
                                mapId={currentMapId}
                                pos={pos}
                                isMinimized={isHudMinimized}
                                onToggleMinimize={() => setIsHudMinimized(!isHudMinimized)}
                                onOpenSettings={() => { if (!isAnyModalOpen) setIsSettingsOpen(true); }}
                                onOpenInventory={() => { if (!isAnyModalOpen) setIsInventoryOpen(true); }}
                                onOpenProfile={() => { if (!isAnyModalOpen) setProfileTargetId(user.player.id); }}
                                onOpenSocial={() => { if (!isAnyModalOpen) { console.log("Opening Social Modal"); setIsSocialOpen(true); } }}
                            />
                            <Chat
                                onSendMessage={sendMessage}
                                myPlayerId={user.player.id}
                                disabled={isAnyModalOpen}
                                isVisible={isChatVisible}
                                onToggle={setIsChatVisible}
                            />

                            {currentMapId === 'map2' && (
                                <button 
                                    className={`return-tavern-btn ${isChatVisible ? 'chat-open' : ''}`}
                                    onClick={() => EventBus.emit('change-map', 'map1', MAP_SPAWNS['map1'])}
                                    title="Volver a la Taberna"
                                >
                                    <Home size={24} />
                                </button>
                            )}

                            {contextMenu && (
                                <PlayerContextMenu
                                    data={contextMenu}
                                    onClose={() => setContextMenu(null)}
                                    phaserRef={phaserRef}
                                    userId={user.id}
                                    BACKEND_URL={BACKEND_URL}
                                    onAddFriend={handleAddFriend}
                                    onTrade={handleTradeRequest}
                                    onViewProfile={(targetId) => setProfileTargetId(targetId)}
                                    friends={friends}
                                    requests={requests}
                                />
                            )}

                            {chestData && (
                                <ChestModal 
                                    onClaim={claimChest}
                                    onClose={() => setChestData(null)}
                                    cooldownMessage={chestData.cooldownMessage}
                                />
                            )}

                            {doorData && (
                                <DoorModal 
                                    onConfirm={() => { 
                                        EventBus.emit('change-map', 'map2', MAP_SPAWNS['map2']);
                                        setDoorData(null); 
                                    }}
                                    onClose={() => setDoorData(null)}
                                />
                            )}

                            {isSettingsOpen && (
                                <SettingsModal
                                    settings={settings}
                                    onSave={saveSettings}
                                    onClose={() => setIsSettingsOpen(false)}
                                    userRole={user.role}
                                />
                            )}

                            {isInventoryOpen && (
                                <InventoryModal
                                    inventoryItems={user.player.inventoryItems}
                                    equipment={user.player.equipment}
                                    onEquip={handleEquip}
                                    onUnequip={handleUnequip}
                                    onUse={handleUseItem}
                                    onClose={() => setIsInventoryOpen(false)}
                                />
                            )}

                            {isShopOpen && (
                                <ShopModal
                                    gold={user.player.gold}
                                    inventoryItems={user.player.inventoryItems}
                                    onBuy={handleBuyItems}
                                    onSell={handleSellItems}
                                    onClose={() => setIsShopOpen(false)}
                                    backendUrl={BACKEND_URL}
                                />
                            )}
                            {isSlotsOpen && (
                                <SlotModal 
                                    user={user}
                                    setUser={setUser}
                                    backendUrl={BACKEND_URL}
                                    onClose={() => setIsSlotsOpen(false)} 
                                />
                            )}
                            {profileTargetId && (
                                <ProfileModal
                                    user={user}
                                    targetId={profileTargetId}
                                    friends={friends}
                                    backendUrl={BACKEND_URL}
                                    onUpgradeStat={handleUpgradeStat}
                                    onAddFriend={handleAddFriend}
                                    onRemoveFriend={handleRemoveFriend}
                                    onSendMessage={handleSendMessageToPlayer}
                                    onTrade={handleTradeRequest}
                                    onClose={() => setProfileTargetId(null)}
                                />
                            )}
                            {gatheringData && (
                                <GatheringModal 
                                    itemName={gatheringData.itemName}
                                    sessionAmount={gatheringData.sessionAmount}
                                    gatherSpeed={gatheringData.gatherSpeed}
                                    currentAmount={user.player.inventoryItems.find(i => i.item.name === gatheringData.itemName)?.quantity || 0}
                                    onClose={() => EventBus.emit('stop-gathering-from-ui')}
                                />
                            )}
                            {gatheringConfirmData && (
                                <GatheringConfirmModal 
                                    itemName={gatheringConfirmData.itemName}
                                    onConfirm={() => {
                                        EventBus.emit('confirm-gathering');
                                        setGatheringConfirmData(null);
                                    }}
                                    onClose={() => setGatheringConfirmData(null)}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
