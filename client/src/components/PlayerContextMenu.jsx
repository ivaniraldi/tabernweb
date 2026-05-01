import { useState, useEffect } from 'react';
import { showConfirm } from '../lib/swalConfig';
import { EventBus } from '../game/EventBus';


export const PlayerContextMenu = ({ data, onClose, phaserRef, onAddFriend, onTrade, onViewProfile, friends = [], requests = { incoming: [], outgoing: [] } }) => {
    
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

    const isAlreadyFriend = friends.some(f => f.username === data.username);
    
    // Verificar si ya existe una solicitud pendiente (enviada o recibida)
    const hasPendingOutgoing = (requests.outgoing || []).some(r => r.toUsername === data.username);
    const hasPendingIncoming = (requests.incoming || []).some(r => r.fromUsername === data.username);
    const isPending = hasPendingOutgoing || hasPendingIncoming;

    const handleFriendRequest = () => {
        onClose();
        showConfirm(
            'Nueva Amistad',
            `¿Deseas enviar una solicitud de amistad a ${data.username}?`,
            () => {
                onAddFriend(data.username);
            }
        );
    };

    return (
        <div
            className="player-context-menu"
            style={{ left: pos.x, top: pos.y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="menu-header">Opciones: {data.username}</div>
            <div className="menu-options">
                <button onClick={() => { onViewProfile(data.playerId); onClose(); }}>Ver Perfil</button>
                <button onClick={() => { onTrade(data.playerId); onClose(); }}>Comerciar</button>
                <button onClick={() => { 
                    EventBus.emit('chat-prefill', `/msg ${data.username} `); 
                    onClose(); 
                }}>Mensaje</button>
                
                {!isAlreadyFriend && !isPending && (
                    <button onClick={handleFriendRequest} className="add-friend-option">Añadir Amigo</button>
                )}
                
                {isPending && (
                    <button className="add-friend-option disabled-opt" disabled title="Ya hay una solicitud en curso">
                        Pendiente...
                    </button>
                )}

                {isAlreadyFriend && (
                    <button className="add-friend-option disabled-opt" disabled>
                        Ya son amigos
                    </button>
                )}
            </div>
            
            <style>{`
                .disabled-opt {
                    opacity: 0.5;
                    cursor: not-allowed !important;
                    color: #64748b !important;
                }
            `}</style>
        </div>
    );
};
