import Phaser from 'phaser';
import SoundEffects from '../game/SoundEffects.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    // Play introductory main menu synthesized music
    SoundEffects.playMainMenuMusic();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw the full-screen menu background image
    this.add.image(width / 2, height / 2, 'menu_bg').setDisplaySize(width, height);

    // Title text with white stroke and shadow for high legibility
    this.add.text(width / 2, height / 4, 'Kiwipaw Bakehouse', {
      font: '90px "Outfit", sans-serif',
      fill: '#582f0e',
      stroke: '#ffffff',
      strokeThickness: 12,
      shadow: { color: '#000000', fill: false, offsetX: 4, offsetY: 4, blur: 6 },
      fontWeight: '800'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 4 + 95, 'El gato Kiwi repostero para CrazyGames', {
      font: '32px "Outfit", sans-serif',
      fill: '#7f5539',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: { color: '#000000', fill: false, offsetX: 2, offsetY: 2, blur: 4 },
      fontWeight: '600'
    }).setOrigin(0.5);

    // Play Button Box
    const btnX = width / 2 - 190;
    const btnY = height / 2 + 180;
    const btnW = 380;
    const btnH = 100;

    const playBtnBg = this.add.graphics();
    playBtnBg.fillStyle(0x7f5539, 1);
    playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 25);

    const playText = this.add.text(width / 2, btnY + btnH / 2, 'JUGAR', {
      font: '42px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    // Make interactive transparent rectangle
    const playZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // Transition to game scene on tap/click
    playZone.on('pointerdown', () => {
      SoundEffects.playClick();
      this.scene.start('GameScene', {
        day: 1,
        coins: 0,
        loanRemaining: 200,
        unlockedShapes: ['star'],
        stock: {
          dough: { classic: 10, chocolate: 0, oat: 0 },
          topping: { sprinkles: 2, choco: 0, glazing: 0 },
          drink: { coffee_beans: 2, milk: 2 }
        }
      });
    });

    // Simple micro-animations/hover feedback
    playZone.on('pointerover', () => {
      playBtnBg.clear();
      playBtnBg.fillStyle(0x9c6644, 1); // Lighter brown on hover
      playBtnBg.fillRoundedRect(btnX - 8, btnY - 5, btnW + 16, btnH + 10, 28);
      playText.setScale(1.08);
      playText.setColor('#ffe5d9');
    });

    playZone.on('pointerout', () => {
      playBtnBg.clear();
      playBtnBg.fillStyle(0x7f5539, 1);
      playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 25);
      playText.setScale(1);
      playText.setColor('#fff1e6');
    });

    // Subtext
    this.add.text(width / 2, height - 50, 'Soporta Mouse & Pantalla Táctil', {
      font: '24px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);
  }
}
