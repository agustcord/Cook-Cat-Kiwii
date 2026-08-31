import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';
import CrazyGamesSDK from '../game/services/CrazyGamesSDK.js';
import I18nManager from '../game/services/I18nManager.js';
import SaveManager from '../game/services/SaveManager.js';
import PillSwitcher from '../game/PillSwitcher.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.coins = data.coins || 0;
  }

  create() {
    const i18n = I18nManager.getInstance();

    // Clear saved run state on victory
    SaveManager.getInstance().clearSave();

    // Play a delightful synthesized victory fanfare sound and trigger happytime
    SoundManager.getInstance().playVictoryFanfare();
    CrazyGamesSDK.getInstance().happytime();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Golden warm peach gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffedd8, 0xffedd8, 0xfceade, 0xfceade, 1);
    bg.fillRect(0, 0, width, height);

    // Confetti or sparkles graphics
    this.createConfetti(width, height);

    // Pill Switcher Dual [ EN | ES ] (Top-Right: x: width - 190, y: 85, depth: 100)
    this.pillSwitcher = new PillSwitcher(this, {
      x: width - 190,
      y: 85,
      width: 320,
      height: 82,
      depth: 100,
      onLanguageChange: () => {
        this.scene.restart({ coins: this.coins });
      }
    });

    // Title
    this.add.text(width / 2, height / 4 - 56, i18n.t('victory.title'), {
      font: '83px "Outfit", sans-serif',
      fill: '#38b000',
      fontWeight: '800',
      stroke: '#ffffff',
      strokeThickness: 11
    }).setOrigin(0.5);

    // Happy Michi emoji
    this.add.text(width / 2, height / 2 - 150, '😸👑✨', {
      font: '101px "Outfit", sans-serif'
    }).setOrigin(0.5);

    // Narrative Text
    const narrative = i18n.t('victory.narrative', { coins: this.coins });

    this.add.text(width / 2, height / 2 + 94, narrative, {
      font: '28px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '600',
      align: 'center',
      lineSpacing: 15
    }).setOrigin(0.5);

    // Button: VOLVER AL MENÚ
    const btnW = 413;
    const btnH = 94;
    const btnX = width / 2 - btnW / 2;
    const btnY = height - 188;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7f5539, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);

    const btnText = this.add.text(width / 2, btnY + btnH / 2, i18n.t('victory.returnMenu'), {
      font: '28px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      this.scene.start('MainMenuScene');
    });

    actionZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      btnBg.clear();
      btnBg.fillStyle(0x9c6644, 1);
      btnBg.fillRoundedRect(btnX - 4, btnY - 2, btnW + 8, btnH + 4, 14);
      btnText.setScale(1.05);
    });

    actionZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x7f5539, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      btnText.setScale(1);
    });
  }

  createConfetti(width, height) {
    const colors = [0xffb703, 0xfb8500, 0x219ebc, 0x8ecae6, 0x38b000, 0xff0a54];
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(94, width - 94);
      const y = Phaser.Math.Between(94, height - 150);
      const size = Phaser.Math.Between(8, 19);
      const color = Phaser.Math.RND.pick(colors);
      
      const confetti = this.add.rectangle(x, y, size, size, color);
      confetti.setAngle(Phaser.Math.Between(0, 360));
      
      // Floating animation
      this.tweens.add({
        targets: confetti,
        y: y + Phaser.Math.Between(56, 150),
        angle: confetti.angle + Phaser.Math.Between(-90, 90),
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }
}
