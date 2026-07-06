import './style.css';
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import SummaryScene from './scenes/SummaryScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-container',
  backgroundColor: '#fff1e6', // Cozy, warm pastel cream base color
  resolution: window.devicePixelRatio || 1,
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
    transparent: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // We don't need complex physics for our recipe drag-and-drop mechanics
  scene: [BootScene, MainMenuScene, GameScene, SummaryScene]
};

// Create the game instance when the window loads
window.addEventListener('load', () => {
  new Phaser.Game(config);
});
