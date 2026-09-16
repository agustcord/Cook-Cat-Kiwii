import './style.css';
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import SummaryScene from './scenes/SummaryScene.js';
import ShopScene from './scenes/ShopScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';
const config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent: 'game-container',
  backgroundColor: '#fff1e6', // Cozy, warm pastel cream base color
  resolution: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
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
  scene: [BootScene, MainMenuScene, GameScene, SummaryScene, ShopScene, GameOverScene, VictoryScene]
};

// Resilient boot function preventing black screen on mobile when load event fired early
export function bootGame() {
  if (typeof window === 'undefined') return null;
  if (window.__KIWI_GAME_BOOTED__) return window.__PHASER_GAME__ || window.game;
  window.__KIWI_GAME_BOOTED__ = true;
  window.__PHASER_GAME__ = window.game = new Phaser.Game(config);
  return window.__PHASER_GAME__;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootGame();
  } else {
    window.addEventListener('DOMContentLoaded', bootGame);
    window.addEventListener('load', bootGame);
  }
}
