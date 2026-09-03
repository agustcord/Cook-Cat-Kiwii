import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';
import CrazyGamesSDK from '../game/services/CrazyGamesSDK.js';
import I18nManager from '../game/services/I18nManager.js';

const ASSET_VERSION = '16';
const assetUrl = (path) => `${path}?v=${ASSET_VERSION}`;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Notify CrazyGames SDK of loading start
    CrazyGamesSDK.getInstance().init().catch(() => {});
    CrazyGamesSDK.getInstance().loadingStart();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const i18n = I18nManager.getInstance();

    // Loading screen text (using premium Outfit font loaded in HTML)
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: i18n.t('boot.loading'),
      style: {
        font: '24px "Outfit", sans-serif',
        fill: '#582f0e',
        fontWeight: '800'
      }
    });
    loadingText.setOrigin(0.5);

    // Preload background image & audio & machines
    this.load.image('bakery_background', assetUrl('assets/backgrounds/fondo_pared.png'));
    this.load.audio('bg_music', assetUrl("assets/audio/Kiwi's Simple Bakehouse Loop.mp3"));
    this.load.image('drink_machine', assetUrl('assets/cafeteteria_base.png'));
    this.load.image('btn_coffee_asset', assetUrl('assets/boton_cafe.png'));
    this.load.image('btn_milk_asset', assetUrl('assets/boton_leche.png'));
    this.load.image('taza_base', assetUrl('assets/taza.png'));
    this.load.image('beverage_empty_cup', assetUrl('assets/taza.png'));
    this.load.image('beverage_coffee', assetUrl('assets/taza.png'));
    this.load.image('beverage_milk', assetUrl('assets/taza.png'));
    this.load.image('beverage_coffee_milk', assetUrl('assets/taza.png'));
    this.load.image('order_beverage_coffee', assetUrl('assets/taza_cafe.png'));
    this.load.image('order_beverage_milk', assetUrl('assets/taza_leche.png'));
    this.load.image('order_beverage_coffee_milk', assetUrl('assets/taza_cafe_leche.png'));
    this.load.image('bakery_counter', assetUrl('assets/mesa_illustracion.png'));
    this.load.image('basurero', assetUrl('assets/basurero.png'));
    this.load.image('oven_off', assetUrl('assets/oven_off.png'));
    this.load.image('oven_on', assetUrl('assets/oven_on.png'));

    // Horno ilustrado artesanal multicapa (400x449)
    this.load.image('oven_base', assetUrl('assets/horno/horno_base.png'));
    this.load.image('oven_glass_off', assetUrl('assets/horno/cristal_horno_apagado.png'));
    this.load.image('oven_glass_on', assetUrl('assets/horno/cristal_horno_encendido.png'));
    this.load.image('oven_timer_base', assetUrl('assets/horno/indicador_de_coccion.png'));
    this.load.image('oven_timer_knob', assetUrl('assets/horno/perilla_indicador_de_coccion.png'));
    this.load.image('oven_btn_power_off', assetUrl('assets/horno/boton_encendido_apagado.png'));
    this.load.image('oven_btn_power_on', assetUrl('assets/horno/boton_encendido_encendido.png'));
    this.load.image('oven_btn_bake_off', assetUrl('assets/horno/boton_cocinando_apagado.png'));
    this.load.image('oven_btn_bake_on', assetUrl('assets/horno/boton_cocinando_encendido.png'));

    this.load.image('chef_cat', assetUrl('assets/chef_cat.png'));
    this.load.image('menu_bg', assetUrl('assets/Cat_chef_behind_counter_202607051008.jpeg'));
    this.load.image('cat_paw_open', assetUrl('assets/cat_paw_open.png'));
    this.load.image('cat_paw_closed', assetUrl('assets/cat_paw_closed.png'));
    
    // Preload UI assets
    this.load.image('day_sign_empty', assetUrl('assets/ui/day_sign_empty.png'));
    this.load.image('coins_sign_empty', assetUrl('assets/ui/coins_sign_empty.png'));
    this.load.image('meta_sign_empty', assetUrl('assets/ui/meta_sign_empty.png'));
    this.load.image('masa_label', assetUrl('assets/ui/masa_label.png'));
    this.load.image('forma_label', assetUrl('assets/ui/forma_label.png'));
    this.load.image('topping_label', assetUrl('assets/ui/topping_label.png'));

    // Preload customer sprites (served from public/ with cache buster v11)
    this.load.image('customer_1', assetUrl('assets/customers/customer_1.png'));
    this.load.image('customer_2', assetUrl('assets/customers/customer_2.png'));
    this.load.image('customer_3', assetUrl('assets/customers/customer_3.png'));
    this.load.image('customer_4', assetUrl('assets/customers/customer_4.png'));
    this.load.image('customer_5', assetUrl('assets/customers/customer_5.png'));

    // Preload dough assets (ilustraciones artesanales de masas grandes y bolitas de masa)
    this.load.image('masa_vainilla', assetUrl('assets/masa_vainilla.png'));
    this.load.image('masa_chocolate', assetUrl('assets/masa_chocolate.png'));
    this.load.image('masa_avena', assetUrl('assets/masa_avena.png'));
    this.load.image('dough_classic', assetUrl('assets/stations/dough_classic.png'));
    this.load.image('dough_chocolate', assetUrl('assets/stations/dough_chocolate.png'));
    this.load.image('dough_oat', assetUrl('assets/stations/dough_oat.png'));
    
    // Preload shapes/cutters (served from public/ with cache buster v11)
    this.load.image('shape_star', assetUrl('assets/stations/shape_star.png'));
    this.load.image('shape_heart', assetUrl('assets/stations/shape_heart.png'));
    this.load.image('shape_cat', assetUrl('assets/stations/shape_cat.png'));
    this.load.image('shape_fish', assetUrl('assets/stations/shape_fish.png'));

    // Preload toppings (served from public/ with cache buster v11)
    this.load.image('topping_sprinkles', assetUrl('assets/stations/topping_sprinkles.png'));
    this.load.image('topping_choco', assetUrl('assets/stations/topping_choco.png'));
    this.load.image('topping_glazing', assetUrl('assets/stations/topping_glazing.png'));

    // Preload all combinations of cookies (raw, baked, burnt) with and without toppings
    const shapes = ['star', 'heart', 'cat', 'fish'];
    const bases = ['classic', 'chocolate', 'oat'];
    const toppingsList = ['sprinkles', 'choco', 'glazing'];

    shapes.forEach(shape => {
      bases.forEach(base => {
        // Raw cookie (no topping)
        const keyRaw = `cookie_${shape}_${base}_raw`;
        this.load.image(keyRaw, assetUrl(`assets/cookies/${keyRaw}.png`));
        
        // Raw cookies (with toppings)
        toppingsList.forEach(topping => {
          const keyRawTopped = `cookie_${shape}_${base}_raw_${topping}`;
          this.load.image(keyRawTopped, assetUrl(`assets/cookies/${keyRawTopped}.png`));
        });

        // Burnt cookie (no topping)
        const keyBurnt = `cookie_${shape}_${base}_burnt`;
        this.load.image(keyBurnt, assetUrl(`assets/cookies/${keyBurnt}.png`));
        
        // Burnt cookies (with toppings)
        toppingsList.forEach(topping => {
          const keyBurntTopped = `cookie_${shape}_${base}_burnt_${topping}`;
          this.load.image(keyBurntTopped, assetUrl(`assets/cookies/${keyBurntTopped}.png`));
        });

        // Untopped baked cookie
        const keyNoTopping = `cookie_${shape}_${base}_baked`;
        this.load.image(keyNoTopping, assetUrl(`assets/cookies/${keyNoTopping}.png`));
        
        // Topped baked cookies
        toppingsList.forEach(topping => {
          const keyTopped = `cookie_${shape}_${base}_baked_${topping}`;
          this.load.image(keyTopped, assetUrl(`assets/cookies/${keyTopped}.png`));
        });
      });
    });
  }

  create() {
    // Initialize SoundManager audio context & settings
    SoundManager.getInstance().initAudioContext();

    // Generate Procedural Textures for Drinks Station & Beverages
    this.generateDrinkTextures();

    // Notify CrazyGames SDK of loading stop
    CrazyGamesSDK.getInstance().loadingStop();

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
  }
}
