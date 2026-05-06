import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { HitboxConfig } from '../HitboxConfig';
import { SpriteConfig } from '../SpriteConfig';
import Swal from 'sweetalert2';

export class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.map = null;
        this.layers = {};
        this.interactables = [];
        this.collisionGroup = this.scene.physics.add.staticGroup();
    }

    createMap(mapId) {
        this.map = this.scene.make.tilemap({ key: mapId });

        const tilesSet = this.map.addTilesetImage('tiles', 'tiles');
        const outsideSet = this.map.addTilesetImage('tiles_outside', 'tiles_outside');
        const objectsSet = this.map.addTilesetImage('objects', 'objects');
        const doorsSet = this.map.addTilesetImage('doors', 'doors');
        
        const allTilesets = [tilesSet, outsideSet, objectsSet, doorsSet].filter(t => t !== null);

        this.map.layers.forEach((layerData, index) => {
            const layer = this.map.createLayer(layerData.name, allTilesets, 0, 0);
            if (layer) {
                layer.setDepth(index + 1);
                this.layers[layerData.name] = layer;

                if (layerData.name === 'spawners') {
                    layer.setVisible(false);
                }

                if (layerData.name === 'walls' || layerData.name === 'ob_collide') {
                    layer.setCollisionByProperty({ collides: true });
                }
            }
        });

        // Depth adjustments
        if (this.layers['floor']) this.layers['floor'].setDepth(1);
        if (this.layers['walls']) this.layers['walls'].setDepth(2);
        if (this.layers['ob_collide']) this.layers['ob_collide'].setDepth(3);
        if (this.layers['ob_no_collide']) this.layers['ob_no_collide'].setDepth(4);

        this.scene.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.createAnimations();
        this.setupInteractables();
    }

    createAnimations() {
        if (!SpriteConfig.spritesheets) return;

        Object.entries(SpriteConfig.spritesheets).forEach(([key, config]) => {
            if (this.scene.anims.exists(key + '_anim')) return;

            this.scene.anims.create({
                key: key + '_anim',
                frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end: config.frames - 1 }),
                frameRate: config.frameRate || 10,
                repeat: config.repeat !== undefined ? config.repeat : -1
            });
        });
    }

    setupInteractables() {
        this.scene.eKey = this.scene.input.keyboard.addKey('E');

        Object.values(this.layers).forEach(layer => {
            layer.forEachTile(tile => {
                if (!tile.properties) return;

                let type = null;
                if (tile.properties.diary_chest) type = 'chest';
                if (tile.properties.isDoor) type = 'door';
                if (tile.properties.spawnShop) type = 'shop';
                if (tile.properties.slot_machine) type = 'slots';
                if (tile.properties.isRock) type = 'rock';
                if (tile.properties.isFiber) type = 'fiber';
                if (tile.properties.isTree) type = 'tree';

                if (type) {
                    const x = tile.getCenterX();
                    const y = tile.getCenterY();
                    let finalX = x;

                    if (type === 'chest') {
                        finalX = x + 16;
                    } else if (type === 'door') {
                        finalX = x - 16;
                    }

                    // Spawneamos sprites para los objetos visuales
                    if (type === 'shop') {
                        const npcSprite = this.collisionGroup.create(finalX, y, 'npc_shop');
                        const hb = HitboxConfig.shop;
                        npcSprite.body.setSize(hb.width, hb.height);
                        npcSprite.body.setOffset(hb.offsetX, hb.offsetY);
                        npcSprite.setDepth(npcSprite.body.bottom);
                        
                        // Aplicar escala desde el config
                        const scale = SpriteConfig.spritesheets?.npc_shop?.scale || 1;
                        npcSprite.setScale(scale);
                        
                        // Si existe animación para npc_shop, la reproducimos
                        if (this.scene.anims.exists('npc_shop_anim')) {
                            npcSprite.play('npc_shop_anim');
                        }
                    } else if (type === 'chest') {
                        const chestSprite = this.collisionGroup.create(finalX, y, 'chest');
                        const hb = HitboxConfig.chest;
                        chestSprite.body.setSize(hb.width, hb.height);
                        chestSprite.body.setOffset(hb.offsetX, hb.offsetY);
                        chestSprite.setDepth(chestSprite.body.bottom);

                        // Aplicar escala desde el config
                        const scale = SpriteConfig.assets?.chest?.scale || 1;
                        chestSprite.setScale(scale);
                    } else if (type === 'slots') {
                        const slotSprite = this.collisionGroup.create(finalX, y, 'slot_machine');
                        const hb = HitboxConfig.slots;
                        slotSprite.body.setSize(hb.width, hb.height);
                        slotSprite.body.setOffset(hb.offsetX, hb.offsetY);
                        slotSprite.setDepth(slotSprite.body.bottom);

                        // Aplicar escala desde el config
                        const scale = SpriteConfig.assets?.slot_machine?.scale || 1;
                        slotSprite.setScale(scale);
                    } else if (type === 'rock' || type === 'fiber' || type === 'tree') {
                        const assetKey = type; // 'rock', 'fiber', 'tree' match SpriteConfig keys
                        const sprite = this.collisionGroup.create(finalX, y, assetKey);
                        const hb = HitboxConfig[type];
                        if (hb) {
                            sprite.body.setSize(hb.width, hb.height);
                            sprite.body.setOffset(hb.offsetX, hb.offsetY);
                        }
                        sprite.setDepth(sprite.body.bottom);

                        // Aplicar escala
                        const scale = SpriteConfig.assets?.[assetKey]?.scale || 1;
                        sprite.setScale(scale);
                    }

                    const eIcon = this.scene.add.container(finalX, y - 40).setDepth(20).setVisible(false);
                    const eBg = this.scene.add.rectangle(0, 0, 20, 20, 0x000000, 0.6);
                    const eText = this.scene.add.text(0, 0, 'E', {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        fontFamily: 'Arial',
                        color: '#ffffff'
                    }).setOrigin(0.5).setResolution(3);
                    eIcon.add([eBg, eText]);

                    this.scene.tweens.add({
                        targets: eIcon,
                        y: y - 45,
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });

                    this.interactables.push({ id: tile.index, x: finalX, y, type, icon: eIcon });
                }
            });
        });
    }

    updateInteractables(player) {
        if (!player || !player.body) return;

        let nearestObj = null;
        let minDist = 50;

        this.interactables.forEach(obj => {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, obj.x, obj.y);
            if (dist < minDist) {
                nearestObj = obj;
                obj.icon.setVisible(true);
            } else {
                obj.icon.setVisible(false);
            }
        });

        // Evitamos que el joystick se active si tocamos la pantalla sobre el objeto
        this.scene.nearbyObject = nearestObj !== null;

        if (nearestObj && Phaser.Input.Keyboard.JustDown(this.scene.eKey)) {
            if (nearestObj.type === 'chest') {
                EventBus.emit('open-chest', nearestObj);
            } else if (nearestObj.type === 'door') {
                EventBus.emit('open-door', nearestObj);
            } else if (nearestObj.type === 'shop') {
                EventBus.emit('open-shop', nearestObj);
            } else if (nearestObj.type === 'slots') {
                EventBus.emit('open-slots', nearestObj);
            } else if (['rock', 'fiber', 'tree'].includes(nearestObj.type)) {
                this.handleGathering(nearestObj);
            }
        }

        if (this.isGathering && Phaser.Input.Keyboard.JustDown(this.scene.eKey)) {
            // Optional: allow stopping with E too if already gathering? 
            // The user said "any key", but E is usually the interact key.
        }
    }

    async handleGathering(obj) {
        if (this.isGathering) return;

        const materialNames = {
            rock: 'Piedra',
            fiber: 'Fibra',
            tree: 'Madera'
        };
        const itemName = `${materialNames[obj.type]} T1`;

        // Emitir evento para abrir el modal de confirmación en React
        EventBus.emit('open-gathering-confirm', { itemName: materialNames[obj.type] });

        // Escuchar la confirmación desde React
        const startExecution = () => {
            this.isGathering = true;
            this.sessionAmount = 0;
            
            // Calcular velocidad según STR
            const stats = typeof this.scene.myData.player.stats === 'string' ? JSON.parse(this.scene.myData.player.stats) : this.scene.myData.player.stats;
            const str = stats.str || 0;
            const gatherSpeed = 2 + str; // Base 2 + 1 por cada punto de STR

            EventBus.emit('start-gathering', { itemName, gatherSpeed });
            EventBus.emit('local-chat-message', { message: `Has comenzado a extraer ${itemName}` });

            // Función para detener la extracción
            const stopGathering = () => {
                if (!this.isGathering) return;
                
                clearInterval(this.gatherInterval);
                this.isGathering = false;
                
                // Remover listeners
                this.scene.input.keyboard.off('keydown', stopGathering);
                this.scene.input.off('pointerdown', stopGathering);
                EventBus.off('stop-gathering-from-ui', stopGathering);
                
                EventBus.emit('stop-gathering');
                EventBus.emit('local-chat-message', { message: `Has terminado de extraer` });
            };

            // Listeners para cancelar
            this.scene.input.keyboard.once('keydown', stopGathering);
            this.scene.input.once('pointerdown', stopGathering);
            EventBus.once('stop-gathering-from-ui', stopGathering);

            // Loop de extracción: 10 por segundo (o gatherSpeed)
            let secondsElapsed = 0;
            this.gatherInterval = setInterval(async () => {
                if (!this.isGathering) {
                    clearInterval(this.gatherInterval);
                    return;
                }

                secondsElapsed++;
                const giveExp = secondsElapsed % 5 === 0;

                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/game/gather`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            playerId: this.scene.myData.player.id,
                            itemName: itemName,
                            quantity: gatherSpeed,
                            giveExp: giveExp
                        })
                    });
                    
                    const data = await response.json();
                    if (data.player) {
                        this.sessionAmount += gatherSpeed;
                        EventBus.emit('update-gathering-session', this.sessionAmount);
                        EventBus.emit('player-data-updated', data.player);

                        if (data.expGained > 0) {
                            EventBus.emit('local-chat-message', { 
                                message: `¡Has ganado ${data.expGained} XP por extraer recursos!` 
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error gathering:", error);
                }
            }, 1000);
        };

        EventBus.once('confirm-gathering', startExecution);
    }
}
