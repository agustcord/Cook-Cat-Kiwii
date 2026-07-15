import Phaser from 'phaser';
import SoundEffects from '../game/SoundEffects.js';

export default class SummaryScene extends Phaser.Scene {
  constructor() {
    super('SummaryScene');
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.meta = safeData.meta || 100;
    this.loanRemaining = safeData.loanRemaining !== undefined ? safeData.loanRemaining : 200;

    // Preserved start-of-day state for re-tries
    this.coinsAtStart = safeData.coinsAtStart || 0;
    this.loanRemainingAtStart = safeData.loanRemainingAtStart !== undefined ? safeData.loanRemainingAtStart : 200;
    this.unlockedShapesAtStart = safeData.unlockedShapesAtStart || ['star'];
    this.stockAtStart = safeData.stockAtStart || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 },
      drink: { coffee_beans: 0, milk: 0 }
    };

    // Current state to carry over
    this.unlockedShapes = safeData.unlockedShapes || ['star'];
    this.stock = safeData.stock || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 },
      drink: { coffee_beans: 0, milk: 0 }
    };

    // 1. Calculate Economy Deductions
    const rentValues = { 1: 20, 2: 20, 3: 20, 4: 20 };
    const maintenanceValues = { 1: 15, 2: 20, 3: 25, 4: 30 };
    const loanPayments = { 1: 20, 2: 35, 3: 60, 4: 85 };

    this.rent = rentValues[this.day] || 20;
    this.maintenance = maintenanceValues[this.day] || 20;
    this.loanPayment = loanPayments[this.day] || 0;

    this.totalExpenses = this.rent + this.maintenance + this.loanPayment;
    this.netCoins = this.coins - this.totalExpenses;
    
    // Remaining debt updated after paying this day's cuota
    this.updatedLoanRemaining = Math.max(0, this.loanRemaining - this.loanPayment);

    // Hard bankruptcy condition
    this.isBankrupt = this.netCoins < 0;
  }

  create() {
    // Play appropriate sound when entering summary
    if (this.isBankrupt) {
      SoundEffects.playAngry();
    } else {
      SoundEffects.playCoin();
    }
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Warm soft peach color
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xffe5d9, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Title depending on bankruptcy status
    const titleText = this.isBankrupt ? '¡DÍA FALLIDO!' : `DÍA ${this.day} COMPLETADO`;
    const titleColor = this.isBankrupt ? '#d90429' : '#38b000';

    this.add.text(width / 2, 45, titleText, {
      font: '36px "Outfit", sans-serif',
      fill: titleColor,
      fontWeight: '800'
    }).setOrigin(0.5);

    this.add.text(width / 2, 85, 'Balance de Cuentas y Gastos Diarios', {
      font: '15px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);

    // --- RECEIPT/BILL CARD VISUALS ---
    const cardX = width / 2 - 200;
    const cardY = 115;
    const cardW = 400;
    const cardH = 260;

    const receipt = this.add.graphics();
    // Paper background
    receipt.fillStyle(0xfff1e6, 0.95);
    receipt.fillRoundedRect(cardX, cardY, cardW, cardH, 12);
    // Board outline
    receipt.lineStyle(2, 0xddb892, 1);
    receipt.strokeRoundedRect(cardX, cardY, cardW, cardH, 12);

    // Invoice decorative lines
    receipt.lineStyle(1.5, 0xddb892, 0.5);
    receipt.lineBetween(cardX + 20, cardY + 50, cardX + cardW - 20, cardY + 50);
    receipt.lineBetween(cardX + 20, cardY + 185, cardX + cardW - 20, cardY + 185);

    // Receipt header
    this.add.text(width / 2, cardY + 25, 'DETALLE DE FACTURACIÓN', {
      font: '14px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Invoice items details
    const textStyleLeft = { font: '14px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '600' };
    const textStyleRight = { font: '14px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '800' };

    // Item 1: Revenue
    this.add.text(cardX + 30, cardY + 70, 'Ingresos por Ventas (Caja):', textStyleLeft);
    this.add.text(cardX + cardW - 30, cardY + 70, `+${this.coins} 🪙`, textStyleRight).setOrigin(1, 0);

    // Item 2: Rent
    this.add.text(cardX + 30, cardY + 100, 'Alquiler del Local (Fijo):', textStyleLeft);
    this.add.text(cardX + cardW - 30, cardY + 100, `-${this.rent} 🪙`, textStyleRight).setOrigin(1, 0);

    // Item 3: Maintenance/Utilities
    this.add.text(cardX + 30, cardY + 130, 'Servicios de Luz/Agua/Gas:', textStyleLeft);
    this.add.text(cardX + cardW - 30, cardY + 130, `-${this.maintenance} 🪙`, textStyleRight).setOrigin(1, 0);

    // Item 4: Loan installment
    this.add.text(cardX + 30, cardY + 160, 'Cuota del Préstamo Bancario:', textStyleLeft);
    this.add.text(cardX + cardW - 30, cardY + 160, `-${this.loanPayment} 🪙`, textStyleRight).setOrigin(1, 0);

    // Item 5: Net Balance (Grand Total)
    this.add.text(cardX + 30, cardY + 200, 'SALDO NETO RESTANTE:', {
      font: '16px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800'
    });
    
    const balanceColor = this.netCoins >= 0 ? '#38b000' : '#d90429';
    this.add.text(cardX + cardW - 30, cardY + 200, `${this.netCoins} 🪙`, {
      font: '18px "Outfit", sans-serif',
      fill: balanceColor,
      fontWeight: '800'
    }).setOrigin(1, 0);

    // Debt status under card
    this.add.text(width / 2, cardY + 240, `Préstamo restante al banco: 🪙 ${this.updatedLoanRemaining} (Inicial: 200)`, {
      font: '11px "Outfit", sans-serif',
      fill: '#b5838d',
      fontWeight: '700'
    }).setOrigin(0.5);

    // --- DECISION FLOW & ACTIONS ---
    let btnTextString = '';
    let btnColor = 0x7f5539; // Brown by default
    let btnHoverColor = 0x9c6644;
    let nextSceneCallback = null;

    if (this.isBankrupt) {
      // 1. BANKRUPTCY (Hard loss)
      btnTextString = 'DECLARAR QUIEBRA 😿';
      btnColor = 0xd90429;
      btnHoverColor = 0xef233c;
      nextSceneCallback = () => {
        this.scene.start('GameOverScene');
      };
    } else if (this.updatedLoanRemaining <= 0) {
      // 2. LOAN PAID (Victory!)
      btnTextString = 'VICTORIA FINANCIERA 👑🎉';
      btnColor = 0x38b000;
      btnHoverColor = 0x4cc9f0;
      nextSceneCallback = () => {
        this.scene.start('VictoryScene', { coins: this.netCoins });
      };
    } else {
      // 3. SUCCESSFUL DAY PROGRESSION
      btnTextString = 'IR A LA TIENDA 🛒';
      nextSceneCallback = () => {
        this.scene.start('ShopScene', {
          day: this.day,
          coins: this.netCoins, // Net coins carried over to spend in shop
          unlockedShapes: this.unlockedShapes,
          stock: this.stock,
          loanRemaining: this.updatedLoanRemaining // Propagate updated debt
        });
      };
    }

    // Buttons Container
    const btnW = 260;
    const btnH = 54;
    const btnX = width / 2 - btnW / 2;
    const btnY = height - 120;

    // Retry / Repeat day button if player hasn't bankrupted but wants to retry for more profit
    if (!this.isBankrupt && this.coins < this.meta) {
      // Prompt warning about low profit
      this.add.text(width / 2, btnY - 20, '⚠️ Ganancias bajas. Puedes reintentar el día para ahorrar más.', {
        font: '12px "Outfit", sans-serif',
        fill: '#d90429',
        fontWeight: '700'
      }).setOrigin(0.5);
    }

    const actionBtnBg = this.add.graphics();
    actionBtnBg.fillStyle(btnColor, 1);
    actionBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);

    const btnText = this.add.text(width / 2, btnY + btnH / 2, btnTextString, {
      font: '16px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', () => {
      SoundEffects.playClick();
      nextSceneCallback();
    });

    actionZone.on('pointerover', () => {
      actionBtnBg.clear();
      actionBtnBg.fillStyle(btnHoverColor, 1);
      actionBtnBg.fillRoundedRect(btnX - 4, btnY - 2, btnW + 8, btnH + 4, 14);
      btnText.setScale(1.05);
    });

    actionZone.on('pointerout', () => {
      actionBtnBg.clear();
      actionBtnBg.fillStyle(btnColor, 1);
      actionBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      btnText.setScale(1);
    });

    // Optional retry button for non-bankruptcy state to optimize money
    if (!this.isBankrupt) {
      const retryText = this.add.text(width / 2, height - 30, 'O REINTENTAR EL DÍA 🔄', {
        font: '12px "Outfit", sans-serif',
        fill: '#7f5539',
        fontWeight: '800'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      retryText.on('pointerdown', () => {
        SoundEffects.playClick();
        this.scene.start('GameScene', {
          day: this.day,
          coins: this.coinsAtStart,
          loanRemaining: this.loanRemainingAtStart,
          unlockedShapes: this.unlockedShapesAtStart,
          stock: this.stockAtStart
        });
      });

      retryText.on('pointerover', () => {
        retryText.setColor('#d90429');
      });

      retryText.on('pointerout', () => {
        retryText.setColor('#7f5539');
      });
    }
  }
}
