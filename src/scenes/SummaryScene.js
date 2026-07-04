import Phaser from 'phaser';

export default class SummaryScene extends Phaser.Scene {
  constructor() {
    super('SummaryScene');
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.meta = safeData.meta || 100;
    this.success = this.coins >= this.meta;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xffe5d9, 1); // Cozy soft peach
    bgGraphics.fillRect(0, 0, width, height);

    // Title
    const titleText = this.success ? '¡DÍA SUPERADO!' : 'DÍA FALLIDO';
    const titleColor = this.success ? '#38b000' : '#d90429';

    this.add.text(width / 2, height / 4 - 30, titleText, {
      font: '48px "Outfit", sans-serif',
      fill: titleColor,
      fontWeight: '800'
    }).setOrigin(0.5);

    // Day description
    this.add.text(width / 2, height / 4 + 30, `Resultados del Día ${this.day}`, {
      font: '22px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);

    // Coin statistics card
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xfff1e6, 0.9);
    cardBg.fillRoundedRect(width / 2 - 180, height / 2 - 70, 360, 140, 15);
    cardBg.lineStyle(2, 0xddb892, 1);
    cardBg.strokeRoundedRect(width / 2 - 180, height / 2 - 70, 360, 140, 15);

    this.add.text(width / 2, height / 2 - 35, `Monedas Obtenidas: ${this.coins}`, {
      font: '26px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 15, `Meta Necesaria: ${this.meta}`, {
      font: '20px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);

    // Determine button text and action callback
    let btnTextString = 'REINTENTAR';
    let nextSceneCallback = () => {
      this.scene.start('GameScene', { day: this.day, coins: 0 });
    };

    if (this.success) {
      if (this.day < 3) {
        btnTextString = 'SIGUIENTE DÍA';
        nextSceneCallback = () => {
          this.scene.start('GameScene', { day: this.day + 1, coins: this.coins });
        };
      } else {
        btnTextString = 'VOLVER AL MENÚ';
        nextSceneCallback = () => {
          this.scene.start('MainMenuScene');
        };

        // Ultimate victory text
        this.add.text(width / 2, height / 2 + 110, '¡Eres un maestro Kiwi repostero!', {
          font: '20px "Outfit", sans-serif',
          fill: '#b5838d',
          fontWeight: '800'
        }).setOrigin(0.5);
      }
    } else {
      // Failure text
      this.add.text(width / 2, height / 2 + 110, '¡No alcanzaste la meta! Inténtalo de nuevo.', {
        font: '16px "Outfit", sans-serif',
        fill: '#d90429',
        fontWeight: '600'
      }).setOrigin(0.5);
    }

    // Button Rendering
    const btnX = width / 2 - 110;
    const btnY = height / 2 + 150;
    const btnW = 220;
    const btnH = 60;

    const actionBtnBg = this.add.graphics();
    actionBtnBg.fillStyle(0x7f5539, 1);
    actionBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 15);

    const btnText = this.add.text(width / 2, btnY + btnH / 2, btnTextString, {
      font: '20px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    // Make interactive transparent rectangle
    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', nextSceneCallback);

    actionZone.on('pointerover', () => {
      actionBtnBg.clear();
      actionBtnBg.fillStyle(0x9c6644, 1); // Lighter on hover
      actionBtnBg.fillRoundedRect(btnX - 5, btnY - 3, btnW + 10, btnH + 6, 18);
      btnText.setScale(1.08);
      btnText.setColor('#ffe5d9');
    });

    actionZone.on('pointerout', () => {
      actionBtnBg.clear();
      actionBtnBg.fillStyle(0x7f5539, 1);
      actionBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 15);
      btnText.setScale(1);
      btnText.setColor('#fff1e6');
    });
  }
}
