import Phaser from 'phaser';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.cursors = null;
        this.joystickActive = false;
        this.joystickBase = null;
        this.joystickThumb = null;
        this.joystickForce = { x: 0, y: 0 };
        this.joystickPointer = null;
        this.isMobile = !this.scene.sys.game.device.os.desktop;
    }

    setupInput() {
        this.cursors = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        if (this.isMobile) {
            this.setupJoystick();
        }
    }

    setupJoystick() {
        this.joystickBase = this.scene.add.circle(0, 0, 40, 0xffffff, 0.1).setScrollFactor(0).setDepth(100).setVisible(false);
        this.joystickThumb = this.scene.add.circle(0, 0, 20, 0xffffff, 0.2).setScrollFactor(0).setDepth(101).setVisible(false);

        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.y > this.scene.scale.height / 2 && !this.scene.nearbyObject) {
                this.joystickActive = true;
                this.joystickBase.setPosition(pointer.x, pointer.y).setVisible(true);
                this.joystickThumb.setPosition(pointer.x, pointer.y).setVisible(true);
                this.joystickPointer = pointer;
            }
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (this.joystickActive && this.joystickPointer === pointer) {
                const dist = Phaser.Math.Distance.Between(this.joystickBase.x, this.joystickBase.y, pointer.x, pointer.y);
                const angle = Phaser.Math.Angle.Between(this.joystickBase.x, this.joystickBase.y, pointer.x, pointer.y);
                const maxDist = 40;

                const finalDist = Math.min(dist, maxDist);
                this.joystickThumb.x = this.joystickBase.x + Math.cos(angle) * finalDist;
                this.joystickThumb.y = this.joystickBase.y + Math.sin(angle) * finalDist;

                this.joystickForce = {
                    x: (this.joystickThumb.x - this.joystickBase.x) / maxDist,
                    y: (this.joystickThumb.y - this.joystickBase.y) / maxDist
                };
            }
        });

        this.scene.input.on('pointerup', () => {
            this.joystickActive = false;
            this.joystickBase.setVisible(false);
            this.joystickThumb.setVisible(false);
            this.joystickForce = { x: 0, y: 0 };
        });
    }

    getMovementInput() {
        let vx = 0;
        let vy = 0;
        let isRunning = false;
        
        if (this.cursors) {
            isRunning = this.cursors.shift.isDown;
        }

        const speed = isRunning ? 200 : 100;

        if (this.isMobile && this.joystickActive && this.joystickForce) {
            vx = this.joystickForce.x * speed;
            vy = this.joystickForce.y * speed;
        } else if (this.cursors) {
            if (this.cursors.left.isDown) vx = -speed;
            else if (this.cursors.right.isDown) vx = speed;

            if (this.cursors.up.isDown) vy = -speed;
            else if (this.cursors.down.isDown) vy = speed;
            
            // Normalizar movimiento en diagonal para que no vaya más rápido
            if (vx !== 0 && vy !== 0) {
                vx *= Math.SQRT1_2;
                vy *= Math.SQRT1_2;
            }
        }

        return { vx, vy, isRunning };
    }
}
