import Phaser from 'phaser';

// The EventBus is a simple way to communicate between React and Phaser.
// It allows us to emit events from Phaser (like "player moved") and listen for them in React, 
// and vice versa (like React telling Phaser "send a chat message").
export const EventBus = new Phaser.Events.EventEmitter();
