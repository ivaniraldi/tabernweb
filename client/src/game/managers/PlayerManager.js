export class PlayerManager {
    constructor(scene) {
        this.scene = scene;
        this.me = null;
    }

    createAnimations() {
        const config = [
            { key: 'walk-down', prefix: 'player_down_', frames: 6 },
            { key: 'walk-up', prefix: 'player_up_', frames: 6 },
            { key: 'walk-side', prefix: 'player_side_', frames: 6 },
            { key: 'walk-down-side', prefix: 'player_down_side_', frames: 6 },
            { key: 'walk-up-side', prefix: 'player_up_side_', frames: 6 },
            { key: 'idle', prefix: 'player_idle_', frames: 10 }
        ];

        config.forEach(cfg => {
            this.scene.anims.create({
                key: cfg.key,
                frames: Array.from({ length: cfg.frames }, (_, i) => ({ key: `${cfg.prefix}${i + 1}` })),
                frameRate: 10,
                repeat: -1
            });
        });
    }

    createLocalPlayer(playerData, username) {
        this.me = this.createPlayerSprite(playerData.x, playerData.y, '#10b981', username, true);

        this.scene.physics.add.existing(this.me);
        this.me.body.setCollideWorldBounds(true);
        // Hitbox solo en los pies (16x10) para evitar colisiones con la cabeza
        this.me.body.setSize(16, 10);
        this.me.body.setOffset(-8, 18);
        this.me.setDepth(10);

        return this.me;
    }

    createPlayerSprite(x, y, color, name, isMe = false) {
        const container = this.scene.add.container(x, y);
        const sprite = this.scene.add.sprite(0, 0, 'player_idle_1'); // Imagen inicial
        sprite.setScale(2); // Jugador más grande

        const text = this.scene.add.text(0, -45, name, {
            fontSize: '12px',
            fontFamily: 'Outfit',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setResolution(3);

        container.add([sprite, text]);
        return container;
    }

    updatePlayerMovement(vx, vy, isRunning) {
        if (!this.me || !this.me.body) return false;

        const sprite = this.me.getAt(0);
        this.me.body.setVelocity(vx, vy);
        this.me.setDepth(this.me.body.bottom);

        let moved = false;
        
        if (vx !== 0 || vy !== 0) {
            moved = true;
            
            // Manejo de flip para izquierda/derecha
            if (vx !== 0) {
                sprite.setFlipX(vx > 0);
            }

            // Lógica de animaciones incluyendo diagonales (side)
            if (vx !== 0 && vy > 0) {
                // Diagonal hacia abajo
                sprite.play('walk-down-side', true);
            } else if (vx !== 0 && vy < 0) {
                // Diagonal hacia arriba
                sprite.play('walk-up-side', true);
            } else if (vx !== 0) {
                // Movimiento lateral puro
                sprite.play('walk-side', true);
            } else if (vy > 0) {
                // Abajo puro
                sprite.play('walk-down', true);
            } else if (vy < 0) {
                // Arriba puro
                sprite.play('walk-up', true);
            }
        } else {
            sprite.play('idle', true);
        }

        return moved;
    }
}
