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
    this.patienceBg.fillRoundedRect(-50, -168, 100, 12, 4);
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
    this.bubbleBg.fillRoundedRect(-85, -145, 170, 90, 15);
    this.bubbleBg.strokeRoundedRect(-85, -145, 170, 90, 15);
    
    // Bubble pointer tail
    this.bubbleBg.fillStyle(0xffffff, 1);
    this.bubbleBg.fillTriangle(0, -45, -10, -55, 10, -55);
    this.bubbleBg.lineBetween(-10, -55, 0, -45);
    this.bubbleBg.lineBetween(10, -55, 0, -45);
    
    this.container.add(this.bubbleBg);

    // 5. Order Contents (Placeholders inside bubble)
    this.orderVisuals = this.scene.add.graphics();
    this.drawOrderIcons();
    this.container.add(this.orderVisuals);
  }

  drawOrderIcons() {
    const ov = this.orderVisuals;
    ov.clear();

    const recipe = this.recipe;
    if (!recipe) return;

    // Center of the thought bubble
    const cx = 0;
    const cy = -100;

    // Determine base dough color
    let baseColor = 0xf5ebe0; // Classic
    if (recipe.base === 'chocolate') baseColor = 0x4f1200;
    else if (recipe.base === 'oat') baseColor = 0xd5bdaf;

    ov.fillStyle(baseColor, 1);
    ov.lineStyle(2, 0x352f44, 1); // Soft dark outlines

    // Draw Cookie shape
    if (recipe.shape === 'star') {
      // 5-pointed star
      const spikes = 5;
      const outerRadius = 24;
      const innerRadius = 10;
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / spikes;
      
      ov.beginPath();
      ov.moveTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      for (let i = 0; i < spikes * 2; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const x = cx + Math.cos(rot + i * step) * r;
        const y = cy + Math.sin(rot + i * step) * r;
        ov.lineTo(x, y);
      }
      ov.closePath();
      ov.fillPath();
      ov.strokePath();
    } else if (recipe.shape === 'heart') {
      // Heart using circles and triangle
      ov.fillCircle(cx - 10, cy - 6, 12);
      ov.fillCircle(cx + 10, cy - 6, 12);
      ov.beginPath();
      ov.moveTo(cx - 21.5, cy - 2);
      ov.lineTo(cx, cy + 18);
      ov.lineTo(cx + 21.5, cy - 2);
      ov.closePath();
      ov.fillPath();

      ov.strokeCircle(cx - 10, cy - 6, 12);
      ov.strokeCircle(cx + 10, cy - 6, 12);
      ov.beginPath();
      ov.moveTo(cx - 21.5, cy - 2);
      ov.lineTo(cx, cy + 18);
      ov.lineTo(cx + 21.5, cy - 2);
      ov.strokePath();

      // Mask center
      ov.fillStyle(baseColor, 1);
      ov.fillCircle(cx - 10, cy - 6, 10.5);
      ov.fillCircle(cx + 10, cy - 6, 10.5);
      ov.beginPath();
      ov.moveTo(cx - 19, cy - 2);
      ov.lineTo(cx, cy + 15);
      ov.lineTo(cx + 19, cy - 2);
      ov.closePath();
      ov.fillPath();
    } else if (recipe.shape === 'cat') {
      // Cat head outline
      // Left Ear
      ov.beginPath();
      ov.moveTo(cx - 18, cy - 10);
      ov.lineTo(cx - 24, cy - 28);
      ov.lineTo(cx - 4, cy - 18);
      ov.closePath();
      ov.fillPath();
      ov.strokePath();

      // Right Ear
      ov.beginPath();
      ov.moveTo(cx + 18, cy - 10);
      ov.lineTo(cx + 24, cy - 28);
      ov.lineTo(cx + 4, cy - 18);
      ov.closePath();
      ov.fillPath();
      ov.strokePath();

      // Main head
      ov.fillCircle(cx, cy - 5, 22);
      ov.strokeCircle(cx, cy - 5, 22);
    } else if (recipe.shape === 'bone') {
      // Bone
      ov.fillCircle(cx - 20, cy - 10, 8);
      ov.strokeCircle(cx - 20, cy - 10, 8);
      ov.fillCircle(cx - 20, cy + 10, 8);
      ov.strokeCircle(cx - 20, cy + 10, 8);

      ov.fillCircle(cx + 20, cy - 10, 8);
      ov.strokeCircle(cx + 20, cy - 10, 8);
      ov.fillCircle(cx + 20, cy + 10, 8);
      ov.strokeCircle(cx + 20, cy + 10, 8);

      ov.fillRect(cx - 20, cy - 8, 40, 16);
      ov.strokeRect(cx - 20, cy - 8, 40, 16);
      
      // Overlap fill
      ov.fillStyle(baseColor, 1);
      ov.fillRect(cx - 18, cy - 7, 36, 14);
    }

    // Draw topping on top
    if (recipe.toppings && recipe.toppings[0]) {
      const top = recipe.toppings[0];
      if (top === 'sprinkles') {
        ov.fillStyle(0xff70a6, 1); // Pink
        ov.fillCircle(cx - 8, cy - 5, 3);
        ov.fillStyle(0xffb703, 1); // Yellow
        ov.fillCircle(cx + 8, cy + 5, 3);
        ov.fillStyle(0x00f5d4, 1); // Blue-green
        ov.fillCircle(cx, cy - 12, 3);
      } else if (top === 'choco') {
        ov.fillStyle(0x3d0c00, 1); // Chocolate Chips
        ov.fillRect(cx - 6, cy - 8, 5, 5);
        ov.fillRect(cx + 5, cy + 3, 5, 5);
        ov.fillRect(cx - 3, cy + 6, 5, 5);
      } else if (top === 'glazing') {
        ov.fillStyle(0xff0a54, 1); // Glazing
        ov.fillCircle(cx, cy, 10);
        ov.fillCircle(cx - 7, cy + 3, 7);
        ov.fillCircle(cx + 7, cy + 2, 7);
      }
    }
  }

  updatePatienceBar() {
    this.patienceFill.clear();
    const ratio = Math.max(0, Math.min(1, this.patience / this.maxPatience));
    
    // Color transitions: Green -> Yellow -> Red
    let color = 0x38b000; // Green
    if (ratio < 0.25) color = 0xd90429; // Red
    else if (ratio < 0.6) color = 0xffb703; // Yellow

    this.patienceFill.fillStyle(color, 1);
    this.patienceFill.fillRoundedRect(-48, -166, 96 * ratio, 8, 3);
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
