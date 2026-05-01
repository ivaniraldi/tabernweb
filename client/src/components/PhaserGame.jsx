import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../game/MainScene';

export const PhaserGame = forwardRef(function PhaserGame({ userData }, ref) {
    const gameContainerRef = useRef(null);
    const gameInstanceRef = useRef(null);

    useEffect(() => {
        if (!gameContainerRef.current) return;
        
        if (!gameInstanceRef.current) {
            const config = {
                type: Phaser.AUTO,
                parent: gameContainerRef.current,
                width: '100%',
                height: '100%',
                backgroundColor: '#0f172a',
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                },
                physics: {
                    default: 'arcade',
                    arcade: { 
                        debug: true,
                        fixedStep: true 
                    }
                },
                pixelArt: true,
                antialias: false,
                render: {
                    roundPixels: true,
                    powerPreference: 'high-performance'
                },
                fps: {
                    target: 60,
                    forceSetTimeOut: false,
                    panicMax: 0,
                    smoothStep: true
                },
                scene: [MainScene]
            };

            const game = new Phaser.Game(config);
            gameInstanceRef.current = game;
            
            game.scene.start('MainScene', { user: userData });

            if (ref) {
                ref.current = { game, container: gameContainerRef.current };
            }
        }

        return () => {
            // Only destroy if component actually unmounts, not on every re-render
        };
    }, []); // Empty dependency array to ensure it only runs once

    return (
        <div id="game-container" ref={gameContainerRef} style={{ width: '100%', height: '100%' }}></div>
    );
});
