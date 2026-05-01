import Phaser from 'phaser';
import { EventBus } from '../EventBus';

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

        this.setupInteractables();
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
                        npcSprite.body.setSize(20, 12);
                        npcSprite.body.setOffset(6, 20);
                        npcSprite.setDepth(npcSprite.body.bottom);
                    } else if (type === 'chest') {
                        const chestSprite = this.collisionGroup.create(finalX, y, 'chest');
                        // Ajuste de offset para centrar la hitbox con el sprite visual
                        chestSprite.body.setSize(32, 16);
                        chestSprite.body.setOffset(16, 16);
                        chestSprite.setDepth(chestSprite.body.bottom);
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
            }
        }
    }
}
