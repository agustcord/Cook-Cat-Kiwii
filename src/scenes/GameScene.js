import Phaser from 'phaser';
import Cookie from '../game/Cookie.js';
import Customer from '../game/Customer.js';

const DAY_CONFIGS = {
  1: {
    meta: 100,
    patienceTime: 35,
    maxCustomers: 3,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón Clásico', base: 'classic', shape: 'heart', toppings: ['sprinkles'] }
    ]
  },
  2: {
    meta: 150,
    patienceTime: 30,
    maxCustomers: 4,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón Clásico', base: 'classic', shape: 'heart', toppings: ['sprinkles'] },
      { name: 'Corazón de Chocolate', base: 'chocolate', shape: 'heart', toppings: ['sprinkles'] },
      { name: 'Galleta Gato Kiwi', base: 'classic', shape: 'cat', toppings: ['kiwi'] },
      { name: 'Estrella de la Casa', base: 'classic', shape: 'star', toppings: ['kiwi'] }
    ]
  },
  3: {
    meta: 200,
    patienceTime: 22,
    maxCustomers: 5,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón de Chocolate', base: 'chocolate', shape: 'heart', toppings: ['glazing'] },
      { name: 'Galleta Gato Kiwi', base: 'classic', shape: 'cat', toppings: ['kiwi'] },
      { name: 'Hueso Saludable', base: 'oat', shape: 'bone', toppings: ['sprinkles'] },
      { name: 'Gato Glaseado', base: 'classic', shape: 'cat', toppings: ['glazing'] },
      { name: 'Doble Choco Hueso', base: 'chocolate', shape: 'bone', toppings: ['sprinkles'] },
      { name: 'Estrella de la Casa', base: 'classic', shape: 'star', toppings: ['kiwi'] },
      { name: 'Corazón Kiwi Fit', base: 'oat', shape: 'heart', toppings: ['kiwi'] },
      { name: 'Gato Choco-Fusión', base: 'chocolate', shape: 'cat', toppings: ['glazing'] }
    ]
  }
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.config = DAY_CONFIGS[this.day];
    
    // Core game state variables
    this.customersSpawned = 0;
    this.currentCustomer = null;
    this.currentCookie = new Cookie();
    
    // Mini-game oven state
    this.isBaking = false;
    this.ovenProgress = 0;
    this.ovenSpeed = 0.02;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw primary background (wood/cream kitchen theme)
    this.drawBackground(width, height);

    // Setup HUD (Day, Meta, Coins)
    this.setupHUD(width);

    // Create the interactive kitchen stations
    this.createStations(width, height);

    // Create Cookie Tray (Preparation Area)
    this.createCookieTray(width, height);

    // Spawn first customer
    this.time.delayedCall(1000, () => {
      this.spawnCustomer();
    });
  }

  drawBackground(width, height) {
    const bg = this.add.graphics();
    // Wall (soft pastel cream)
    bg.fillStyle(0xfff1e6, 1);
    bg.fillRect(0, 0, width, height);

    // Wooden Counter (top separating wall and kitchen)
    bg.fillStyle(0xddb892, 1);
    bg.fillRect(0, 240, width, 25);
    
    // Kitchen Floor/Table (darker warm tone)
    bg.fillStyle(0xede0d4, 1);
    bg.fillRect(0, 265, width, height - 265);

    // Station dividers
    bg.lineStyle(2, 0xddb892, 0.5);
    bg.lineBetween(200, 265, 200, height);
    bg.lineBetween(400, 265, 400, height);
    bg.lineBetween(600, 265, 600, height);
  }

  setupHUD(width) {
    // Day indicator
    this.add.text(20, 15, `DÍA ${this.day}`, {
      font: '24px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    });

    // Coins counter
    this.coinsText = this.add.text(width / 2, 15, `Monedas: ${this.coins}`, {
      font: '24px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5, 0);

    // Meta target indicator
    this.add.text(width - 20, 15, `Meta: ${this.config.meta}`, {
      font: '20px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(1, 0);
  }

  createStations(width, height) {
    // Column 1: Estación de Masa (Masa)
    this.createDoughButtons(50, 300);

    // Column 2: Estación de Forma (Cortadores)
    this.createShapeButtons(250, 300);

    // Column 3: Horno (Oven minigame)
    this.createOvenStation(450, 300);

    // Column 4: Decoración (Toppings)
    this.createToppingButtons(650, 300);
  }

  createDoughButtons(startX, startY) {
    this.add.text(startX, startY - 25, '1. Masa', {
      font: '16px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    });

    const bases = [
      { id: 'classic', label: 'Clásica', color: 0xf5ebe0, unlocked: true },
      { id: 'chocolate', label: 'Choco', color: 0x4f1200, unlocked: this.day >= 2 },
      { id: 'oat', label: 'Avena', color: 0xd5bdaf, unlocked: this.day >= 3 }
    ];

    bases.forEach((b, index) => {
      const y = startY + index * 55;
      
      const btnBg = this.add.graphics();
      btnBg.fillStyle(b.unlocked ? 0xffffff : 0xcccccc, 1);
      btnBg.fillRoundedRect(startX, y, 100, 45, 8);
      btnBg.lineStyle(1.5, 0x7f5539, 1);
      btnBg.strokeRoundedRect(startX, y, 100, 45, 8);

      // Colored ingredient preview circle
      btnBg.fillStyle(b.color, 1);
      btnBg.fillCircle(startX + 20, y + 22, 10);
      btnBg.strokeCircle(startX + 20, y + 22, 10);

      this.add.text(startX + 40, y + 22, b.label, {
        font: '13px "Outfit", sans-serif',
        fill: b.unlocked ? '#582f0e' : '#888888',
        fontWeight: '800'
      }).setOrigin(0, 0.5);

      if (b.unlocked) {
        const zone = this.add.rectangle(startX + 50, y + 22, 100, 45, 0x000000, 0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          this.currentCookie.base = b.id;
          this.updateCookieVisuals();
        });
      }
    });
  }

  createShapeButtons(startX, startY) {
    this.add.text(startX, startY - 25, '2. Forma', {
      font: '16px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    });

    const shapes = [
      { id: 'star', label: 'Estrella', unlocked: true },
      { id: 'heart', label: 'Corazón', unlocked: true },
      { id: 'cat', label: 'Gato', unlocked: this.day >= 2 },
      { id: 'bone', label: 'Hueso', unlocked: this.day >= 3 }
    ];

    shapes.forEach((s, index) => {
      const y = startY + index * 45;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(s.unlocked ? 0xffffff : 0xcccccc, 1);
      btnBg.fillRoundedRect(startX, y, 110, 36, 8);
      btnBg.lineStyle(1.5, 0x7f5539, 1);
      btnBg.strokeRoundedRect(startX, y, 110, 36, 8);

      this.add.text(startX + 55, y + 18, s.label, {
        font: '13px "Outfit", sans-serif',
        fill: s.unlocked ? '#582f0e' : '#888888',
        fontWeight: '800'
      }).setOrigin(0.5);

      if (s.unlocked) {
        const zone = this.add.rectangle(startX + 55, y + 18, 110, 36, 0x000000, 0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          this.currentCookie.shape = s.id;
          this.updateCookieVisuals();
        });
      }
    });
  }

  createOvenStation(startX, startY) {
    this.add.text(startX, startY - 25, '3. Horno', {
      font: '16px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    });

    // Oven Button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7f5539, 1);
    btnBg.fillRoundedRect(startX, startY, 110, 45, 10);
    this.ovenBtnText = this.add.text(startX + 55, startY + 22, 'HORNEAR', {
      font: '14px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    this.ovenZone = this.add.rectangle(startX + 55, startY + 22, 110, 45, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.ovenZone.on('pointerdown', () => {
      this.handleOvenClick();
    });

    // Minigame Timing Bar
    this.ovenBarBg = this.add.graphics();
    this.ovenBarBg.fillStyle(0xe0e0e0, 1);
    this.ovenBarBg.fillRoundedRect(startX - 20, startY + 65, 150, 20, 5);
    
    // Draw the green target zone in the center
    this.ovenBarBg.fillStyle(0x38b000, 1);
    this.ovenBarBg.fillRect(startX + 40, startY + 65, 30, 20); // Green perfect area

    this.ovenBarFill = this.add.graphics();
    this.updateOvenBar();
  }

  handleOvenClick() {
    if (!this.currentCookie.isDeliverable()) {
      // Must select dough + shape first
      this.showFeedbackText('¡Elige masa y forma primero!', 400, 200, '#d90429');
      return;
    }

    if (!this.isBaking) {
      // Start baking minigame
      this.isBaking = true;
      this.ovenProgress = 0;
      this.ovenBtnText.setText('¡FRENAR!');
    } else {
      // Stop baking minigame and evaluate position
      this.isBaking = false;
      this.ovenBtnText.setText('HORNEAR');
      
      // Target area: progress is between 0 (start) and 1 (end). 
      // Area width is 150 pixels. Green zone is between x=startX + 40 and x=startX + 70.
      // So relative progress target is roughly 0.4 to 0.6.
      if (this.ovenProgress >= 0.4 && this.ovenProgress <= 0.6) {
        this.currentCookie.bakedState = 'baked';
        this.showFeedbackText('¡Horneado Perfecto!', 400, 200, '#38b000');
      } else {
        this.currentCookie.bakedState = 'burnt';
        this.showFeedbackText('¡Quemada/Cruda!', 400, 200, '#d90429');
      }
      this.updateCookieVisuals();
    }
  }

  updateOvenBar() {
    this.ovenBarFill.clear();
    if (this.isBaking) {
      this.ovenBarFill.fillStyle(0xd90429, 1); // Red needle
      this.ovenBarFill.fillRect(430 + 150 * this.ovenProgress, 362, 5, 26);
    }
  }

  createToppingButtons(startX, startY) {
    this.add.text(startX, startY - 25, '4. Decorar', {
      font: '16px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    });

    const toppings = [
      { id: 'sprinkles', label: 'Chispas', color: 0xff70a6, unlocked: true },
      { id: 'kiwi', label: 'Kiwi', color: 0x38b000, unlocked: this.day >= 2 },
      { id: 'glazing', label: 'Glaseado', color: 0xff0a54, unlocked: this.day >= 3 }
    ];

    toppings.forEach((t, index) => {
      const y = startY + index * 55;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(t.unlocked ? 0xffffff : 0xcccccc, 1);
      btnBg.fillRoundedRect(startX, y, 100, 45, 8);
      btnBg.lineStyle(1.5, 0x7f5539, 1);
      btnBg.strokeRoundedRect(startX, y, 100, 45, 8);

      // Mini circle preview
      btnBg.fillStyle(t.color, 1);
      btnBg.fillCircle(startX + 20, y + 22, 10);

      this.add.text(startX + 40, y + 22, t.label, {
        font: '13px "Outfit", sans-serif',
        fill: t.unlocked ? '#582f0e' : '#888888',
        fontWeight: '800'
      }).setOrigin(0, 0.5);

      if (t.unlocked) {
        const zone = this.add.rectangle(startX + 50, y + 22, 100, 45, 0x000000, 0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          // Toggle topping (limit to max 1 topping for MVP simplify)
          this.currentCookie.toppings = [t.id];
          this.updateCookieVisuals();
        });
      }
    });
  }

  createCookieTray(width, height) {
    const trayX = width / 2;
    const trayY = height - 100;

    // Draw tray plate placeholder
    const trayBg = this.add.graphics();
    trayBg.fillStyle(0xcccccc, 1); // Metallic tray
    trayBg.fillRoundedRect(trayX - 100, trayY - 45, 200, 90, 10);
    trayBg.lineStyle(3, 0x999999, 1);
    trayBg.strokeRoundedRect(trayX - 100, trayY - 45, 200, 90, 10);

    this.add.text(trayX, trayY - 30, 'Bandeja', {
      font: '11px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);

    // Placeholders for cookie graphics
    this.cookieGraphics = this.add.graphics();
    this.updateCookieVisuals();

    // Reset button
    const resetBg = this.add.graphics();
    resetBg.fillStyle(0x7f5539, 1);
    resetBg.fillRoundedRect(width / 2 - 180, trayY - 15, 60, 30, 8);
    this.add.text(width / 2 - 150, trayY, 'TIRAR', {
      font: '11px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    const resetZone = this.add.rectangle(width / 2 - 150, trayY, 60, 30, 0x000000, 0).setInteractive({ useHandCursor: true });
    resetZone.on('pointerdown', () => {
      this.currentCookie.reset();
      this.updateCookieVisuals();
      this.showFeedbackText('¡Bandeja Limpia!', 400, 200, '#d90429');
    });

    // Deliver Button (makes it easy to test on touch without drag if needed)
    const deliverBg = this.add.graphics();
    deliverBg.fillStyle(0x38b000, 1);
    deliverBg.fillRoundedRect(width / 2 + 120, trayY - 15, 75, 30, 8);
    this.add.text(width / 2 + 157, trayY, 'ENTREGAR', {
      font: '11px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    const deliverZone = this.add.rectangle(width / 2 + 157, trayY, 75, 30, 0x000000, 0).setInteractive({ useHandCursor: true });
    deliverZone.on('pointerdown', () => {
      this.deliverCookie();
    });
  }

  updateCookieVisuals() {
    const cg = this.cookieGraphics;
    cg.clear();

    const trayX = 400;
    const trayY = 510;

    const cookie = this.currentCookie;
    if (!cookie.base) return; // No cookie started yet

    // Determine color by base and bake state
    let color = 0xf5ebe0; // Classic default
    if (cookie.base === 'chocolate') color = 0x4f1200;
    else if (cookie.base === 'oat') color = 0xd5bdaf;

    // Apply color modifications based on baking state
    if (cookie.bakedState === 'baked') {
      // Golden browner shade
      if (cookie.base === 'classic') color = 0xe6ccb2;
      else if (cookie.base === 'chocolate') color = 0x3d0c00;
      else if (cookie.base === 'oat') color = 0xb79a87;
    } else if (cookie.bakedState === 'burnt') {
      color = 0x1f0e00; // Almost black
    }

    cg.fillStyle(color, 1);
    cg.lineStyle(2, 0x000000, 1);

    // Draw Cookie shape
    if (cookie.shape === 'star') {
      cg.fillCircle(trayX, trayY, 25); // Star placeholder circle
      cg.strokeCircle(trayX, trayY, 25);
    } else if (cookie.shape === 'heart') {
      cg.fillRect(trayX - 22, trayY - 22, 44, 44); // Heart placeholder square
      cg.strokeRect(trayX - 22, trayY - 22, 44, 44);
    } else if (cookie.shape === 'cat') {
      cg.fillCircle(trayX, trayY, 28); // Cat placeholder circle
      cg.strokeCircle(trayX, trayY, 28);
    } else if (cookie.shape === 'bone') {
      cg.fillRect(trayX - 30, trayY - 15, 60, 30); // Bone placeholder rect
      cg.strokeRect(trayX - 30, trayY - 15, 60, 30);
    } else {
      // No shape yet, just raw blob circle
      cg.fillCircle(trayX, trayY, 20);
      cg.strokeCircle(trayX, trayY, 20);
    }

    // Draw toppings
    if (cookie.toppings && cookie.toppings.length > 0) {
      const top = cookie.toppings[0];
      let toppingColor = 0xffffff;
      if (top === 'sprinkles') toppingColor = 0xff70a6; // Pink
      else if (top === 'kiwi') toppingColor = 0x38b000; // Green
      else if (top === 'glazing') toppingColor = 0xff0a54; // Bright pink

      cg.fillStyle(toppingColor, 1);
      // Small decoration dots
      cg.fillCircle(trayX, trayY, 8);
      cg.fillCircle(trayX - 10, trayY + 5, 5);
      cg.fillCircle(trayX + 10, trayY - 5, 5);
    }
  }

  spawnCustomer() {
    if (this.customersSpawned >= this.config.maxCustomers) {
      // Day ended, check progression
      this.time.delayedCall(1000, () => {
        this.scene.start('SummaryScene', { day: this.day, coins: this.coins, meta: this.config.meta });
      });
      return;
    }

    this.customersSpawned++;
    
    // Spawn customer in the counter area
    this.currentCustomer = new Customer(
      this, 
      250, 
      120, 
      this.config,
      () => this.handleCustomerTimeout() // callback when patience runs out
    );
  }

  deliverCookie() {
    if (!this.currentCustomer) return;

    if (!this.currentCookie.isDeliverable()) {
      this.showFeedbackText('¡La galleta no está lista!', 400, 200, '#d90429');
      return;
    }

    const score = this.currentCookie.getMatchScore(this.currentCustomer.recipe);
    
    let reward = 0;
    let feedback = '';
    let color = '';

    if (score === 4) {
      reward = 50;
      feedback = '¡PERFECTO! 🍪✨';
      color = '#38b000';
      this.triggerConfetti();
    } else if (score >= 2) {
      reward = 20;
      feedback = 'Mmm, aceptable...';
      color = '#ffb703';
    } else {
      reward = 0;
      feedback = '¡Qué horrible! 😡';
      color = '#d90429';
    }

    this.coins += reward;
    this.coinsText.setText(`Monedas: ${this.coins}`);
    this.showFeedbackText(feedback, 400, 200, color);

    // Reset baking/cookie states
    this.currentCookie.reset();
    this.updateCookieVisuals();

    // Destroy active customer and queue next
    this.currentCustomer.destroy();
    this.currentCustomer = null;

    this.time.delayedCall(1500, () => {
      this.spawnCustomer();
    });
  }

  handleCustomerTimeout() {
    this.showFeedbackText('¡Me cansé de esperar! 😡', 400, 200, '#d90429');
    
    // Reset baking/cookie states
    this.currentCookie.reset();
    this.updateCookieVisuals();

    if (this.currentCustomer) {
      this.currentCustomer.destroy();
      this.currentCustomer = null;
    }

    this.time.delayedCall(1500, () => {
      this.spawnCustomer();
    });
  }

  showFeedbackText(text, x, y, color) {
    const feedbackText = this.add.text(x, y, text, {
      font: '26px "Outfit", sans-serif',
      fill: color,
      fontWeight: '800',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Simple tween animation (fly up and fade out)
    this.tweens.add({
      targets: feedbackText,
      y: y - 50,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        feedbackText.destroy();
      }
    });
  }

  triggerConfetti() {
    const particles = this.add.particles(400, 200, '__WHITE', {
      x: { min: 200, max: 600 },
      y: 100,
      speedY: { min: 100, max: 300 },
      speedX: { min: -50, max: 50 },
      gravityY: 150,
      scale: { start: 8, end: 0 },
      tint: [ 0xff70a6, 0xff0a54, 0x38b000, 0xffb703 ], // Pastel pinks, green, yellow
      lifespan: 2000,
      maxParticles: 35
    });

    this.time.delayedCall(2000, () => {
      particles.destroy();
    });
  }

  update(time, delta) {
    // Oven slider animation
    if (this.isBaking) {
      this.ovenProgress += this.ovenSpeed;
      if (this.ovenProgress >= 1) {
        this.ovenProgress = 1;
        this.ovenSpeed = -Math.abs(this.ovenSpeed); // reverse direction
      } else if (this.ovenProgress <= 0) {
        this.ovenProgress = 0;
        this.ovenSpeed = Math.abs(this.ovenSpeed); // forward direction
      }
      this.updateOvenBar();
    }

    // Call update on active customer to decrease patience
    if (this.currentCustomer) {
      this.currentCustomer.update(time, delta);
    }
  }
}
