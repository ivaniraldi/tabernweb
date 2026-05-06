import { HitboxConfig } from '../HitboxConfig';
import { SpriteConfig } from '../SpriteConfig';

export class PlayerManager {
    constructor(scene) {
        this.scene = scene;
        this.me = null;
    }

    createAnimations() {
        const playerCfg = SpriteConfig.player;
        
        playerCfg.animations.forEach(anim => {
            this.scene.anims.create({
                key: anim.key,
                frames: Array.from({ length: anim.frames }, (_, i) => ({ key: `${anim.loadPrefix}${i + 1}` })),
                frameRate: playerCfg.frameRate,
                repeat: playerCfg.repeat
            });
        });
    }

    createLocalPlayer(playerData, username) {
        this.me = this.createPlayerSprite(playerData.x, playerData.y, '#10b981', username, true);

        this.scene.physics.add.existing(this.me);
        this.me.body.setCollideWorldBounds(true);
        // Hitbox configurada centralizadamente
        const hb = HitboxConfig.player;
        this.me.body.setSize(hb.width, hb.height);
        this.me.body.setOffset(hb.offsetX, hb.offsetY);
        this.me.setDepth(10);

        return this.me;
    }

    createPlayerSprite(x, y, color, name, isMe = false) {
        const container = this.scene.add.container(x, y);
        const sprite = this.scene.add.sprite(0, 0, 'player_idle_1'); // Imagen inicial
        sprite.setScale(SpriteConfig.player.scale); // Jugador más grande

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
