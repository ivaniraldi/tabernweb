import { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, X, Circle, Check, Trash2, Send, AlertCircle, Info } from 'lucide-react';
import { showAlert as swalAlert, showConfirm as swalConfirm } from '../lib/swalConfig';


export const SocialModal = ({ userId, onClose, BACKEND_URL, initialFriends = [], initialRequests = { incoming: [], outgoing: [] }, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('friends');
    const [newFriendUsername, setNewFriendUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Usar los datos que vienen del padre para sincronización global
    const friends = initialFriends;
    const requests = initialRequests;

    // Modal Notifications using SweetAlert2
    const showAlert = (title, message) => swalAlert(title, message);
    const showConfirm = (title, message, onConfirm) => swalConfirm(title, message, onConfirm);

    const handleAddFriend = async (e) => {
        if (e) e.preventDefault();
        if (!newFriendUsername.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${BACKEND_URL}/api/social/friends/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, friendUsername: newFriendUsername })
            });
            const data = await res.json();
            if (res.ok) {
                setNewFriendUsername('');
                showAlert("Éxito", `¡Solicitud de amistad enviada a ${newFriendUsername}!`);
                onRefresh(); // Actualizar datos globales
            } else {
                setError(data.error || "Error al enviar solicitud");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId, action) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/social/friends/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action })
            });
            const data = await res.json();
            if (res.ok) {
                onRefresh();
            } else {
                showAlert("Aviso", data.error || "La solicitud ya no está disponible");
                onRefresh();
            }
        } catch (err) {
            console.error("Error responding:", err);
            showAlert("Error", "Error de conexión con el servidor");
        }
    };

    const handleRemoveFriend = (friendId, friendName) => {
        showConfirm(
            "Eliminar Amigo", 
            `¿Estás seguro de que quieres eliminar a ${friendName} de tu lista de amigos?`,
            async () => {
                try {
                    const res = await fetch(`${BACKEND_URL}/api/social/friends/remove`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, friendId })
                    });
                    if (res.ok) onRefresh();
                } catch (err) {
                    console.error("Error removing friend:", err);
                }
            }
        );
    };

    const totalRequests = (requests.incoming?.length || 0) + (requests.outgoing?.length || 0);

    return (
        <div className="auth-overlay">
            <div className="auth-card rpg-shop social-modal-rpg">
                <div className="rpg-header">
                    <div className="rpg-title">
                        <h2>Lista de Amigos</h2>
                        <span className="rpg-subtitle">Gestiona tus contactos y solicitudes</span>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="rpg-tabs">
                    <button 
                        className={`rpg-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        Mis Amigos ({friends.length})
                    </button>
                    <button 
                        className={`rpg-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Solicitudes {totalRequests > 0 && <span className="rpg-badge-count">{totalRequests}</span>}
                    </button>
                </div>

                <div className="rpg-body social-body">
                    {activeTab === 'friends' ? (
                        <>
                            <form className="rpg-add-form" onSubmit={handleAddFriend}>
                                <input 
                                    type="text" 
                                    placeholder="Nombre del jugador..." 
                                    value={newFriendUsername}
                                    onChange={(e) => setNewFriendUsername(e.target.value)}
                                    className="rpg-input"
                                />
                                <button type="submit" disabled={loading} className="rpg-add-btn">
                                    <UserPlus size={18} />
                                </button>
                            </form>
                            {error && <div className="rpg-error-msg">{error}</div>}

                            <div className="rpg-list scrollable">
                                {friends.length === 0 ? (
                                    <div className="rpg-empty-state">No tienes amigos agregados aún.</div>
                                ) : (
                                    friends.map(friend => (
                                        <div key={friend.id} className="rpg-item-card friend-item">
                                            <div className="friend-meta">
                                                <div className="status-container">
                                                    <Circle 
                                                        size={10} 
                                                        fill={friend.isOnline ? "#10b981" : "#475569"} 
                                                        color="transparent" 
                                                    />
                                                </div>
                                                <div className="friend-details">
                                                    <span className="rpg-item-name">{friend.username}</span>
                                                    <span className={`status-text ${friend.isOnline ? 'online' : 'offline'}`}>
                                                        {friend.isOnline ? 'En línea' : 'Desconectado'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="rpg-action-btn delete" onClick={() => handleRemoveFriend(friend.id, friend.username)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rpg-list scrollable">
                            {/* Recibidas */}
                            <div className="request-section-title">Recibidas ({requests.incoming?.length || 0})</div>
                            {requests.incoming?.length === 0 ? (
                                <div className="rpg-empty-state mini">No hay solicitudes entrantes.</div>
                            ) : (
                                (requests.incoming || []).map(req => (
                                    <div key={req.id} className="rpg-item-card request-item">
                                        <div className="request-meta">
                                            <span className="rpg-item-name">{req.fromUsername}</span>
                                            <span className="rpg-item-type">te envió una solicitud</span>
                                        </div>
                                        <div className="rpg-item-actions">
                                            <button className="rpg-btn-icon accept" onClick={() => handleRespond(req.id, 'ACCEPT')} title="Aceptar">
                                                <Check size={16} />
                                            </button>
                                            <button className="rpg-btn-icon reject" onClick={() => handleRespond(req.id, 'REJECT')} title="Rechazar">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Enviadas */}
                            <div className="request-section-title" style={{ marginTop: '20px' }}>Enviadas ({requests.outgoing?.length || 0})</div>
                            {requests.outgoing?.length === 0 ? (
                                <div className="rpg-empty-state mini">No has enviado solicitudes.</div>
                            ) : (
                                (requests.outgoing || []).map(req => (
                                    <div key={req.id} className="rpg-item-card request-item">
                                        <div className="request-meta">
                                            <span className="rpg-item-name">{req.toUsername}</span>
                                            <span className="rpg-item-type">esperando aprobación</span>
                                        </div>
                                        <div className="rpg-item-actions">
                                            <button className="rpg-btn-icon reject" onClick={() => handleRespond(req.id, 'CANCEL')} title="Cancelar Solicitud">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="rpg-footer">
                    <span className="rpg-subtitle">Total: {friends.length} amigos</span>
                    <button className="primary-btn mini" onClick={onClose} style={{ margin: 0, width: 'auto' }}>
                        Cerrar
                    </button>
                </div>
            </div>

            <style>{`
                .social-modal-rpg {
                    max-width: 380px !important;
                    min-height: 500px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .rpg-tabs {
                    display: flex;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .rpg-tab-btn {
                    flex: 1;
                    background: transparent;
                    border: none;
                    padding: 12px;
                    color: #64748b;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .rpg-tab-btn.active {
                    color: #6366f1;
                    background: rgba(99, 102, 241, 0.05);
                }
                .rpg-tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #6366f1;
                }
                .rpg-badge-count {
                    background: #ef4444;
                    color: white;
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    margin-left: 5px;
                    border-radius: 0;
                }
                .social-body {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 16px !important;
                }
                .rpg-add-form {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                .rpg-input {
                    flex: 1;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    color: white;
                    font-size: 0.85rem;
                    border-radius: 0;
                }
                .rpg-add-btn {
                    background: #6366f1;
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rpg-add-btn:hover {
                    background: #4f46e5;
                }
                .rpg-list {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .scrollable {
                    max-height: 340px;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .scrollable::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollable::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.3);
                }
                .request-section-title {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 1px;
                    font-weight: 800;
                    margin-bottom: 4px;
                }
                .friend-item, .request-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 12px !important;
                }
                .friend-meta, .request-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .request-meta {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0px;
                }
                .friend-details {
                    display: flex;
                    flex-direction: column;
                }
                .status-text {
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .status-text.online { color: #10b981; }
                .status-text.offline { color: #64748b; }
                
                .rpg-action-btn {
                    background: transparent;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: 0.2s;
                }
                .rpg-action-btn:hover { opacity: 1; transform: scale(1.1); }

                .rpg-item-actions {
                    display: flex;
                    gap: 6px;
                }
                .rpg-btn-icon {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .rpg-btn-icon.accept { background: #10b981; color: white; }
                .rpg-btn-icon.reject { background: #ef4444; color: white; }
                .rpg-btn-icon:hover { transform: scale(1.1); filter: brightness(1.2); }

                .rpg-empty-state {
                    text-align: center;
                    color: #475569;
                    font-size: 0.85rem;
                    margin: 20px 0;
                    font-style: italic;
                }
                .rpg-empty-state.mini {
                    margin: 10px 0;
                    font-size: 0.75rem;
                }
                .rpg-error-msg {
                    color: #ef4444;
                    font-size: 0.75rem;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};
