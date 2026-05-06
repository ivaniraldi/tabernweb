/**
 * Centralized configuration for game sprites and animations.
 */
export const SpriteConfig = {
    // Player animations configuration
    player: {
        basePath: 'assets/player_sprites',
        animations: [
            {
                key: 'walk-down',
                folder: 'DownWalk',
                filePrefix: 'DownWalk',
                loadPrefix: 'player_down_',
                frames: 6
            },
            {
                key: 'walk-up',
                folder: 'UpWalk',
                filePrefix: 'UpWalk',
                loadPrefix: 'player_up_',
                frames: 6
            },
            {
                key: 'walk-side',
                folder: 'SideWalk',
                filePrefix: 'SideWalk',
                loadPrefix: 'player_side_',
                frames: 6
            },
            {
                key: 'walk-down-side',
                folder: 'DownRightWalk',
                filePrefix: 'DownSideWalk',
                loadPrefix: 'player_down_side_',
                frames: 6
            },
            {
                key: 'walk-up-side',
                folder: 'UpSideWalk',
                filePrefix: 'UpSideWalk',
                loadPrefix: 'player_up_side_',
                frames: 6
            },
            {
                key: 'idle',
                folder: 'Idle',
                filePrefix: 'IdleAnimation',
                loadPrefix: 'player_idle_',
                frames: 10
            }
        ],
        frameRate: 10,
        repeat: -1,
        scale: 2
    },

    // Static assets like tilesets and interactable sprites
    assets: {
        tiles: { path: 'assets/tiles.png' },
        tiles_outside: { path: 'assets/tiles_outside.png' },
        objects: { path: 'assets/furniture_and_props.png' },
        doors: { path: 'assets/windows_and_doors.png' },
        chest: { path: 'assets/furniture_and_props_sprites/01_chest.png', scale: 1 },
        slot_machine: { path: 'assets/furniture_and_props_sprites/03_slot_machine.png', scale: 1 },
        rock: { path: 'assets/furniture_and_props_sprites/05_rock.png', scale: 1 },
        tree: { path: 'assets/furniture_and_props_sprites/06_tree.png', scale: 1 },
        fiber: { path: 'assets/furniture_and_props_sprites/07_fiber.png', scale: 1 }
    },

    // Spritesheets for animated objects
    spritesheets: {
        npc_shop: {
            path: 'assets/shop_sprite.png',
            frameWidth: 96,
            frameHeight: 80,
            frames: 8,
            frameRate: 8,
            repeat: -1,
            scale: 1.4
        }
    },

    // Tilemaps
    maps: {
        map1: 'assets/tilemaps/tilemap.json',
        map2: 'assets/tilemaps/2map.json'
    }
};
