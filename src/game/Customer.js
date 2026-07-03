import Phaser from 'phaser';

export default class Customer {
  constructor(scene, x, y, dayConfig, onTimeoutCallback) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    // Active recipe list for the day
    const recipes = dayConfig.recipes || [];
    this.recipe = recipes[Math.floor(Math.random() * recipes.length)];
    
    // Patience
    this.maxPatience = dayConfig.patienceTime || 30; // seconds
    this.patience = this.maxPatience;
    this.onTimeoutCallback = onTimeoutCallback;
    this.isActive = true;

    // Visual elements container
    this.container = this.scene.add.container(x, y);

    this.createVisuals();
  }

  createVisuals() {
    // 1. Draw customer character (simple geometric shape representing a human client)
    const customerBg = this.scene.add.graphics();
    customerBg.fillStyle(0x70d6ff, 1); // Blue pastel human silhouette base
    customerBg.fillRoundedRect(-40, 20, 80, 100, 15); // Torso
    customerBg.fillStyle(0xffd7ba, 1); // Skin tone head
    customerBg.fillCircle(0, -10, 30);
    this.container.add(customerBg);

    // 2. Patience Bar (Background)
    this.patienceBg = this.scene.add.graphics();
    this.patienceBg.fillStyle(0xe0e0e0, 1);
    this.patienceBg.fillRoundedRect(-50, -80, 100, 12, 4);
    this.container.add(this.patienceBg);

    // 3. Patience Bar (Active Fill)
    this.patienceFill = this.scene.add.graphics();
    this.updatePatienceBar();
    this.container.add(this.patienceFill);

    // 4. Thought Bubble
    this.bubbleBg = this.scene.add.graphics();
    this.bubbleBg.fillStyle(0xffffff, 1);
    this.bubbleBg.lineStyle(3, 0x582f0e, 1);
    // Draw bubble tail and rectangle
    this.bubbleBg.fillRoundedRect(-85, -190, 170, 90, 15);
    this.bubbleBg.strokeRoundedRect(-85, -190, 170, 90, 15);
    
    // Bubble pointer tail
    this.bubbleBg.fillStyle(0xffffff, 1);
    this.bubbleBg.fillTriangle(0, -95, -10, -105, 10, -105);
    this.bubbleBg.lineBetween(-10, -105, 0, -95);
    this.bubbleBg.lineBetween(10, -105, 0, -95);
    
    this.container.add(this.bubbleBg);

    // 5. Order Contents (Placeholders inside bubble)
    // Draw representations of required base, shape, and topping
    this.orderVisuals = this.scene.add.graphics();
    this.drawOrderIcons();
    this.container.add(this.orderVisuals);
  }

  drawOrderIcons() {
    const ov = this.orderVisuals;
    ov.clear();

    const recipe = this.recipe;
    if (!recipe) return;

    // Draw base dough color box
    let baseColor = 0xffffff;
    if (recipe.base === 'classic') baseColor = 0xf5ebe0;
    else if (recipe.base === 'chocolate') baseColor = 0x4f1200;
    else if (recipe.base === 'oat') baseColor = 0xd5bdaf;

    ov.fillStyle(baseColor, 1);
    ov.lineStyle(1.5, 0x000000, 1);
    ov.fillRect(-60, -170, 30, 20);
    ov.strokeRect(-60, -170, 30, 20);

    // Draw cutter shape outline
    ov.lineStyle(2, 0x582f0e, 1);
    if (recipe.shape === 'star') {
      ov.strokeCircle(-10, -160, 10); // Star placeholder circle
    } else if (recipe.shape === 'heart') {
      ov.strokeRect(-20, -170, 20, 20); // Heart placeholder square
    } else if (recipe.shape === 'cat') {
      ov.strokeCircle(-10, -160, 12); // Cat placeholder circle
    } else if (recipe.shape === 'bone') {
      ov.strokeRect(-20, -170, 20, 10); // Bone placeholder rect
    }

    // Draw topping indicator
    let toppingColor = 0x000000;
    if (recipe.toppings && recipe.toppings[0]) {
      const top = recipe.toppings[0];
      if (top === 'sprinkles') toppingColor = 0xff70a6; // Pink sprinkles
      else if (top === 'kiwi') toppingColor = 0x38b000; // Kiwi green
      else if (top === 'glazing') toppingColor = 0xff0a54; // Bright glazing pink
      
      ov.fillStyle(toppingColor, 1);
      ov.fillCircle(40, -160, 8);
    }
  }

  updatePatienceBar() {
    this.patienceFill.clear();
    const ratio = this.patience / this.maxPatience;
    
    // Color transitions: Green -> Yellow -> Red
    let color = 0x38b000; // Green
    if (ratio < 0.25) color = 0xd90429; // Red
    else if (ratio < 0.6) color = 0xffb703; // Yellow

    this.patienceFill.fillStyle(color, 1);
    this.patienceFill.fillRoundedRect(-48, -78, 96 * ratio, 8, 3);
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
