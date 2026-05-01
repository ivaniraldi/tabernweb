import { Gift } from 'lucide-react';

export const ChestModal = ({ onClaim, onClose }) => {
    return (
        <div className="auth-overlay">
            <div className="auth-card shop-modal compact">
                <div className="hud-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Gift size={18} />
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Cofre Diario</h2>
                    </div>
                    <button className="icon-btn" onClick={onClose}>✕</button>
                </div>
                
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎁</div>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '16px' }}>
                        ¡Has encontrado un cofre del tesoro!
                    </p>
                    <div className="shop-gold-display" style={{ justifyContent: 'center', borderLeft: 'none', borderBottom: '2px solid #fbbf24' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>+100 🪙</span>
                    </div>
                </div>

                <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="primary-btn mini" onClick={onClaim}>Reclamar</button>
                    <button className="secondary-btn" onClick={onClose} style={{ marginTop: 0 }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};
