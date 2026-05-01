import { useState, useEffect } from 'react';
import { Loader2, Zap } from 'lucide-react';

export const LoadingScreen = ({ status }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                // Incremento aleatorio para que parezca real
                return prev + Math.random() * 15;
            });
        }, 300);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <div className="loading-icon-container">
                    <Zap size={48} className="loading-zap" />
                </div>
                
                <div className="loading-text-container">
                    <h2>Entrando a la Taberna</h2>
                    <p>{status}...</p>
                </div>

                <div className="progress-container">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="progress-glow"></div>
                        </div>
                    </div>
                    <div className="progress-stats">
                        <span>Cargando Mundo...</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>

                <div className="loading-footer">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Preparando tu aventura</span>
                </div>
            </div>

            <style>{`
                .loading-overlay {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                .loading-content {
                    width: 100%;
                    max-width: 400px;
                    padding: 40px;
                    text-align: center;
                }

                .loading-icon-container {
                    margin-bottom: 32px;
                    display: inline-flex;
                    padding: 20px;
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 0;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    box-shadow: 0 0 40px rgba(99, 102, 241, 0.1);
                }

                .loading-zap {
                    color: #6366f1;
                    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
                    animation: zap-pulse 2s infinite;
                }

                @keyframes zap-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                }

                .loading-text-container h2 {
                    color: white;
                    font-size: 1.75rem;
                    margin: 0 0 8px;
                    font-family: 'Outfit', sans-serif;
                    letter-spacing: -0.02em;
                }

                .loading-text-container p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin-bottom: 40px;
                }

                .progress-container {
                    margin-bottom: 40px;
                }

                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 0;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .progress-fill {
                    height: 100%;
                    background: #6366f1;
                    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                .progress-glow {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 20px;
                    height: 100%;
                    background: white;
                    filter: blur(8px);
                    opacity: 0.5;
                }

                .progress-stats {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 12px;
                    color: #64748b;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .loading-footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: #475569;
                    font-size: 0.8rem;
                }
            `}</style>
        </div>
    );
};
