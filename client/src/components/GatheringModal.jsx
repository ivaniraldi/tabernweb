import { useEffect } from 'react';
import { Pickaxe, X, Info } from 'lucide-react';

export const GatheringModal = ({ itemName, currentAmount, sessionAmount, gatherSpeed, onClose }) => {
    useEffect(() => {
        const handleKeyDown = () => {
            onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="auth-overlay">
            <div className="auth-card rpg-shop">
                <div className="rpg-header">
                    <div className="rpg-title">
                        <h2>Recolectando</h2>
                        <span className="rpg-subtitle">{itemName}</span>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="rpg-body">
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <img src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3RrZ3RycXlyZ3RrZ3RycXlyZ3RrZ3RycXlyZ3RrZ3RycSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxxcaXNIX5e/giphy.gif" 
                             style={{ width: '120px', borderRadius: '12px', border: '2px solid #374151' }} 
                             alt="Mining" 
                        />
                    </div>

                    <div className="rpg-item-card stat-item">
                        <div className="rpg-item-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                            <Pickaxe size={18} color="#3b82f6" />
                        </div>
                        <div className="rpg-item-info">
                            <span className="rpg-item-name">Progreso de Sesión</span>
                            <span className="rpg-item-type">Velocidad: {gatherSpeed}/seg</span>
                        </div>
                        <div className="rpg-item-value" style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            +{sessionAmount}
                        </div>
                    </div>

                    <div className="rpg-item-card stat-item">
                        <div className="rpg-item-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                            <Info size={18} color="#10b981" />
                        </div>
                        <div className="rpg-item-info">
                            <span className="rpg-item-name">Total en Inventario</span>
                            <span className="rpg-item-type">Balance actual</span>
                        </div>
                        <div className="rpg-item-value" style={{ color: '#10b981', fontWeight: 'bold' }}>
                            {currentAmount}
                        </div>
                    </div>

                    <p style={{ 
                        fontSize: '0.8rem', 
                        color: '#9ca3af', 
                        marginTop: '15px', 
                        textAlign: 'center',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px'
                    }}>
                        Presiona cualquier tecla o mueve el personaje para detener la extracción.
                    </p>
                </div>

                <div className="rpg-footer">
                    <button className="primary-btn mini" onClick={onClose} style={{ width: '100%' }}>
                        Detener Extracción
                    </button>
                </div>
            </div>
        </div>
    );
};
