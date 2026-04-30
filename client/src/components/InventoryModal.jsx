import { useState } from 'react';

export const InventoryModal = ({ onClose }) => {
    return (
        <div className="auth-overlay">
            <div className="auth-card">
                <div className="hud-header">
                    <h2>Inventario</h2>
                    <button className="icon-btn" onClick={onClose}>✕</button>
                </div>
                
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: '12px',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    color: '#64748b'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
                    <p>Tu inventario está vacío por el momento.</p>
                </div>

                <div className="settings-actions" style={{ marginTop: '24px' }}>
                    <button className="primary-btn" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};
