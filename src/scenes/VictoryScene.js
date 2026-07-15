import Phaser from 'phaser';
import SoundEffects from '../game/SoundEffects.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.coins = data.coins || 0;
  }

  create() {
    // Play a delightful synthesized victory arpeggio sound
    SoundEffects.playPerfect();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Golden warm peach gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffedd8, 0xffedd8, 0xfceade, 0xfceade, 1);
    bg.fillRect(0, 0, width, height);

    // Confetti or sparkles graphics
    this.createConfetti(width, height);

    // Title
    this.add.text(width / 2, height / 4 - 30, 'VICTORIA COMERCIAL', {
      font: '44px "Outfit", sans-serif',
      fill: '#38b000',
      fontWeight: '800',
      stroke: '#ffffff',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Happy Michi emoji
    this.add.text(width / 2, height / 2 - 80, '😸👑✨', {
      font: '54px "Outfit", sans-serif'
    }).setOrigin(0.5);

    // Narrative Text
    const narrative = 
      "¡LO LOGRASTE! Has saldado el préstamo por completo.\n\n" +
      "Kiwipaw Bakehouse es 100% tuya. Ahora eres un michi repostero\n" +
      "exitoso, libre del estrés de la oficina y dueño de tu propio\n" +
      "destino y deliciosas galletas.\n\n" +
      `Te has quedado con un capital neto final de: 🪙 ${this.coins}`;

    this.add.text(width / 2, height / 2 + 50, narrative, {
      font: '15px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '600',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Button: VOLVER AL MENÚ
    const btnW = 220;
    const btnH = 50;
    const btnX = width / 2 - btnW / 2;
    const btnY = height - 100;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7f5539, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);

    const btnText = this.add.text(width / 2, btnY + btnH / 2, 'VOLVER AL MENÚ 🏠', {
      font: '15px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', () => {
      SoundEffects.playClick();
      this.scene.start('MainMenuScene');
    });

    actionZone.on('pointerover', () => {
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
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(50, height - 150);
      const size = Phaser.Math.Between(4, 10);
      const color = Phaser.Math.RND.pick(colors);
      
      const confetti = this.add.rectangle(x, y, size, size, color);
      confetti.setAngle(Phaser.Math.Between(0, 360));
      
      // Floating animation
      this.tweens.add({
        targets: confetti,
        y: y + Phaser.Math.Between(30, 80),
        angle: confetti.angle + Phaser.Math.Between(-90, 90),
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }
}
