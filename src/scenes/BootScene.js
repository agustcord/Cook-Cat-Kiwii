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

    // Preload background image
    this.load.image('bakery_background', 'assets/backgrounds/bakery_background_top.png');
    this.load.image('bakery_counter', 'assets/backgrounds/bakery_counter_base.png');
    this.load.image('oven_off', 'assets/oven_off.png');
    this.load.image('oven_on', 'assets/oven_on.png');
    this.load.image('chef_cat', 'assets/chef_cat.png?v=8');
    this.load.image('menu_bg', 'assets/Cat_chef_behind_counter_202607051008.jpeg');
    this.load.image('cat_paw_open', 'assets/cat_paw_open.png');
    this.load.image('cat_paw_closed', 'assets/cat_paw_closed.png');

    // Preload customer sprites (served from public/ with cache buster v8)
    this.load.image('customer_1', 'assets/customers/customer_1.png?v=8');
    this.load.image('customer_2', 'assets/customers/customer_2.png?v=8');
    this.load.image('customer_3', 'assets/customers/customer_3.png?v=8');
    this.load.image('customer_4', 'assets/customers/customer_4.png?v=8');
    this.load.image('customer_5', 'assets/customers/customer_5.png?v=8');

    // Preload dough balls (served from public/ with cache buster v8)
    this.load.image('dough_classic', 'assets/stations/dough_classic.png?v=8');
    this.load.image('dough_chocolate', 'assets/stations/dough_chocolate.png?v=8');
    this.load.image('dough_oat', 'assets/stations/dough_oat.png?v=8');
    
    // Preload shapes/cutters (served from public/ with cache buster v8)
    this.load.image('shape_star', 'assets/stations/shape_star.png?v=8');
    this.load.image('shape_heart', 'assets/stations/shape_heart.png?v=8');
    this.load.image('shape_cat', 'assets/stations/shape_cat.png?v=8');
    this.load.image('shape_fish', 'assets/stations/shape_fish.png?v=8');

    // Preload toppings (served from public/ with cache buster v8)
    this.load.image('topping_sprinkles', 'assets/stations/topping_sprinkles.png?v=8');
    this.load.image('topping_choco', 'assets/stations/topping_choco.png?v=8');
    this.load.image('topping_glazing', 'assets/stations/topping_glazing.png?v=8');

    // Preload all combinations of cookies (raw, baked, burnt)
    const shapes = ['star', 'heart', 'cat', 'fish'];
    const bases = ['classic', 'chocolate', 'oat'];
    const toppingsList = ['sprinkles', 'choco', 'glazing'];

    shapes.forEach(shape => {
      bases.forEach(base => {
        // Raw cookie
        const keyRaw = `cookie_${shape}_${base}_raw`;
        this.load.image(keyRaw, `assets/cookies/${keyRaw}.png?v=8`);

        // Burnt cookie
        const keyBurnt = `cookie_${shape}_${base}_burnt`;
        this.load.image(keyBurnt, `assets/cookies/${keyBurnt}.png?v=8`);

        // Untopped baked cookie
        const keyNoTopping = `cookie_${shape}_${base}_baked`;
        this.load.image(keyNoTopping, `assets/cookies/${keyNoTopping}.png?v=8`);
        
        // Topped baked cookies
        toppingsList.forEach(topping => {
          const keyTopped = `cookie_${shape}_${base}_baked_${topping}`;
          this.load.image(keyTopped, `assets/cookies/${keyTopped}.png?v=8`);
        });
      });
    });
  }

  create() {
    // Go directly to the main menu
    this.scene.start('MainMenuScene');
  }
}
