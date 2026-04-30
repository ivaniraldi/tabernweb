import Phaser from 'phaser';
import { EventBus } from './EventBus';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.players = new Map();
        this.me = null;
    }

    init(data) {
        this.myData = data.user;
        this.playerData = data.user.player;
    }

    preload() {
        // Personaje en 32x32 (Spritesheet de 4x4 frames)
        this.load.spritesheet('player', 'assets/player.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });

        // Tilesets
        this.load.image('tiles', 'assets/tiles.png');
        this.load.image('objects', 'assets/furniture_and_props.png');
        this.load.image('windows', 'assets/windows_and_doors.png');
        
        // Carga del mapa exportado desde Tiled
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/tilemap.json');
    }

    create() {
        // --- CREACIÓN DEL MAPA ---
        this.map = this.make.tilemap({ key: 'map' });
        const map = this.map;
        
        // Vinculamos todos los conjuntos posibles
        const tilesSet = map.addTilesetImage('tiles', 'tiles');
        const objectsSet = map.addTilesetImage('objects', 'objects');
        const windowsSet = map.addTilesetImage('windows', 'windows');
        const allTilesets = [tilesSet, objectsSet, windowsSet];

        this.currentDir = 'down';

        // --- ANIMACIONES (4 columnas x 13 filas) ---
        const animConfig = [
            { key: 'idle-down', start: 0, end: 3 },
            { key: 'idle-right', start: 4, end: 7 },
            { key: 'idle-left', start: 8, end: 11 },
            { key: 'idle-up', start: 12, end: 15 },
            // Fila 5 es "looking down right up left" (podemos ignorarla o usarla para giros)
            { key: 'walk-down', start: 20, end: 23 },
            { key: 'run-down', start: 24, end: 27 },
            { key: 'walk-left', start: 28, end: 31 },
            { key: 'run-left', start: 32, end: 35 },
            { key: 'walk-right', start: 36, end: 39 },
            { key: 'run-right', start: 40, end: 43 },
            { key: 'walk-up', start: 44, end: 47 },
            { key: 'run-up', start: 48, end: 51 }
        ];

        animConfig.forEach(cfg => {
            let frameRate = 8;
            if (cfg.key.includes('idle')) frameRate = 4; // Idle muy lento
            if (cfg.key.includes('run')) frameRate = 12; // Correr rápido

            this.anims.create({
                key: cfg.key,
                frames: this.anims.generateFrameNumbers('player', { start: cfg.start, end: cfg.end }),
                frameRate: frameRate,
                repeat: -1
            });
        });

        // --- CREACIÓN DEL JUGADOR LOCAL ---
        this.me = this.createPlayerSprite(this.playerData.x, this.playerData.y, '#10b981', this.myData.username, true);
        
        // Habilitar física para el contenedor
        this.physics.add.existing(this.me);
        this.me.body.setCollideWorldBounds(true);
        this.me.body.setSize(20, 20); 
        this.me.body.setOffset(-10, -10);
        this.me.setDepth(5); 

        // --- CARGA DINÁMICA DE CAPAS DEL MAPA ---
        const layers = {};
        map.layers.forEach((layerData, index) => {
            // Pasamos el array completo de tilesets para que todas las capas puedan usar cualquier imagen
            const layer = map.createLayer(layerData.name, allTilesets, 0, 0);
            if (layer) {
                layer.setDepth(index + 1);
                layers[layerData.name] = layer;
                
                // Si es una capa de colisiones (Paredes u Objetos colisionables)
                if (layerData.name === 'walls' || layerData.name === 'ob_collide') {
                    layer.setCollisionByProperty({ collides: true });
                    this.physics.add.collider(this.me, layer);
                }
            }
        });

        // Ajustes manuales de profundidad para asegurar el orden visual
        if (layers['floor']) layers['floor'].setDepth(1);
        if (layers['walls']) layers['walls'].setDepth(2);
        if (layers['ob_collide']) layers['ob_collide'].setDepth(3);
        if (layers['ob_no_collide']) layers['ob_no_collide'].setDepth(4);
        if (this.me) this.me.setDepth(5);

        // --- CÁMARA Y LÍMITES ---
        const worldWidth = map.widthInPixels; // 512
        const worldHeight = map.heightInPixels; // 1024

        // Si el jugador aparece en 0,0 (fuera de sitio), lo ponemos al centro
        if (this.me.x === 0 && this.me.y === 0) {
            this.me.setPosition(worldWidth / 2, worldHeight / 2);
        }

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Seguir al jugador
        this.cameras.main.startFollow(this.me, true, 0.1, 0.1);

        // Si la pantalla es más grande que el mapa, centramos la cámara
        this.resize(this.scale.gameSize);

        // Movement input (con Shift)
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Settings state
        this.settings = {
            showChatBubbles: true,
            showOtherPlayers: true,
            enableMusic: false
        };

        EventBus.on('settings-changed', (newSettings) => {
            console.log('Aplicando nuevos ajustes:', newSettings);
            this.settings = newSettings;
            this.applySettings();
        });

        // Chat focus state
        this.isChatFocused = false;
        this.input.keyboard.disableGlobalCapture();
        EventBus.on('chat-focus', (focused) => {
            this.isChatFocused = focused;
            if (focused) {
                this.input.keyboard.enabled = false;
                this.input.keyboard.clearCaptures();
                this.input.keyboard.resetKeys();
            } else {
                this.input.keyboard.enabled = true;
            }
        });

        // Listen for server messages
        EventBus.on('server_message', (data) => {
            this.handleServerMessage(data);

            // Show chat bubble if enabled
            if (data.type === 'chat' && this.settings.showChatBubbles) {
                this.showChatBubble(data.playerId, data.message);
            }
        });

        // Resize handler
        this.scale.on('resize', this.resize, this);

        // Tell React we are ready
        EventBus.emit('current-scene-ready', this);
    }

    applySettings() {
        // 1. Other Players Visibility
        this.players.forEach((sprite, id) => {
            sprite.setVisible(this.settings.showOtherPlayers);
        });

        // 2. Music
        if (this.settings.enableMusic) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
    }

    showChatBubble(playerId, message) {
        const pid = Number(playerId);
        const myId = Number(this.playerData.id);
        const target = pid === myId ? this.me : this.players.get(pid);

        if (!target) return;

        // Remove existing bubble if any
        if (target.chatBubble) target.chatBubble.destroy();

        // Create bubble container
        const bubble = this.add.container(0, -70);

        const bubbleText = this.add.text(0, 0, message, {
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

        // Destroy after 3 seconds
        this.time.delayedCall(3000, () => {
            if (bubble.active) bubble.destroy();
        });
    }

    startMusic() {
        if (this.musicStarted) return;
        this.musicStarted = true;

        // Simple Web Audio synth since we don't have assets
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.oscillator = this.audioCtx.createOscillator();
            this.gainNode = this.audioCtx.createGain();

            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime); // A4
            this.gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);

            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioCtx.destination);

            this.oscillator.start();

            // Subtle frequency modulation for "music" feel
            this.time.addEvent({
                delay: 1000,
                callback: () => {
                    const freqs = [440, 493, 523, 587];
                    const next = freqs[Math.floor(Math.random() * freqs.length)];
                    if (this.oscillator) {
                        this.oscillator.frequency.exponentialRampToValueAtTime(next, this.audioCtx.currentTime + 0.5);
                    }
                },
                loop: true
            });
        } catch (e) {
            console.error('AudioContext error:', e);
        }
    }

    stopMusic() {
        if (!this.musicStarted) return;
        this.musicStarted = false;
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    resize(gameSize) {
        const { width, height } = gameSize;
        this.cameras.main.setViewport(0, 0, width, height);
        
        const worldWidth = this.map ? this.map.widthInPixels : 512;
        const worldHeight = this.map ? this.map.heightInPixels : 1024;

        if (width > worldWidth) {
            // Pantalla ancha: centramos y quitamos límites horizontales para permitir el desplazamiento al vacío
            this.cameras.main.removeBounds();
            this.cameras.main.setScroll((worldWidth - width) / 2, this.cameras.main.scrollY);
        } else {
            // Pantalla estrecha: ponemos límites para no ver el vacío
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        }

        if (height > worldHeight) {
            this.cameras.main.setScroll(this.cameras.main.scrollX, (worldHeight - height) / 2);
        }

        if (this.me) {
            this.cameras.main.startFollow(this.me, true, 0.1, 0.1);
        }
    }

    update() {
        if (!this.me || !this.me.body || this.isChatFocused) return;

        let moved = false;
        const isRunning = this.cursors.shift.isDown;
        const speed = isRunning ? 200 : 100;
        const animType = isRunning ? 'run' : 'walk';

        // Reiniciamos velocidad
        let vx = 0;
        let vy = 0;

        const sprite = this.me.getAt(0);

        if (this.cursors.left.isDown) {
            vx = -speed;
            this.currentDir = 'left';
        } else if (this.cursors.right.isDown) {
            vx = speed;
            this.currentDir = 'right';
        }

        if (this.cursors.up.isDown) {
            vy = -speed;
            if (vx === 0) this.currentDir = 'up';
        } else if (this.cursors.down.isDown) {
            vy = speed;
            if (vx === 0) this.currentDir = 'down';
        }

        // --- NORMALIZACIÓN DIAGONAL ---
        // Si nos movemos en ambos ejes, reducimos la velocidad para que la suma vectorial sea igual a 'speed'
        if (vx !== 0 && vy !== 0) {
            vx *= Math.SQRT1_2; // 0.7071...
            vy *= Math.SQRT1_2;
        }

        this.me.body.setVelocity(vx, vy);

        // Animación según dirección dominante
        if (vx !== 0 || vy !== 0) {
            sprite.play(`${animType}-${this.currentDir}`, true);
            moved = true;
        } else {
            sprite.play(`idle-${this.currentDir}`, true);
        }

        if (moved) {
            // Sincronizar con servidor
            const now = Date.now();
            if (!this.lastMoveEmit || now - this.lastMoveEmit > 50) {
                EventBus.emit('player_move', { x: this.me.x, y: this.me.y });
                this.lastMoveEmit = now;
            }
        }
    }


    handleServerMessage(data) {
        const myId = Number(this.playerData.id);

        if (data.type === 'initial_state') {
            console.log('Sincronizando estado inicial:', data.players.length, 'jugadores');
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
            console.log('Nuevo jugador se unió:', pid);
            this.updateRemotePlayer(pid, p.x, p.y, p.color, p.user?.username);
        }

        if (data.type === 'player_moved') {
            const pid = Number(data.playerId);
            if (pid === myId) return;
            this.updateRemotePlayer(pid, data.x, data.y);
        }

        if (data.type === 'player_left') {
            const pid = Number(data.playerId);
            const remotePlayer = this.players.get(pid);
            if (remotePlayer) {
                remotePlayer.destroy();
                this.players.delete(pid);
                console.log('Jugador se fue:', pid);
            }
        }
    }

    updateRemotePlayer(id, x, y, color, username) {
        const pid = Number(id);
        let remotePlayer = this.players.get(pid);

        if (!remotePlayer) {
            console.log(`Creando sprite para jugador remoto ${pid} en (${x}, ${y})`);
            remotePlayer = this.createPlayerSprite(x, y, color || '#6366f1', username || `Jugador ${pid}`);
            this.players.set(pid, remotePlayer);
        }

        if (x !== undefined && y !== undefined) {
            const dx = x - remotePlayer.x;
            const dy = y - remotePlayer.y;
            const dist = Phaser.Math.Distance.Between(remotePlayer.x, remotePlayer.y, x, y);
            const sprite = remotePlayer.getAt(0);

            if (dist > 2) {
                // Estimamos si está corriendo o caminando según la distancia del mensaje
                const isRunning = dist > 6; 
                const animType = isRunning ? 'run' : 'walk';
                let dir = remotePlayer.lastDir || 'down';

                if (Math.abs(dx) > Math.abs(dy)) {
                    dir = dx > 0 ? 'right' : 'left';
                } else {
                    dir = dy > 0 ? 'down' : 'up';
                }
                
                remotePlayer.lastDir = dir;
                sprite.play(`${animType}-${dir}`, true);

                if (dist > 400) {
                    remotePlayer.x = x;
                    remotePlayer.y = y;
                } else {
                    this.tweens.add({
                        targets: remotePlayer,
                        x: x,
                        y: y,
                        duration: 150,
                        ease: 'Power1',
                        onComplete: () => {
                            if (sprite && sprite.active && !this.tweens.isNumberTween(remotePlayer)) {
                                sprite.play(`idle-${remotePlayer.lastDir || 'down'}`, true);
                            }
                        }
                    });
                }
            } else {
                sprite.play(`idle-${remotePlayer.lastDir || 'down'}`, true);
            }
        }
    }

    createPlayerSprite(x, y, color, name, isMe = false) {
        const container = this.add.container(x, y);

        // Usamos el sprite nativo de 32x32
        const sprite = this.add.sprite(0, 0, 'player');
        
        // No aplicamos tinte para mantener colores originales
        // sprite.setTint(tintColor);
        
        // Aumentamos la escala para que se vea mejor frente a los muebles (32x32 -> 48x48 aprox)
        sprite.setScale(1.5);

        // Mantenemos el nombre sobre el personaje (ajustado por la nueva escala)
        const text = this.add.text(0, -35, name, {
            fontSize: '12px',
            fontFamily: 'Outfit',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        container.add([sprite, text]);
        return container;
    }
}
