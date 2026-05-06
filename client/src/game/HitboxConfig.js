/**
 * Centralized configuration for game hitboxes.
 * All sizes and offsets for player and interactable objects should be defined here.
 */
export const HitboxConfig = {
    // Local player and other players
    player: {
        width: 16,
        height: 10,
        offsetX: -8,
        offsetY: 18
    },
    // NPC Shop sprite
    shop: {
        width: 22,
        height: 10,
        offsetX: 38,
        offsetY: 54,
    },
    // Chest interactable
    chest: {
        width: 32,
        height: 16,
        offsetX: 16,
        offsetY: 16
    },
    // Slot machine interactable
    slots: {
        width: 24,
        height: 16,
        offsetX: 4,
        offsetY: 16
    },
    rock: { width: 32, height: 16, offsetX: 16, offsetY: 16 },
    tree: { width: 32, height: 16, offsetX: 16, offsetY: 16 },
    fiber: { width: 32, height: 16, offsetX: 16, offsetY: 16 }
};
