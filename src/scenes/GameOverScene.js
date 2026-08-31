import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    const safeData = data || {};
    this.reason = safeData.reason || 'debt';
  }

  create() {
    // Play a gentle melancholic game over melody
    SoundManager.getInstance().playGameOverMelody();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Dark somber grey-red gradient feel
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0f12, 0x1a0f12, 0x2d1115, 0x2d1115, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, height / 4 - 40, 'BANCARROTA', {
      font: '86px "Outfit", sans-serif',
      fill: '#d90429',
      fontWeight: '800',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Michi Triste emoji
    this.add.text(width / 2, height / 2 - 160, '😿', {
      font: '120px "Outfit", sans-serif'
    }).setOrigin(0.5);

    // Dynamic reason subtitle and narrative
    let subtitle = 'INSOLVENCIA FINANCIERA';
    let narrative = '';

    if (this.reason === 'supplies') {
      subtitle = 'DESABASTECIMIENTO OPERATIVO';
      narrative =
        'Pudiste cubrir los gastos fijos de la jornada, pero la panadería\n' +
        'se quedó sin masa en la despensa y sin fondos suficientes\n' +
        'para comprar un pack de masa básica en la tienda (mínimo 10 🪙).\n\n' +
        'Sin harina ni masa para hornear, Kiwipaw Bakehouse no puede abrir\n' +
        'al día siguiente y tuvo que cerrar sus puertas definitivamente.';
    } else {
      subtitle = 'INSOLVENCIA FINANCIERA';
      narrative =
        'La presión de las deudas y el costo de mantenimiento diario\n' +
        'fueron demasiado para Kiwipaw Bakehouse.\n\n' +
        'Sin monedas suficientes para cubrir el alquiler, servicios y\n' +
        'la cuota del banco, el michi se declaró en quiebra y tuvo\n' +
        'que cerrar sus puertas definitivamente.';
    }

    this.add.text(width / 2, height / 2 - 40, subtitle, {
      font: '30px "Outfit", sans-serif',
      fill: '#ffb703',
      fontWeight: '800',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 75, narrative, {
      font: '26px "Outfit", sans-serif',
      fill: '#f5f3f4',
      fontWeight: '600',
      align: 'center',
      lineSpacing: 14
    }).setOrigin(0.5);

    // Button: REINTENTAR CAMPAÑA
    const btnW = 450;
    const btnH = 94;
    const btnX = width / 2 - btnW / 2;
    const btnY = height - 210;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xd90429, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);

    const btnText = this.add.text(width / 2, btnY + btnH / 2, 'REINTENTAR CAMPAÑA 🔄', {
      font: '30px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      // Restart complete game
      this.scene.start('GameScene', {
        day: 1,
        coins: 0,
        loanRemaining: 200,
        unlockedShapes: ['star'],
        stock: {
          dough: { classic: 10, chocolate: 0, oat: 0 },
          topping: { sprinkles: 0, choco: 0, glazing: 0 },
          drink: { coffee_beans: 2, milk: 2 }
        }
      });
    });

    actionZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
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
