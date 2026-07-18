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
    this.load.audio('bg_music', "assets/audio/Kiwi's Simple Bakehouse Loop.mp3");
    this.load.image('drink_machine', 'assets/cafeteteria_base.png');
    this.load.image('btn_coffee_asset', 'assets/boton_cafe.png');
    this.load.image('btn_milk_asset', 'assets/boton_leche.png');
    this.load.image('bakery_counter', 'assets/backgrounds/bakery_counter_base.png');
    this.load.image('oven_off', 'assets/oven_off.png');
    this.load.image('oven_on', 'assets/oven_on.png');
    this.load.image('chef_cat', 'assets/chef_cat.png?v=8');
    this.load.image('menu_bg', 'assets/Cat_chef_behind_counter_202607051008.jpeg');
    this.load.image('cat_paw_open', 'assets/cat_paw_open.png?v=10');
    this.load.image('cat_paw_closed', 'assets/cat_paw_closed.png?v=10');
    
    // Preload UI assets
    this.load.image('day_sign_empty', 'assets/ui/day_sign_empty.png?v=1');
    this.load.image('coins_sign_empty', 'assets/ui/coins_sign_empty.png?v=1');
    this.load.image('meta_sign_empty', 'assets/ui/meta_sign_empty.png?v=7');
    this.load.image('masa_label', 'assets/ui/masa_label.png?v=1');
    this.load.image('forma_label', 'assets/ui/forma_label.png?v=1');
    this.load.image('topping_label', 'assets/ui/topping_label.png?v=1');

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

    // Preload all combinations of cookies (raw, baked, burnt) with and without toppings
    const shapes = ['star', 'heart', 'cat', 'fish'];
    const bases = ['classic', 'chocolate', 'oat'];
    const toppingsList = ['sprinkles', 'choco', 'glazing'];

    shapes.forEach(shape => {
      bases.forEach(base => {
        // Raw cookie (no topping)
        const keyRaw = `cookie_${shape}_${base}_raw`;
        this.load.image(keyRaw, `assets/cookies/${keyRaw}.png?v=8`);
        
        // Raw cookies (with toppings)
        toppingsList.forEach(topping => {
          const keyRawTopped = `cookie_${shape}_${base}_raw_${topping}`;
          this.load.image(keyRawTopped, `assets/cookies/${keyRawTopped}.png?v=8`);
        });

        // Burnt cookie (no topping)
        const keyBurnt = `cookie_${shape}_${base}_burnt`;
        this.load.image(keyBurnt, `assets/cookies/${keyBurnt}.png?v=8`);
        
        // Burnt cookies (with toppings)
        toppingsList.forEach(topping => {
          const keyBurntTopped = `cookie_${shape}_${base}_burnt_${topping}`;
          this.load.image(keyBurntTopped, `assets/cookies/${keyBurntTopped}.png?v=8`);
        });

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
    // Generate Procedural Textures for Drinks Station & Beverages
    this.generateDrinkTextures();

    // Go directly to the main menu
    this.scene.start('MainMenuScene');
  }

  generateDrinkTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Helper to clear and set style
    const startDraw = () => {
      g.clear();
    };

    // 1. Coffee Beans Icon (drink_coffee_beans)
    startDraw();
    g.fillStyle(0x5c3d2e, 1);
    g.fillEllipse(15, 20, 8, 14); // Bean 1
    g.fillEllipse(25, 20, 8, 14); // Bean 2
    g.lineStyle(1.5, 0x2b1b17, 1);
    g.strokeLineShape(new Phaser.Geom.Line(15, 13, 15, 27));
    g.strokeLineShape(new Phaser.Geom.Line(25, 13, 25, 27));
    g.generateTexture('drink_coffee_beans', 40, 40);

    // 2. Milk Carton Icon (drink_milk)
    startDraw();
    // Carton Body
    g.fillStyle(0xf5f3f4, 1);
    g.fillRect(10, 10, 20, 26);
    // Roof triangle
    g.fillStyle(0xe5e5e5, 1);
    g.fillTriangle(10, 10, 30, 10, 20, 5);
    // Blue Stripe decoration
    g.fillStyle(0x00b4d8, 1);
    g.fillRect(10, 20, 20, 6);
    g.lineStyle(1.5, 0x7f7f7f, 1);
    g.strokeRect(10, 10, 20, 26);
    g.generateTexture('drink_milk', 40, 40);

    // 4. Base Cup Drawer helper
    const drawCupBody = (fillColor) => {
      // Cup outline/handle
      g.fillStyle(0xffffff, 1);
      g.fillCircle(32, 22, 6); // Handle
      g.fillStyle(0xe5e5e5, 1);
      g.fillCircle(32, 22, 3); // Handle inner cut
      
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(12, 12, 20, 20, { tl: 2, tr: 2, bl: 8, br: 8 }); // Cup body
      g.lineStyle(1.5, 0x8a8a8a, 1);
      g.strokeRoundedRect(12, 12, 20, 20, { tl: 2, tr: 2, bl: 8, br: 8 });

      // Liquid Fill
      if (fillColor !== null) {
        g.fillStyle(fillColor, 1);
        g.fillRect(14, 15, 16, 12);
      }
    };

    // 5. Black Coffee Cup (beverage_coffee)
    startDraw();
    drawCupBody(0x4a2c2a); // Dark coffee color
    g.generateTexture('beverage_coffee', 45, 45);

    // 6. Warm Milk Cup (beverage_milk)
    startDraw();
    drawCupBody(0xfffaf0); // Off-white cream color
    g.generateTexture('beverage_milk', 45, 45);

    // 7. Coffee with Milk Cup (beverage_coffee_milk)
    startDraw();
    drawCupBody(0xc69c6d); // Light brown latte color
    g.generateTexture('beverage_coffee_milk', 45, 45);

    // 8. Empty Cup (beverage_empty_cup)
    startDraw();
    drawCupBody(null); // No fill color
    g.generateTexture('beverage_empty_cup', 45, 45);
  }
}
