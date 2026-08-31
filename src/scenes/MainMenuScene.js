import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';
import I18nManager from '../game/services/I18nManager.js';
import SaveManager from '../game/services/SaveManager.js';
import PillSwitcher from '../game/PillSwitcher.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const sound = SoundManager.getInstance();
    const i18n = I18nManager.getInstance();
    const saveManager = SaveManager.getInstance();

    // Play introductory main menu synthesized music
    sound.playMainMenuMusic();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw the full-screen menu background image
    this.add.image(width / 2, height / 2, 'menu_bg').setDisplaySize(width, height);

    // Title text with white stroke and shadow for high legibility
    this.titleText = this.add.text(width / 2, height / 4, i18n.t('mainMenu.title'), {
      font: '90px "Outfit", sans-serif',
      fill: '#582f0e',
      stroke: '#ffffff',
      strokeThickness: 12,
      shadow: { color: '#000000', fill: false, offsetX: 4, offsetY: 4, blur: 6 },
      fontWeight: '800'
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(width / 2, height / 4 + 95, i18n.t('mainMenu.subtitle'), {
      font: '32px "Outfit", sans-serif',
      fill: '#7f5539',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: { color: '#000000', fill: false, offsetX: 2, offsetY: 2, blur: 4 },
      fontWeight: '600'
    }).setOrigin(0.5);

    // Pill Switcher Dual [ EN | ES ] (Top-Right: x: width - 190, y: 90, depth: 100)
    this.pillSwitcher = new PillSwitcher(this, {
      x: width - 190,
      y: 90,
      width: 320,
      height: 82,
      depth: 100,
      onLanguageChange: () => {
        this.refreshLocalizedTexts();
      }
    });

    // Check saved game state for Continue / New Game
    const hasSave = saveManager.hasSavedGame();
    const savedState = saveManager.loadGame();

    const startFreshGame = () => {
      saveManager.clearSave();
      this.scene.start('GameScene', saveManager.getDefaultState());
    };

    if (hasSave && savedState) {
      // DUAL BUTTONS: CONTINUE & NEW GAME
      const btnW = 380;
      const btnH = 80;
      const continueY = height / 2 + 130;
      const newGameY = height / 2 + 230;

      // 1. Continue Button
      const continueBtn = this.createMenuButton({
        x: width / 2,
        y: continueY,
        width: btnW,
        height: btnH,
        text: `${i18n.t('mainMenu.continue')} (D${savedState.day})`,
        color: 0x38b000,
        hoverColor: 0x4cc9f0,
        onClick: () => {
          sound.playUiTap();
          this.scene.start('GameScene', savedState);
        }
      });
      this.continueBtnText = continueBtn.btnText;

      // 2. New Game Button
      const newGameBtn = this.createMenuButton({
        x: width / 2,
        y: newGameY,
        width: btnW,
        height: btnH,
        text: i18n.t('mainMenu.newGame'),
        color: 0x7f5539,
        hoverColor: 0x9c6644,
        onClick: () => {
          sound.playUiTap();
          startFreshGame();
        }
      });
      this.newGameBtnText = newGameBtn.btnText;
    } else {
      // SINGLE PLAY BUTTON
      const btnW = 380;
      const btnH = 96;
      const btnY = height / 2 + 180;

      const playBtn = this.createMenuButton({
        x: width / 2,
        y: btnY,
        width: btnW,
        height: btnH,
        text: i18n.t('mainMenu.play'),
        color: 0x7f5539,
        hoverColor: 0x9c6644,
        fontSize: '42px',
        onClick: () => {
          sound.playUiTap();
          startFreshGame();
        }
      });
      this.playBtnText = playBtn.btnText;
    }

    // Subtext
    this.subtextObj = this.add.text(width / 2, height - 50, i18n.t('mainMenu.subtext'), {
      font: '24px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);
  }

  refreshLocalizedTexts() {
    const i18n = I18nManager.getInstance();
    const saveManager = SaveManager.getInstance();
    const savedState = saveManager.loadGame();

    if (this.titleText) {
      this.titleText.setText(i18n.t('mainMenu.title'));
    }
    if (this.subtitleText) {
      this.subtitleText.setText(i18n.t('mainMenu.subtitle'));
    }
    if (this.subtextObj) {
      this.subtextObj.setText(i18n.t('mainMenu.subtext'));
    }
    if (this.continueBtnText && savedState) {
      this.continueBtnText.setText(`${i18n.t('mainMenu.continue')} (D${savedState.day})`);
    }
    if (this.newGameBtnText) {
      this.newGameBtnText.setText(i18n.t('mainMenu.newGame'));
    }
    if (this.playBtnText) {
      this.playBtnText.setText(i18n.t('mainMenu.play'));
    }
    if (this.pillSwitcher) {
      this.pillSwitcher.updateVisuals();
    }
  }

  createMenuButton({ x, y, width, height, text, color, hoverColor, fontSize = '32px', onClick }) {
    const sound = SoundManager.getInstance();
    const btnBg = this.add.graphics();
    btnBg.fillStyle(color, 1);
    btnBg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 22);

    const btnText = this.add.text(x, y, text, {
      font: `${fontSize} "Outfit", sans-serif`,
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    const zone = this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      onClick();
    });

    zone.on('pointerover', () => {
      sound.playUiHover();
      btnBg.clear();
      btnBg.fillStyle(hoverColor, 1);
      btnBg.fillRoundedRect(x - width / 2 - 4, y - height / 2 - 2, width + 8, height + 4, 24);
      btnText.setScale(1.05);
      btnText.setColor('#ffe5d9');
    });

    zone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(color, 1);
      btnBg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 22);
      btnText.setScale(1);
      btnText.setColor('#fff1e6');
    });

    return { btnBg, btnText, zone };
  }
}
