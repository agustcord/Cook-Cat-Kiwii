export default class Cookie {
  constructor() {
    this.base = null;         // 'classic', 'chocolate', 'oat'
    this.shape = null;        // 'star', 'heart', 'cat', 'bone'
    this.bakedState = 'raw';  // 'raw', 'baked', 'burnt'
    this.toppings = [];       // Array of strings: 'sprinkles', 'kiwi', 'glazing'
  }

  reset() {
    this.base = null;
    this.shape = null;
    this.bakedState = 'raw';
    this.toppings = [];
  }

  // Returns true if the cookie can be delivered (must have base and shape)
  isDeliverable() {
    return this.base !== null && this.shape !== null;
  }

  // Check how many attributes match a target recipe
  getMatchScore(targetRecipe) {
    if (!this.isDeliverable()) return 0;
    
    let matches = 0;
    
    // 1. Base check
    if (this.base === targetRecipe.base) matches++;
    
    // 2. Shape check
    if (this.shape === targetRecipe.shape) matches++;

    // 3. Baking check (must be 'baked' - not raw or burnt)
    if (this.bakedState === 'baked') matches++;
    
    // 4. Toppings check
    // We check if the toppings in target are all present in cookie
    const targetToppings = targetRecipe.toppings || [];
    let toppingsMatch = true;
    
    // For MVP, we compare arrays
    if (targetToppings.length === this.toppings.length) {
      for (let t of targetToppings) {
        if (!this.toppings.includes(t)) {
          toppingsMatch = false;
          break;
        }
      }
    } else {
      toppingsMatch = false;
    }
    
    if (toppingsMatch) matches++;

    return matches; // Max score: 4 (Base, Shape, Baked, Toppings)
  }

  getSimilarityPercentage(targetRecipe) {
    if (!this.isDeliverable()) return 0;

    let score = 0;

    // 1. Masa (Base) - Max 25%
    if (this.base === targetRecipe.base) {
      score += 25;
    }

    // 2. Forma (Shape) - Max 25%
    if (this.shape === targetRecipe.shape) {
      score += 25;
    }

    // 3. Cocción (Baked State) - Max 30%
    if (this.bakedState === 'baked') {
      score += 30;
    } else if (this.bakedState === 'raw') {
      score += 10;
    } else if (this.bakedState === 'burnt') {
      score += 0;
    }

    // 4. Decoración (Toppings) - Max 20%
    const targetToppings = targetRecipe.toppings || [];
    const hasTargetTopping = targetToppings.length > 0;
    const hasCookieTopping = this.toppings.length > 0;

    if (!hasTargetTopping) {
      // Recipe wants no toppings
      if (!hasCookieTopping) {
        score += 20; // Correct by omission
      } else {
        score += 5;  // Excess toppings
      }
    } else {
      // Recipe wants toppings
      if (!hasCookieTopping) {
        score += 0;   // Missing topping
      } else {
        // Check if correct topping
        const correct = this.toppings.includes(targetToppings[0]);
        if (correct) {
          score += 20;
        } else {
          score += 5;  // Wrong topping
        }
      }
    }

    return score;
  }
}
