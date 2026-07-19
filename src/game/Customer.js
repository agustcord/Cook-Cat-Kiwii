import Phaser from 'phaser';

export default class Customer {
  constructor(scene, x, y, dayConfig, onTimeoutCallback, customerId, assignedRecipe, forcedQuantity, requestedDrink) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.customerId = customerId || 1;
    
    // Use pre-assigned recipe from the shuffled sequence (allows null for drink-only orders)
    this.recipe = assignedRecipe !== undefined ? assignedRecipe : (dayConfig.recipes ? dayConfig.recipes[Math.floor(Math.random() * dayConfig.recipes.length)] : null);
    this.requestedDrink = requestedDrink || null;
    
    // Roll for mood (bad day / rush) based on current day
    const day = this.scene.day || 1;
    const badDayProbabilities = { 1: 0.10, 2: 0.30, 3: 0.45, 4: 0.65 };
    const badDayChance = badDayProbabilities[day] || 0.50;
    this.isBadDay = Math.random() < badDayChance;

    // Set requested quantity
    if (forcedQuantity !== undefined) {
      this.requestedQuantity = forcedQuantity;
    } else {
      const capD = Math.min(5, 1 + day);
      const QUANTITY_RANGES = {
        1: { min: 1, max: 3 }, // Dormilón
        2: { min: 2, max: 4 }, // Oficinista
        3: { min: 3, max: 5 }, // Abuelita
        4: { min: 1, max: 2 }, // Estudiante
        5: { min: 2, max: 5 }  // Gamer
      };
      const range = QUANTITY_RANGES[this.customerId] || { min: 1, max: 2 };
      const rawQuantity = Phaser.Math.Between(range.min, range.max);
      this.requestedQuantity = Math.max(1, Math.min(rawQuantity, capD));
    }
    
    this.receivedCookiesCount = 0;
    this.acceptedCookies = [];

    // Patience multipliers based on customerId (Personalities)
    const MULTIPLIERS = {
      1: 1.20,  // Dormilón (Muy Paciente)
      2: 0.75,  // Oficinista (Impaciente)
      3: 1.40,  // Abuelita (Súper Paciente)
      4: 1.00,  // Estudiante (Estándar)
      5: 0.60   // Gamer (Muy Impaciente / Apurado)
    };
    let multiplier = MULTIPLIERS[this.customerId] || 1.00;
    if (this.isBadDay) {
      multiplier *= 0.80; // 20% reduction in patience on a bad day
    }

    // Patience scaled by character personality, mood, and quantity requested
    let basePatience = (dayConfig.patienceTime || 30) * multiplier;
    
    // Scale patience by quantity (more cookies = more patience) and add a bonus if they ordered a drink!
    const quantityMultipliers = { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.8, 5: 2.0 };
    let qtyMult = quantityMultipliers[this.requestedQuantity] || 1.0;
    if (this.requestedDrink) {
      qtyMult += 0.3; // Give 30% more time to prepare the drink as well!
    }
    
    this.maxPatience = basePatience * qtyMult;
    this.patience = this.maxPatience;
    this.onTimeoutCallback = onTimeoutCallback;
    this.isActive = true;

    // Tolerance thresholds based on customerId (Personalities)
    const TOLERANCE_THRESHOLDS = {
      1: 70,  // Dormilón (70% de similitud mínima)
      2: 90,  // Oficinista (90% de similitud mínima)
      3: 50,  // Abuelita (50% de similitud mínima)
      4: 80,  // Estudiante (80% de similitud mínima)
      5: 100  // Gamer (100% de similitud mínima)
    };
    let threshold = TOLERANCE_THRESHOLDS[this.customerId] || 80;
    if (this.isBadDay && this.customerId !== 5) {
      threshold += 10; // +10% more demanding on a bad day (except Gamer)
    }
    this.toleranceThreshold = threshold;

    this.container = this.scene.add.container(x, y);
    if (this.scene.customerContainer) {
      this.scene.customerContainer.add(this.container);
    }

    this.createVisuals();
  }

  createVisuals() {
    // 1. Draw customer character (uses the preloaded PNG sprite)
    this.sprite = this.scene.add.image(0, 75, 'customer_' + this.customerId);
    this.sprite.setDisplaySize(338, 338);
    this.container.add(this.sprite);

    // 2. Patience Bar (Background)
    this.patienceBarBg = this.scene.add.graphics();
    this.patienceBarBg.fillStyle(0xe0e0e0, 1);
    this.patienceBarBg.fillRoundedRect(-94, -315, 188, 23, 8);
    this.container.add(this.patienceBarBg);

    // 3. Patience Bar (Active Fill)
    this.patienceBar = this.scene.add.graphics();
    this.container.add(this.patienceBar);

    // Patience Text (Countdown)
    this.patienceText = this.scene.add.text(0, -304, '', {
      font: '17px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800',
      stroke: '#352f44',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.container.add(this.patienceText);

    this.updatePatienceBar();

    // 4. Thought Bubble (Dynamic width if drink is requested)
    this.bubbleBg = this.scene.add.graphics();
    this.bubbleBg.fillStyle(0xffffff, 1);
    this.bubbleBg.lineStyle(6, 0x582f0e, 1);
    
    let bubbleW = 319;
    if (this.requestedQuantity === 0) {
      bubbleW = 225; // Smaller bubble for drink-only
    } else if (this.requestedDrink) {
      bubbleW = 431; // Wider bubble for cookie + drink
    }
    const bubbleHalf = bubbleW / 2;
    this.bubbleBg.fillRoundedRect(-bubbleHalf, -272, bubbleW, 169, 28);
    this.bubbleBg.strokeRoundedRect(-bubbleHalf, -272, bubbleW, 169, 28);
    
    // Bubble pointer tail
    this.bubbleBg.fillStyle(0xffffff, 1);
    this.bubbleBg.fillTriangle(0, -84, -19, -103, 19, -103);
    this.bubbleBg.lineBetween(-19, -103, 0, -84);
    this.bubbleBg.lineBetween(19, -103, 0, -84);
    
    this.container.add(this.bubbleBg);

    // 5. Order Contents (Image representing the correctly baked recipe)
    this.drawOrderImage();

    // 6. Delivery progress text
    let prepText = '';
    if (this.requestedQuantity === 0) {
      let drinkName = 'Café';
      if (this.requestedDrink === 'milk') drinkName = 'Leche';
      else if (this.requestedDrink === 'coffee_milk') drinkName = 'Café c/Leche';
      prepText = `Pedido: ${drinkName}`;
    } else {
      prepText = `Pedido: 0 / ${this.requestedQuantity}`;
      if (this.requestedDrink) {
        let drinkName = 'Café';
        if (this.requestedDrink === 'milk') drinkName = 'Leche';
        else if (this.requestedDrink === 'coffee_milk') drinkName = 'Café c/Leche';
        prepText += ` + ${drinkName}`;
      }
    }
    this.progressText = this.scene.add.text(0, 263, prepText, {
      font: '23px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800',
      backgroundColor: '#f5ebe0',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    this.container.add(this.progressText);
  }

  drawOrderImage() {
    const cy = -188;

    if (this.requestedQuantity === 0) {
      // Drink-only order: draw only the drink, centered in the thought bubble
      if (this.requestedDrink) {
        let drinkTexture = 'order_beverage_coffee';
        if (this.requestedDrink === 'milk') drinkTexture = 'order_beverage_milk';
        else if (this.requestedDrink === 'coffee_milk') drinkTexture = 'order_beverage_coffee_milk';

        const drinkSprite = this.scene.add.image(0, cy, drinkTexture);
        drinkSprite.setDisplaySize(103, 103);
        this.container.add(drinkSprite);
      }
      return;
    }

    const recipe = this.recipe;
    if (!recipe) return;

    // Center of the thought bubble
    const cx = this.requestedDrink ? -75 : 0;

    // Construct key name matching our preloaded baked cookie assets
    let key = `cookie_${recipe.shape}_${recipe.base}_baked`;
    if (recipe.toppings && recipe.toppings[0]) {
      key += `_${recipe.toppings[0]}`;
    }

    // Add cookie image to container
    const orderSprite = this.scene.add.image(cx, cy, key);
    orderSprite.setDisplaySize(113, 113);
    this.container.add(orderSprite);

    // If quantity is more than 1, draw a small xQ badge at the bottom-right of the cookie image
    if (this.requestedQuantity > 1) {
      // Draw a small background circle for the badge
      const badgeBg = this.scene.add.graphics();
      badgeBg.fillStyle(0xd90429, 1); // Red badge
      badgeBg.lineStyle(3, 0xffffff, 1);
      badgeBg.fillCircle(cx + 38, cy + 38, 21);
      badgeBg.strokeCircle(cx + 38, cy + 38, 21);
      this.container.add(badgeBg);

      // Draw the text
      const badgeText = this.scene.add.text(cx + 38, cy + 38, `x${this.requestedQuantity}`, {
        font: '17px "Outfit", sans-serif',
        fill: '#ffffff',
        fontWeight: '800'
      }).setOrigin(0.5);
      this.container.add(badgeText);
    }

    // Draw the requested drink if applicable
    if (this.requestedDrink) {
      // Draw a "+" sign in the middle
      const plusText = this.scene.add.text(0, cy, '+', {
        font: '30px "Outfit", sans-serif',
        fill: '#582f0e',
        fontWeight: '800'
      }).setOrigin(0.5);
      this.container.add(plusText);

      // Determine drink texture key
      let drinkTexture = 'order_beverage_coffee';
      if (this.requestedDrink === 'milk') drinkTexture = 'order_beverage_milk';
      else if (this.requestedDrink === 'coffee_milk') drinkTexture = 'order_beverage_coffee_milk';

      const drinkSprite = this.scene.add.image(84, cy, drinkTexture);
      drinkSprite.setDisplaySize(94, 94);
      this.container.add(drinkSprite);
    }
  }

  updateProgress(newCount) {
    this.receivedCookiesCount = newCount;
    if (this.progressText) {
      let prepText = '';
      if (this.requestedQuantity === 0) {
        let drinkName = 'Café';
        if (this.requestedDrink === 'milk') drinkName = 'Leche';
        else if (this.requestedDrink === 'coffee_milk') drinkName = 'Café c/Leche';
        prepText = `Pedido: ${drinkName}`;
      } else {
        prepText = `Pedido: ${this.receivedCookiesCount} / ${this.requestedQuantity}`;
        if (this.requestedDrink) {
          let drinkName = 'Café';
          if (this.requestedDrink === 'milk') drinkName = 'Leche';
          else if (this.requestedDrink === 'coffee_milk') drinkName = 'Café c/Leche';
          prepText += ` + ${drinkName}`;
        }
      }
      this.progressText.setText(prepText);
    }
  }

  updatePatienceBar() {
    this.patienceBar.clear();
    const ratio = Math.max(0, Math.min(1, this.patience / this.maxPatience));
    
    // Color transitions: Green -> Yellow -> Red
    let color = 0x38b000; // Green
    if (ratio < 0.25) color = 0xd90429; // Red
    else if (ratio < 0.6) color = 0xffb703; // Yellow

    this.patienceBar.fillStyle(color, 1);
    this.patienceBar.fillRoundedRect(-90, -311, 180 * ratio, 15, 6);

    if (this.patienceText) {
      const rushText = this.isBadDay ? ' ⚡' : '';
      this.patienceText.setText(`${Math.ceil(this.patience)}s${rushText}`);
    }
  }

  update(time, delta) {
    if (!this.isActive) return;

    // Patience decreases
    this.patience -= delta / 1000;
    this.updatePatienceBar();

    if (this.patience <= 0) {
      this.patience = 0;
      this.isActive = false;
      if (this.onTimeoutCallback) {
        this.onTimeoutCallback();
      }
    }
  }

  destroy() {
    this.isActive = false;
    this.container.destroy();
  }
}
