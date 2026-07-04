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
      { name: 'Galleta Gato Choco', base: 'classic', shape: 'cat', toppings: ['choco'] },
      { name: 'Estrella de Choco', base: 'classic', shape: 'star', toppings: ['choco'] }
    ]
  },
  3: {
    meta: 200,
    patienceTime: 22,
    maxCustomers: 5,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón de Chocolate', base: 'chocolate', shape: 'heart', toppings: ['glazing'] },
      { name: 'Galleta Gato Choco', base: 'classic', shape: 'cat', toppings: ['choco'] },
      { name: 'Hueso Saludable', base: 'oat', shape: 'bone', toppings: ['sprinkles'] },
      { name: 'Gato Glaseado', base: 'classic', shape: 'cat', toppings: ['glazing'] },
      { name: 'Doble Choco Hueso', base: 'chocolate', shape: 'bone', toppings: ['sprinkles'] },
      { name: 'Estrella de Choco', base: 'classic', shape: 'star', toppings: ['choco'] },
      { name: 'Corazón Avena Choco', base: 'oat', shape: 'heart', toppings: ['choco'] },
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

    // Draw primary background (cream wall)
    this.drawBackground(width, height);

    // Create the customer layer container (behind the counter)
    this.customerContainer = this.add.container(0, 0);

    // Draw the Wooden Counter and Floor (in front of the customer, behind UI)
    const counterBg = this.add.graphics();
    
    // Wooden Counter (top separating wall and kitchen)
    counterBg.fillStyle(0xddb892, 1);
    counterBg.fillRect(0, 240, width, 25);
    
    // Kitchen Floor/Table (darker warm tone)
    counterBg.fillStyle(0xede0d4, 1);
    counterBg.fillRect(0, 265, width, height - 265);

    // Station dividers
    counterBg.lineStyle(2, 0xddb892, 0.5);
    counterBg.lineBetween(200, 265, 200, height);
    counterBg.lineBetween(400, 265, 400, height);
    counterBg.lineBetween(600, 265, 600, height);

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
      const x = startX;
      const y = startY + index * 45;

      const container = this.add.container(x, y);
      container.setData('origX', x);
      container.setData('origY', y);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(s.unlocked ? 0xffffff : 0xcccccc, 1);
      btnBg.fillRoundedRect(0, 0, 110, 36, 8);
      btnBg.lineStyle(1.5, 0x7f5539, 1);
      btnBg.strokeRoundedRect(0, 0, 110, 36, 8);
      container.add(btnBg);

      const btnText = this.add.text(55, 18, s.label, {
        font: '13px "Outfit", sans-serif',
        fill: s.unlocked ? '#582f0e' : '#888888',
        fontWeight: '800'
      }).setOrigin(0.5);
      container.add(btnText);

      if (s.unlocked) {
        // Create a flat transparent rectangle as the interactive drag zone
        const dragZone = this.add.rectangle(x + 55, y + 18, 110, 36, 0x000000, 0);
        dragZone.setInteractive({ useHandCursor: true });
        this.input.setDraggable(dragZone);

        dragZone.on('pointerover', () => {
          btnText.setScale(1.05);
        });
        dragZone.on('pointerout', () => {
          btnText.setScale(1);
        });

        // Drag handlers
        dragZone.on('drag', (pointer, dragX, dragY) => {
          dragZone.x = dragX;
          dragZone.y = dragY;
          // Shift visual container to follow the drag zone
          container.x = dragX - 55;
          container.y = dragY - 18;
        });

        dragZone.on('dragend', () => {
          // Check distance to cookie tray (x: 400, y: 510)
          const dist = Phaser.Math.Distance.Between(dragZone.x, dragZone.y, 400, 510);
          if (dist < 100) {
            if (this.currentCookie.base) {
              this.currentCookie.shape = s.id;
              this.updateCookieVisuals();
              this.showFeedbackText(`¡Forma de ${s.label}!`, 400, 200, '#38b000');
            } else {
              this.showFeedbackText('¡Primero selecciona la masa!', 400, 200, '#d90429');
            }
          }

          // Return transition for both the interactive dragZone and the visual container
          this.tweens.add({
            targets: [dragZone, container],
            x: {
              getStart: (target) => target.x,
              getEnd: (target) => (target === dragZone ? x + 55 : x)
            },
            y: {
              getStart: (target) => target.y,
              getEnd: (target) => (target === dragZone ? y + 18 : y)
            },
            duration: 250,
            ease: 'Back.out'
          });
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
      { id: 'choco', label: 'Choco', color: 0x3d0c00, unlocked: this.day >= 2 },
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
          if (this.currentCookie.base) {
            // Toggle topping (limit to max 1 topping for MVP simplify)
            this.currentCookie.toppings = [t.id];
            this.updateCookieVisuals();
          } else {
            this.showFeedbackText('¡Primero selecciona la masa!', 400, 200, '#d90429');
          }
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

  drawCookie() {
    const cg = this.cookieGraphics;
    cg.clear();

    const cookie = this.currentCookie;
    if (!cookie.base) return;

    const trayX = 400;
    const trayY = 510;

    // Determine color by base and bake state
    let color = 0xf5ebe0; // Classic default
    if (cookie.base === 'chocolate') color = 0x4f1200;
    else if (cookie.base === 'oat') color = 0xd5bdaf;

    // Apply color modifications based on baking state
    if (cookie.bakedState === 'baked') {
      if (cookie.base === 'classic') color = 0xe6ccb2;
      else if (cookie.base === 'chocolate') color = 0x3d0c00;
      else if (cookie.base === 'oat') color = 0xb79a87;
    } else if (cookie.bakedState === 'burnt') {
      color = 0x1f0e00; // Almost black
    }

    cg.fillStyle(color, 1);
    cg.lineStyle(2, 0x352f44, 1); // Dark brown/lavender soft outlines

    // Draw Cookie shape
    if (cookie.shape === 'star') {
      const spikes = 5;
      const outerRadius = 24;
      const innerRadius = 10;
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / spikes;
      
      cg.beginPath();
      cg.moveTo(trayX + Math.cos(rot) * outerRadius, trayY + Math.sin(rot) * outerRadius);
      for (let i = 0; i < spikes * 2; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const x = trayX + Math.cos(rot + i * step) * r;
        const y = trayY + Math.sin(rot + i * step) * r;
        cg.lineTo(x, y);
      }
      cg.closePath();
      cg.fillPath();
      cg.strokePath();
    } else if (cookie.shape === 'heart') {
      cg.fillCircle(trayX - 10, trayY - 6, 12);
      cg.fillCircle(trayX + 10, trayY - 6, 12);
      cg.beginPath();
      cg.moveTo(trayX - 21.5, trayY - 2);
      cg.lineTo(trayX, trayY + 18);
      cg.lineTo(trayX + 21.5, trayY - 2);
      cg.closePath();
      cg.fillPath();

      cg.strokeCircle(trayX - 10, trayY - 6, 12);
      cg.strokeCircle(trayX + 10, trayY - 6, 12);
      cg.beginPath();
      cg.moveTo(trayX - 21.5, trayY - 2);
      cg.lineTo(trayX, trayY + 18);
      cg.lineTo(trayX + 21.5, trayY - 2);
      cg.strokePath();

      // Mask center
      cg.fillStyle(color, 1);
      cg.fillCircle(trayX - 10, trayY - 6, 10.5);
      cg.fillCircle(trayX + 10, trayY - 6, 10.5);
      cg.beginPath();
      cg.moveTo(trayX - 19, trayY - 2);
      cg.lineTo(trayX, trayY + 15);
      cg.lineTo(trayX + 19, trayY - 2);
      cg.closePath();
      cg.fillPath();
    } else if (cookie.shape === 'cat') {
      // Left Ear
      cg.beginPath();
      cg.moveTo(trayX - 18, trayY - 10);
      cg.lineTo(trayX - 24, trayY - 28);
      cg.lineTo(trayX - 4, trayY - 18);
      cg.closePath();
      cg.fillPath();
      cg.strokePath();

      // Right Ear
      cg.beginPath();
      cg.moveTo(trayX + 18, trayY - 10);
      cg.lineTo(trayX + 24, trayY - 28);
      cg.lineTo(trayX + 4, trayY - 18);
      cg.closePath();
      cg.fillPath();
      cg.strokePath();

      // Main head
      cg.fillCircle(trayX, trayY - 5, 22);
      cg.strokeCircle(trayX, trayY - 5, 22);
    } else if (cookie.shape === 'bone') {
      cg.fillCircle(trayX - 20, trayY - 10, 8);
      cg.strokeCircle(trayX - 20, trayY - 10, 8);
      cg.fillCircle(trayX - 20, trayY + 10, 8);
      cg.strokeCircle(trayX - 20, trayY + 10, 8);

      cg.fillCircle(trayX + 20, trayY - 10, 8);
      cg.strokeCircle(trayX + 20, trayY - 10, 8);
      cg.fillCircle(trayX + 20, trayY + 10, 8);
      cg.strokeCircle(trayX + 20, trayY + 10, 8);

      cg.fillRect(trayX - 20, trayY - 8, 40, 16);
      cg.strokeRect(trayX - 20, trayY - 8, 40, 16);
      
      cg.fillStyle(color, 1);
      cg.fillRect(trayX - 18, trayY - 7, 36, 14);
    } else {
      // No shape yet, raw dough blob
      cg.fillCircle(trayX, trayY, 20);
      cg.strokeCircle(trayX, trayY, 20);
    }

    // Draw toppings
    if (cookie.toppings && cookie.toppings.length > 0) {
      const top = cookie.toppings[0];
      if (top === 'sprinkles') {
        cg.fillStyle(0xff70a6, 1); // Pink
        cg.fillCircle(trayX - 8, trayY - 5, 3);
        cg.fillStyle(0xffb703, 1); // Yellow
        cg.fillCircle(trayX + 8, trayY + 5, 3);
        cg.fillStyle(0x00f5d4, 1); // Blue-green
        cg.fillCircle(trayX, trayY - 12, 3);
      } else if (top === 'choco') {
        cg.fillStyle(0x3d0c00, 1); // Chocolate Chips
        cg.fillRect(trayX - 6, trayY - 8, 5, 5);
        cg.fillRect(trayX + 5, trayY + 3, 5, 5);
        cg.fillRect(trayX - 3, trayY + 6, 5, 5);
      } else if (top === 'glazing') {
        cg.fillStyle(0xff0a54, 1); // Glazing
        cg.fillCircle(trayX, trayY, 10);
        cg.fillCircle(trayX - 7, trayY + 3, 7);
        cg.fillCircle(trayX + 7, trayY + 2, 7);
      }
    }
  }

  updateCookieVisuals() {
    this.drawCookie();
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
      210, 
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
