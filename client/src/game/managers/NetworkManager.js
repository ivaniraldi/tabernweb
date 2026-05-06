import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class NetworkManager {
    constructor(scene, playerManager) {
        this.scene = scene;
        this.playerManager = playerManager;
        this.players = new Map();
        
        EventBus.on('server_message', (data) => {
            this.handleServerMessage(data);

            if (data.type === 'chat' && this.scene.settings.showChatBubbles) {
                this.showChatBubble(data.playerId, data.message);
            }
        });
    }

    handleServerMessage(data) {
        const myId = Number(this.scene.playerData.id);

        if (data.type === 'initial_state') {
            // Clear existing remote players
            this.players.forEach(p => p.destroy());
            this.players.clear();

            data.players.forEach(p => {
                const pid = Number(p.id);
                if (pid === myId) return;
                this.updateRemotePlayer(pid, p.x, p.y, p.color, p.username);
            });
        }

        if (data.type === 'player_joined') {
            const p = data.player;
            const pid = Number(p.id);
            if (pid === myId) return;
            console.log(`Player joined: ${p.username} (${pid}) at ${p.x}, ${p.y}`);
            this.updateRemotePlayer(pid, p.x, p.y, p.color, p.username);
        }

        if (data.type === 'player_moved') {
            const pid = Number(data.playerId);
            if (pid === myId) return;
            this.updateRemotePlayer(pid, data.x, data.y);
        }

        // --- SISTEMA DE TICKS (20Hz) ---
        if (data.type === 'world_tick') {
            data.players.forEach(p => {
                const pid = Number(p.id);
                if (pid === myId) return;
                this.updateRemotePlayer(pid, p.x, p.y);
            });
        }

        if (data.type === 'player_left') {
            const pid = Number(data.playerId);
            const remotePlayer = this.players.get(pid);
            if (remotePlayer) {
                remotePlayer.destroy();
                this.players.delete(pid);
            }
        }
    }

    updateRemotePlayer(id, x, y, color, username) {
        const pid = Number(id);
        let remotePlayer = this.players.get(pid);

        if (!remotePlayer) {
            remotePlayer = this.playerManager.createPlayerSprite(x, y, color || '#6366f1', username || `Jugador ${pid}`);
            const sprite = remotePlayer.getAt(0);
            sprite.setScale(2);
            remotePlayer.setDepth(5);
            remotePlayer.setVisible(this.scene.settings.showOtherPlayers);
            this.players.set(pid, remotePlayer);

            remotePlayer.setInteractive(new Phaser.Geom.Rectangle(-32, -32, 64, 64), Phaser.Geom.Rectangle.Contains);
            remotePlayer.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown() || pointer.wasTouch) {
                    EventBus.emit('show-player-menu', {
                        playerId: pid,
                        username: username || `Jugador ${pid}`,
                        x: pointer.event.clientX,
                        y: pointer.event.clientY
                    });
                }
            });
        }

        if (x !== undefined && y !== undefined) {
            const dx = x - remotePlayer.x;
            const dy = y - remotePlayer.y;
            const dist = Phaser.Math.Distance.Between(remotePlayer.x, remotePlayer.y, x, y);
            const sprite = remotePlayer.getAt(0);

            if (dist > 2) {
                if (Math.abs(dx) > 2 && Math.abs(dy) > 2) {
                    // Diagonal
                    sprite.setFlipX(dx > 0);
                    sprite.play(dy > 0 ? 'walk-down-side' : 'walk-up-side', true);
                } else if (Math.abs(dx) > 2) {
                    // Lateral
                    sprite.setFlipX(dx > 0);
                    sprite.play('walk-side', true);
                } else if (Math.abs(dy) > 2) {
                    // Vertical
                    sprite.play(dy > 0 ? 'walk-down' : 'walk-up', true);
                }

                if (dist > 400) {
                    remotePlayer.x = x;
                    remotePlayer.y = y;
                    remotePlayer.setDepth(y + 28);
                } else {
                    this.scene.tweens.add({
                        targets: remotePlayer,
                        x: x,
                        y: y,
                        duration: 100, // Ajustado para Tick Rate de 50ms
                        ease: 'Linear',
                        onUpdate: () => {
                            if (remotePlayer && remotePlayer.active) {
                                remotePlayer.setDepth(remotePlayer.y + 28);
                            }
                        },
                        onComplete: () => {
                            if (sprite && sprite.active && !this.scene.tweens.isTweening(remotePlayer)) {
                                sprite.play('idle', true);
                            }
                        }
                    });
                }
            } else {
                sprite.play('idle', true);
                remotePlayer.setDepth(remotePlayer.y + 28);
            }
        }
    }

    showChatBubble(playerId, message) {
        const pid = Number(playerId);
        const myId = Number(this.scene.playerData.id);
        const target = pid === myId ? this.playerManager.me : this.players.get(pid);

        if (!target) return;

        if (target.chatBubble) target.chatBubble.destroy();

        const bubble = this.scene.add.container(0, -70);
        const bubbleText = this.scene.add.text(0, 0, message, {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 8, y: 4 },
            align: 'center',
            wordWrap: { width: 150 }
        }).setOrigin(0.5);

        bubble.add(bubbleText);
        target.add(bubble);
        target.chatBubble = bubble;

        this.scene.time.delayedCall(3000, () => {
            if (bubble.active) bubble.destroy();
        });
    }

    applyVisibility(showOtherPlayers) {
        this.players.forEach((sprite) => {
            sprite.setVisible(showOtherPlayers);
        });
    }
}
