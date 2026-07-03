import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw background stripes (simple warm graphics)
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xffe5d9, 1); // Soft peach
    bgGraphics.fillRect(0, 0, width, height);

    // Title text
    this.add.text(width / 2, height / 4, 'Kiwipaw Bakehouse', {
      font: '54px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 4 + 55, 'El gato Kiwi repostero para CrazyGames', {
      font: '18px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);

    // Cute Kiwi cat placeholder graphics
    const catX = width / 2;
    const catY = height / 2 + 15;

    // Body
    bgGraphics.fillStyle(0xddb892, 1); // Light pastel brown
    bgGraphics.fillCircle(catX, catY, 55);

    // Ears
    bgGraphics.fillStyle(0xb79ced, 1); // Purple pastel accents for ears
    bgGraphics.fillTriangle(catX - 45, catY - 35, catX - 25, catY - 20, catX - 55, catY - 5);
    bgGraphics.fillTriangle(catX + 45, catY - 35, catX + 25, catY - 20, catX + 55, catY - 5);
    
    // Inner ears
    bgGraphics.fillStyle(0xffcad4, 1); // Pink inner ear
    bgGraphics.fillTriangle(catX - 40, catY - 30, catX - 27, catY - 18, catX - 47, catY - 8);
    bgGraphics.fillTriangle(catX + 40, catY - 30, catX + 27, catY - 18, catX + 47, catY - 8);

    // Eyes
    bgGraphics.fillStyle(0x3d3d3d, 1);
    bgGraphics.fillCircle(catX - 20, catY - 10, 6);
    bgGraphics.fillCircle(catX + 20, catY - 10, 6);
    
    // Snout / Nose
    bgGraphics.fillStyle(0xd62828, 1); // Red kiwi seed nose
    bgGraphics.fillTriangle(catX, catY, catX - 5, catY - 6, catX + 5, catY - 6);

    // Play Button Box
    const btnX = width / 2 - 110;
    const btnY = height / 2 + 110;
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
