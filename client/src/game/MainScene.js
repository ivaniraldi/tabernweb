import Phaser from 'phaser';
import { EventBus } from './EventBus';
import { MapManager } from './managers/MapManager';
import { PlayerManager } from './managers/PlayerManager';
import { InputManager } from './managers/InputManager';
import { NetworkManager } from './managers/NetworkManager';
import { AudioManager } from './managers/AudioManager';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    init(data) {
        this.myData = data.user;
        this.playerData = data.user.player;
        this.mapId = data.mapId || this.playerData.mapId || 'map1';
        this.spawnPos = data.spawnPos || null;
        this.settings = data.settings || {
            showChatBubbles: true,
            showOtherPlayers: true,
            enableMusic: false,
            zoom: 0,
            showHitboxes: false
        };
    }

    preload() {
        // Nuevos sprites del jugador (Frames individuales)
        const anims = [
            { folder: 'DownWalk', prefix: 'DownWalk', key: 'down', frames: 6 },
            { folder: 'UpWalk', prefix: 'UpWalk', key: 'up', frames: 6 },
            { folder: 'SideWalk', prefix: 'SideWalk', key: 'side', frames: 6 },
            { folder: 'DownRightWalk', prefix: 'DownSideWalk', key: 'down_side', frames: 6 },
            { folder: 'UpSideWalk', prefix: 'UpSideWalk', key: 'up_side', frames: 6 },
            { folder: 'Idle', prefix: 'IdleAnimation', key: 'idle', frames: 10 }
        ];

        anims.forEach(anim => {
            for (let i = 1; i <= anim.frames; i++) {
                this.load.image(`player_${anim.key}_${i}`, `assets/player_sprites/${anim.folder}/${anim.prefix}${i}.png`);
            }
        });

        this.load.image('tiles', 'assets/tiles.png');
        this.load.image('tiles_outside', 'assets/tiles_outside.png');
        this.load.image('objects', 'assets/furniture_and_props.png');
        this.load.image('doors', 'assets/windows_and_doors.png');
        this.load.image('npc_shop', 'assets/furniture_and_props_sprites/00_npc.png');
        this.load.image('chest', 'assets/furniture_and_props_sprites/01_chest.png');
        
        this.load.tilemapTiledJSON('map1', 'assets/tilemaps/tilemap.json');
        this.load.tilemapTiledJSON('map2', 'assets/tilemaps/2map.json');
    }

    create() {
        this.input.mouse.disableContextMenu();

        // Inicializar managers
        this.mapManager = new MapManager(this);
        this.playerManager = new PlayerManager(this);
        this.inputManager = new InputManager(this);
        this.networkManager = new NetworkManager(this, this.playerManager);
        this.audioManager = new AudioManager(this);

        // Informar del mapa actual y posición inicial
        const initialPos = this.spawnPos || { x: this.playerData.x, y: this.playerData.y };
        EventBus.emit('map-changed', { mapId: this.mapId, pos: initialPos });

        // Crear mapa y animaciones
        this.mapManager.createMap(this.mapId);
        this.playerManager.createAnimations();

        EventBus.on('change-map', (newMapId, spawnPos) => {
            this.scene.restart({ user: this.myData, mapId: newMapId, spawnPos, settings: this.settings });
        });

        // Crear jugador local
        const me = this.playerManager.createLocalPlayer(initialPos, this.myData.username);

        // Configurar colisiones de las capas del mapa
        if (this.mapManager.layers['walls']) {
            this.physics.add.collider(me, this.mapManager.layers['walls']);
        }
        if (this.mapManager.layers['ob_collide']) {
            this.physics.add.collider(me, this.mapManager.layers['ob_collide']);
        }
        
        // Colisiones con objetos dinámicos (Cofres, etc)
        this.physics.add.collider(me, this.mapManager.collisionGroup);

        // Ocultar debug hitboxes por defecto
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.setVisible(false);
            this.physics.world.drawDebug = false;
        }

        // Configurar cámara
        const worldWidth = this.mapManager.map.widthInPixels;
        const worldHeight = this.mapManager.map.heightInPixels;

        if (me.x === 0 && me.y === 0) {
            me.setPosition(worldWidth / 2, worldHeight / 2);
        }

        const isMobile = this.scale.width < 768;
        const topPadding = isMobile ? 150 : 0;
        const bottomPadding = isMobile ? 100 : 0;

        this.cameras.main.setBounds(0, -topPadding, worldWidth, worldHeight + topPadding + bottomPadding);
        this.cameras.main.setZoom(1 + (this.settings?.zoom || 0));
        // Desactivamos el follow automático para controlar el redondeo manualmente
        // this.cameras.main.startFollow(me, true, 1, 1);

        // Configurar controles
        this.inputManager.setupInput();

        // Configurar settings
        // Aplicar settings iniciales
        this.applySettings();

        EventBus.on('settings-changed', (newSettings) => {
            console.log('Aplicando nuevos ajustes:', newSettings);
            this.settings = newSettings;
            this.applySettings();
        });

        // Configurar estado del chat
        this.isChatFocused = false;
        this.input.keyboard.disableGlobalCapture();
        EventBus.on('chat-focus', (focused) => {
            this.isChatFocused = focused;
            if (focused) {
                this.input.keyboard.enabled = false;
                this.input.keyboard.clearCaptures();
                this.input.keyboard.resetKeys();
                if (me && me.body) {
                    me.body.setVelocity(0, 0);
                }
            } else {
                this.input.keyboard.enabled = true;
            }
        });

        this.scale.on('resize', this.resize, this);
        this.resize(this.scale.gameSize);

        EventBus.emit('current-scene-ready', this);
    }

    applySettings() {
        this.networkManager.applyVisibility(this.settings.showOtherPlayers);
        this.cameras.main.setZoom(1 + (this.settings.zoom || 0));

        // Toggle Debug Hitboxes
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.setVisible(this.settings.showHitboxes);
            this.physics.world.drawDebug = this.settings.showHitboxes;
        }

        if (this.settings.enableMusic) {
            this.audioManager.startMusic();
        } else {
            this.audioManager.stopMusic();
        }
    }

    resize(gameSize) {
        const { width, height } = gameSize;
        this.cameras.main.setViewport(0, 0, width, height);
        this.cameras.main.setZoom(1 + (this.settings?.zoom || 0));

        const worldWidth = this.mapManager?.map ? this.mapManager.map.widthInPixels : 512;
        const worldHeight = this.mapManager?.map ? this.mapManager.map.heightInPixels : 1024;

        if (width > worldWidth) {
            this.cameras.main.removeBounds();
            this.cameras.main.setScroll((worldWidth - width) / 2, this.cameras.main.scrollY);
        } else {
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        }

        if (height > worldHeight) {
            this.cameras.main.setScroll(this.cameras.main.scrollX, (worldHeight - height) / 2);
        }

        if (this.playerManager?.me) {
            // this.cameras.main.startFollow(this.playerManager.me, true, 1, 1);
        }
    }

    update() {
        if (!this.playerManager.me || !this.playerManager.me.body || this.isChatFocused) return;

        const { vx, vy, isRunning } = this.inputManager.getMovementInput();
        const moved = this.playerManager.updatePlayerMovement(vx, vy, isRunning);

        // Seguir manualmente redondeando a enteros para evitar vibración en diagonal
        const cam = this.cameras.main;
        const halfWidth = cam.width / 2;
        const halfHeight = cam.height / 2;
        cam.setScroll(
            Math.round(this.playerManager.me.x - halfWidth),
            Math.round(this.playerManager.me.y - halfHeight)
        );

        this.mapManager.updateInteractables(this.playerManager.me);

        if (moved) {
            const now = Date.now();
            if (!this.lastMoveEmit || now - this.lastMoveEmit > 50) {
                EventBus.emit('player_move', { x: this.playerManager.me.x, y: this.playerManager.me.y });
                this.lastMoveEmit = now;
            }
        }
    }

    getPlayerScreenPos(id) {
        const pid = Number(id);
        const myId = Number(this.playerData.id);
        const target = pid === myId ? this.playerManager.me : this.networkManager.players.get(pid);

        if (!target || !target.active) return null;

        const cam = this.cameras.main;
        const screenX = (target.x - cam.scrollX) * cam.zoom;
        const screenY = (target.y - cam.scrollY) * cam.zoom;

        if (screenX < -50 || screenX > cam.width + 50 || screenY < -50 || screenY > cam.height + 50) {
            return { outOfBounds: true };
        }

        return { x: screenX, y: screenY };
    }
}
