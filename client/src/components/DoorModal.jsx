import { DoorOpen } from 'lucide-react';

export const DoorModal = ({ onConfirm, onClose }) => {
    return (
        <div className="auth-overlay">
            <div className="auth-card shop-modal compact">
                <div className="hud-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DoorOpen size={18} />
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Salir</h2>
                    </div>
                    <button className="icon-btn" onClick={onClose}>✕</button>
                </div>
                
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚪</div>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                        ¿Estás seguro de que quieres abandonar la taberna?
                    </p>
                </div>

                <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="primary-btn mini" onClick={onConfirm}>Salir al Mundo</button>
                    <button className="secondary-btn" onClick={onClose} style={{ marginTop: 0 }}>Quedarme</button>
                </div>
            </div>
        </div>
    );
};
