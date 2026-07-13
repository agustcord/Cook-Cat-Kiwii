import Phaser from 'phaser';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.unlockedShapes = safeData.unlockedShapes || ['star'];
    this.stock = safeData.stock || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 }
    };
    this.loanRemaining = safeData.loanRemaining !== undefined ? safeData.loanRemaining : 200;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xffe5d9, 1); // Cozy soft peach background
    bgGraphics.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, 45, 'TIENDA KIWI BAKERY', {
      font: '36px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);

    this.add.text(width / 2, 85, `¡Abastece tus ingredientes antes del Día ${this.day + 1}!`, {
      font: '16px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);

    // Coins balance display
    this.coinBalanceText = this.add.text(width / 2, 125, `🪙 Monedas Disponibles: ${this.coins}`, {
      font: '24px "Outfit", sans-serif',
      fill: '#d48c47',
      fontWeight: '800'
    }).setOrigin(0.5);

    // Buyable Items Configuration
    const items = [
      // MOLDES (Unlock)
      { type: 'mold', id: 'heart', name: 'Molde Corazón', cost: 60, desc: '' },
      { type: 'mold', id: 'cat', name: 'Molde Gato', cost: 90, desc: '' },
      { type: 'mold', id: 'fish', name: 'Molde Pez', cost: 120, desc: '' },

      // MASAS (Consumables x5)
      { type: 'dough', id: 'classic', name: 'Masa Clásica', cost: 10, desc: 'Pack de 5 unidades' },
      { type: 'dough', id: 'chocolate', name: 'Masa Chocolate', cost: 15, desc: 'Pack de 5 unidades' },
      { type: 'dough', id: 'oat', name: 'Masa Avena', cost: 20, desc: 'Pack de 5 unidades' },

      // TOPPINGS (Consumables x5)
      { type: 'topping', id: 'sprinkles', name: 'Chispas Azúcar', cost: 10, desc: 'Pack de 5 unidades' },
      { type: 'topping', id: 'choco', name: 'Chispas Choco', cost: 15, desc: 'Pack de 5 unidades' },
      { type: 'topping', id: 'glazing', name: 'Glaseado Dulce', cost: 20, desc: 'Pack de 5 unidades' },

      // BEBIDAS (Consumables x5)
      { type: 'drink', id: 'coffee_beans', name: 'Granos Café', cost: 8, desc: 'Pack de 5 porciones' },
      { type: 'drink', id: 'milk', name: 'Cartón Leche', cost: 5, desc: 'Pack de 5 porciones' }
    ];

    // Layout arrangement: 4 columns (Moldes, Masas, Toppings, Bebidas)
    const columns = {
      mold: { title: 'MOLDES (P.)', x: 145 },
      dough: { title: 'MASAS (x5)', x: 390 },
      topping: { title: 'TOPPINGS (x5)', x: 635 },
      drink: { title: 'BEBIDAS (x5)', x: 880 }
    };

    // Draw Column Headers
    Object.keys(columns).forEach(key => {
      const col = columns[key];
      this.add.text(col.x, 160, col.title, {
        font: '15px "Outfit", sans-serif',
        fill: '#7f5539',
        fontWeight: '800'
      }).setOrigin(0.5);
    });

    this.buyButtons = [];

    // Categorized offsets
    const colCounters = { mold: 0, dough: 0, topping: 0, drink: 0 };

    items.forEach((item) => {
      const colKey = item.type;
      const col = columns[colKey];
      const index = colCounters[colKey]++;

      const x = col.x;
      const y = 240 + index * 95; // Adjusted starting Y to 240 to clear headers

      // Draw background card for item (wider: 230px wide to avoid overlaps)
      const card = this.add.graphics();
      card.fillStyle(0xfff1e6, 0.95);
      card.fillRoundedRect(x - 115, y - 40, 230, 80, 10);
      card.lineStyle(2, 0xddb892, 1);
      card.strokeRoundedRect(x - 115, y - 40, 230, 80, 10);

      // Draw circular background for the icon (shifted left to x - 82)
      const iconCircle = this.add.graphics();
      iconCircle.fillStyle(0xffffff, 1);
      iconCircle.fillCircle(x - 82, y, 22);
      iconCircle.lineStyle(1.5, 0xddb892, 1);
      iconCircle.strokeCircle(x - 82, y, 22);

      // Draw item icon sprite inside the circle
      let iconTexture = '';
      let targetW = 32;
      let targetH = 32;

      if (item.type === 'mold') {
        iconTexture = 'shape_' + item.id;
        targetW = 30;
        targetH = 30;
      } else if (item.type === 'dough') {
        iconTexture = 'dough_' + item.id;
        targetW = 34;
        targetH = 34;
      } else if (item.type === 'topping') {
        iconTexture = 'topping_' + item.id;
        targetW = 30;
        targetH = 30;
      } else if (item.type === 'drink') {
        iconTexture = 'drink_' + item.id;
        targetW = 30;
        targetH = 30;
      }
      
      const itemIcon = this.add.image(x - 82, y, iconTexture);
      itemIcon.setDisplaySize(targetW, targetH);

      // Render Item details (x offset shifted to x - 52, slightly smaller fonts for extra safety)
      let nameTxt, descTxt, statusTxt;
      
      if (item.type === 'mold') {
        nameTxt = this.add.text(x - 52, y - 18, item.name, {
          font: 'bold 12px "Outfit", sans-serif',
          fill: '#582f0e'
        });

        statusTxt = this.add.text(x - 52, y + 4, this.getStatusString(item), {
          font: '10px "Outfit", sans-serif',
          fill: '#7f5539',
          fontWeight: '700'
        });
      } else {
        nameTxt = this.add.text(x - 52, y - 28, item.name, {
          font: 'bold 12px "Outfit", sans-serif',
          fill: '#582f0e'
        });

        descTxt = this.add.text(x - 52, y - 10, item.desc, {
          font: '9px "Outfit", sans-serif',
          fill: '#b5838d',
          fontWeight: '600'
        });

        statusTxt = this.add.text(x - 52, y + 8, this.getStatusString(item), {
          font: '10px "Outfit", sans-serif',
          fill: '#7f5539',
          fontWeight: '700'
        });
      }

      // Buy Button container (placed to the right of text: btnX = x + 38, width = 66)
      const btnW = 66;
      const btnH = 30;
      const btnX = x + 38;
      const btnY = y - 15;

      const btnBg = this.add.graphics();
      const btnText = this.add.text(btnX + btnW / 2, btnY + btnH / 2, `🪙 ${item.cost}`, {
        font: '11px "Outfit", sans-serif',
        fill: '#fff1e6',
        fontWeight: '800'
      }).setOrigin(0.5);

      const hitZone = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0);

      const updateButtonVisuals = () => {
        btnBg.clear();
        const isBoughtMold = item.type === 'mold' && this.unlockedShapes.includes(item.id);
        
        if (isBoughtMold) {
          btnBg.fillStyle(0xa2d2ff, 1); // Pastel blue for purchased
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
          btnText.setText('LISTO');
          btnText.setColor('#ffffff');
          hitZone.disableInteractive();
        } else if (this.coins < item.cost) {
          btnBg.fillStyle(0xadb5bd, 0.5); // Greyed out
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
          btnText.setText(`🪙 ${item.cost}`);
          btnText.setColor('#fff1e6');
          hitZone.setInteractive({ useHandCursor: false });
        } else {
          btnBg.fillStyle(0x7f5539, 1); // Normal brown buy button
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
          btnText.setText(`🪙 ${item.cost}`);
          btnText.setColor('#fff1e6');
          hitZone.setInteractive({ useHandCursor: true });
        }
        statusTxt.setText(this.getStatusString(item));
      };

      // Set up click event
      hitZone.on('pointerdown', () => {
        if (this.coins >= item.cost) {
          this.coins -= item.cost;
          this.coinBalanceText.setText(`🪙 Monedas Disponibles: ${this.coins}`);

          if (item.type === 'mold') {
            this.unlockedShapes.push(item.id);
          } else {
            this.stock[item.type][item.id] += 5;
          }

          // Visual pop effect
          this.tweens.add({
            targets: [nameTxt, statusTxt, itemIcon],
            scale: 1.1,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeInOut'
          });

          this.showFeedback(`+5 ${item.name} 🛒`, x, y - 50, '#38b000');

          // Update all buttons in case some are now unaffordable
          this.buyButtons.forEach(btnUpdate => btnUpdate());
        }
      });

      hitZone.on('pointerover', () => {
        const isBoughtMold = item.type === 'mold' && this.unlockedShapes.includes(item.id);
        if (!isBoughtMold && this.coins >= item.cost) {
          btnBg.clear();
          btnBg.fillStyle(0x9c6644, 1); // Lighter brown on hover
          btnBg.fillRoundedRect(btnX - 2, btnY - 2, btnW + 4, btnH + 4, 10);
          btnText.setScale(1.05);
        }
      });

      hitZone.on('pointerout', () => {
        updateButtonVisuals();
        btnText.setScale(1);
      });

      this.buyButtons.push(updateButtonVisuals);
      updateButtonVisuals();
    });

    // START NEXT DAY BUTTON
    const startBtnW = 260;
    const startBtnH = 50;
    const startBtnX = width / 2 - startBtnW / 2;
    const startBtnY = height - 85;

    const startBtnBg = this.add.graphics();
    startBtnBg.fillStyle(0x38b000, 1); // Lush green
    startBtnBg.fillRoundedRect(startBtnX, startBtnY, startBtnW, startBtnH, 12);

    const startBtnText = this.add.text(width / 2, startBtnY + startBtnH / 2, 'EMPEZAR SIGUIENTE DÍA ☕', {
      font: '16px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);

    const startZone = this.add.rectangle(width / 2, startBtnY + startBtnH / 2, startBtnW, startBtnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    startZone.on('pointerdown', () => {
      // Start GameScene for the next day
      this.scene.start('GameScene', {
        day: this.day + 1,
        coins: this.coins,
        unlockedShapes: this.unlockedShapes,
        stock: this.stock,
        loanRemaining: this.loanRemaining
      });
    });

    startZone.on('pointerover', () => {
      startBtnBg.clear();
      startBtnBg.fillStyle(0x4ad611, 1); // Brighter green on hover
      startBtnBg.fillRoundedRect(startBtnX - 4, startBtnY - 2, startBtnW + 8, startBtnH + 4, 14);
      startBtnText.setScale(1.05);
    });

    startZone.on('pointerout', () => {
      startBtnBg.clear();
      startBtnBg.fillStyle(0x38b000, 1);
      startBtnBg.fillRoundedRect(startBtnX, startBtnY, startBtnW, startBtnH, 12);
      startBtnText.setScale(1);
    });
  }

  getStatusString(item) {
    if (item.type === 'mold') {
      return this.unlockedShapes.includes(item.id) ? 'Estado: Desbloqueado' : 'Estado: Bloqueado';
    } else {
      const qty = this.stock[item.type][item.id];
      return `Stock actual: ${qty} u.`;
    }
  }

  showFeedback(text, x, y, color) {
    const feedback = this.add.text(x, y, text, {
      font: '15px "Outfit", sans-serif',
      fill: color,
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: feedback,
      y: y - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.out',
      onComplete: () => {
        feedback.destroy();
      }
    });
  }
}
