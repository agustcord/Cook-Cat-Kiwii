import Phaser from 'phaser';
import SoundEffects from '../game/SoundEffects.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    // Play a low, disappointed/sad synthesized tone
    SoundEffects.playAngry();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Dark somber grey-red gradient feel
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0f12, 0x1a0f12, 0x2d1115, 0x2d1115, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, height / 4, 'BANCARROTA', {
      font: '46px "Outfit", sans-serif',
      fill: '#d90429',
      fontWeight: '800',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Michi Triste emoji or text
    this.add.text(width / 2, height / 2 - 80, '😿', {
      font: '64px "Outfit", sans-serif'
    }).setOrigin(0.5);

    // Narrative Text
    const narrative = 
      "La presión de las deudas y el costo de mantenimiento diario\n" +
      "fueron demasiado para Kiwipaw Bakehouse.\n\n" +
      "Sin monedas suficientes para cubrir el alquiler, servicios y\n" +
      "la cuota del banco, el michi se declaró en quiebra y tuvo\n" +
      "que cerrar sus puertas definitivamente.";

    this.add.text(width / 2, height / 2 + 30, narrative, {
      font: '15px "Outfit", sans-serif',
      fill: '#f5f3f4',
      fontWeight: '600',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Button: VOLVER A INTENTAR
    const btnW = 240;
    const btnH = 50;
    const btnX = width / 2 - btnW / 2;
    const btnY = height - 120;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xd90429, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);

    const btnText = this.add.text(width / 2, btnY + btnH / 2, 'REINTENTAR CAMPAÑA 🔄', {
      font: '16px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', () => {
      SoundEffects.playClick();
      // Restart complete game
      this.scene.start('GameScene', {
        day: 1,
        coins: 0,
        loanRemaining: 200,
        unlockedShapes: ['star'],
        stock: {
          dough: { classic: 10, chocolate: 0, oat: 0 },
          topping: { sprinkles: 0, choco: 0, glazing: 0 }
        }
      });
    });

    actionZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xef233c, 1);
      btnBg.fillRoundedRect(btnX - 4, btnY - 2, btnW + 8, btnH + 4, 14);
      btnText.setScale(1.05);
    });

    actionZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xd90429, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      btnText.setScale(1);
    });
  }
}
