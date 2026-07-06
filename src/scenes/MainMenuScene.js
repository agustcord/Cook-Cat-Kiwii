import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw the full-screen menu background image
    this.add.image(width / 2, height / 2, 'menu_bg').setDisplaySize(width, height);

    // Title text with white stroke and shadow for high legibility
    this.add.text(width / 2, height / 4, 'Kiwipaw Bakehouse', {
      font: '54px "Outfit", sans-serif',
      fill: '#582f0e',
      stroke: '#ffffff',
      strokeThickness: 8,
      shadow: { color: '#000000', fill: false, offsetX: 2, offsetY: 2, blur: 4 },
      fontWeight: '800'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 4 + 55, 'El gato Kiwi repostero para CrazyGames', {
      font: '18px "Outfit", sans-serif',
      fill: '#7f5539',
      stroke: '#ffffff',
      strokeThickness: 4,
      shadow: { color: '#000000', fill: false, offsetX: 1, offsetY: 1, blur: 2 },
      fontWeight: '600'
    }).setOrigin(0.5);

    // Play Button Box
    const btnX = width / 2 - 110;
    const btnY = height / 2 + 130;
    const btnW = 220;
    const btnH = 60;

    const playBtnBg = this.add.graphics();
    playBtnBg.fillStyle(0x7f5539, 1);
    playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 15);

    const playText = this.add.text(width / 2, btnY + btnH / 2, 'JUGAR', {
      font: '24px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    // Make interactive transparent rectangle
    const playZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // Transition to game scene on tap/click
    playZone.on('pointerdown', () => {
      this.scene.start('GameScene', { day: 1, coins: 0 });
    });

    // Simple micro-animations/hover feedback
    playZone.on('pointerover', () => {
      playBtnBg.clear();
      playBtnBg.fillStyle(0x9c6644, 1); // Lighter brown on hover
      playBtnBg.fillRoundedRect(btnX - 5, btnY - 3, btnW + 10, btnH + 6, 18);
      playText.setScale(1.08);
      playText.setColor('#ffe5d9');
    });

    playZone.on('pointerout', () => {
      playBtnBg.clear();
      playBtnBg.fillStyle(0x7f5539, 1);
      playBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 15);
      playText.setScale(1);
      playText.setColor('#fff1e6');
    });

    // Subtext
    this.add.text(width / 2, height - 30, 'Soporta Mouse & Pantalla Táctil', {
      font: '14px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);
  }
}
