import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading screen text (using premium Outfit font loaded in HTML)
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: 'Cargando Kiwipaw Bakehouse...',
      style: {
        font: '24px "Outfit", sans-serif',
        fill: '#582f0e',
        fontWeight: '800'
      }
    });
    loadingText.setOrigin(0.5);
  }

  create() {
    // Go directly to the main menu
    this.scene.start('MainMenuScene');
  }
}
