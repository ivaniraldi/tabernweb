import { HelpCircle, X } from 'lucide-react';

export const GatheringConfirmModal = ({ itemName, onConfirm, onClose }) => {
    return (
        <div className="auth-overlay" style={{ background: 'rgba(0,0,0,0)' }}>
            <div className="auth-card rpg-shop" style={{ maxWidth: '350px' }}>
                <div className="rpg-header">
                    <div className="rpg-title">
                        <h2>Confirmar</h2>
                        <span className="rpg-subtitle">Extracción de Recurso</span>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="rpg-body" style={{ textAlign: 'center', padding: '20px 10px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <HelpCircle size={48} color="#3b82f6" style={{ margin: '0 auto' }} />
                    </div>
                    <p style={{ fontSize: '1.1rem', color: '#f3f4f6', marginBottom: '5px' }}>
                        ¿Quieres extraer <strong>{itemName}</strong>?
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                        Esta acción iniciará el proceso de recolección.
                    </p>
                </div>

                <div className="rpg-footer" style={{ gap: '10px' }}>
                    <button className="secondary-btn mini" onClick={onClose} style={{ flex: 1 }}>
                        Cancelar
                    </button>
                    <button className="primary-btn mini" onClick={onConfirm} style={{ flex: 1 }}>
                        Extraer
                    </button>
                </div>
            </div>
        </div>
    );
};
