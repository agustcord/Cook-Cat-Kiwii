import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';
import I18nManager from '../game/services/I18nManager.js';
import SaveManager from '../game/services/SaveManager.js';
import PillSwitcher from '../game/PillSwitcher.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    const safeData = data || {};
    this.reason = safeData.reason || 'debt';
  }

  create() {
    const sound = SoundManager.getInstance();
    const i18n = I18nManager.getInstance();
    const saveManager = SaveManager.getInstance();

    // Clear saved run state on game over
    saveManager.clearSave();

    // Play a gentle melancholic game over melody
    sound.playGameOverMelody();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Dark somber grey-red gradient feel
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0f12, 0x1a0f12, 0x2d1115, 0x2d1115, 1);
    bg.fillRect(0, 0, width, height);

    // Pill Switcher Dual [ EN | ES ] (Top-Right: x: width - 190, y: 85, depth: 100)
    this.pillSwitcher = new PillSwitcher(this, {
      x: width - 190,
      y: 85,
      width: 320,
      height: 82,
      depth: 100,
      onLanguageChange: () => {
        this.scene.restart({ reason: this.reason });
      }
    });

    // Title
    this.add.text(width / 2, height / 4 - 40, i18n.t('gameOver.title'), {
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

    // Dynamic reason subtitle and narrative from i18n
    const isSupplies = this.reason === 'supplies';
    const subtitle = isSupplies ? i18n.t('gameOver.subtitleSupplies') : i18n.t('gameOver.subtitleDebt');
    const narrative = isSupplies ? i18n.t('gameOver.narrativeSupplies') : i18n.t('gameOver.narrativeDebt');

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

    const btnText = this.add.text(width / 2, btnY + btnH / 2, i18n.t('gameOver.retryCampaign'), {
      font: '30px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', () => {
      sound.playUiTap();
      // Restart complete game with default fresh state
      this.scene.start('GameScene', saveManager.getDefaultState());
    });

    actionZone.on('pointerover', () => {
      sound.playUiHover();
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
