export default {
  boot: {
    loading: 'Loading Kiwipaw Bakehouse...'
  },
  mainMenu: {
    title: 'Kiwipaw Bakehouse',
    subtitle: 'Kiwi the baker cat for CrazyGames',
    play: 'PLAY',
    continue: 'CONTINUE',
    newGame: 'NEW GAME',
    subtext: 'Supports Mouse & Touch Screen',
    langToggle: '🌐 Language: English',
    langButton: '🌐 EN'
  },
  hud: {
    day: 'DAY {day}',
    coins: '{coins}',
    goal: '{meta}',
    labels: {
      dough: 'DOUGH',
      shape: 'SHAPE',
      topping: 'TOPPING',
      delivery: 'DELIVERY'
    }
  },
  stations: {
    trash: 'TRASH',
    oven: 'OVEN',
    drinks: 'DRINKS',
    ovenExtract: 'TAKE OUT COOKIES'
  },
  recipes: {
    bases: {
      classic: 'Vanilla',
      chocolate: 'Chocolate',
      oat: 'Oat'
    },
    shapes: {
      star: 'Star',
      heart: 'Heart',
      cat: 'Cat',
      fish: 'Fish'
    },
    toppings: {
      sprinkles: 'with Sprinkles',
      choco: 'with Choco Chips',
      glazing: 'with Glaze'
    },
    drinks: {
      coffee: 'Coffee',
      milk: 'Milk',
      coffee_milk: 'Coffee w/ Milk'
    }
  },
  customer: {
    order: 'Order: {count} / {total}',
    orderDrinkOnly: 'Order: {drink}',
    orderWithDrink: 'Order: {count} / {total} + {drink}',
    scratchDialogues: [
      "OUCH! What a wild service! 😡🐾",
      "Meow! That hurt a lot! 😿",
      "I'm calling animal control! 😤",
      "It scratched me! I'm never coming back! 😡"
    ],
    feedback: {
      perfectDelivery: 'PERFECT DELIVERY! 🍪✨',
      perfectDrink: 'Perfect Delivery! ☕ +{reward} Coins',
      orderCompleted: 'Order completed! 👍',
      acceptable: 'Acceptable! 😐',
      orderExcess: 'Order complete! +{reward} (Excess: -{penalty}) 🗑️',
      emptyTray: 'The delivery tray is empty!',
      wrongOrder: 'This is not what I ordered! 😡',
      rawCookie: 'This cookie is raw! 🤮',
      burntCookie: 'This cookie is burnt! 🥵',
      missingTopping: 'Missing toppings! 🍓',
      wrongShape: 'This shape is wrong! 📐',
      wrongBase: 'Wrong dough flavor! 🍫',
      incomplete: 'Incomplete! Missing {missing} cookies 😡',
      timeout: "I'm tired of waiting! 😾",
      coinsAdded: '+{reward} Coins'
    }
  },
  game: {
    stock: 'Stock: {qty}',
    stockInfinite: 'Stock: ∞',
    stockUnit: '{qty}u',
    feedback: {
      outOfStock: 'Out of stock! Buy more in the shop 🛒',
      doughSelected: '{name} Dough!',
      tableFull: 'Table full! (Max 3)',
      shapeSelected: '{name} Shape!',
      selectDoughFirst: 'Select dough first!',
      cutShapeFirst: 'Cut shape first!',
      toppingAdded: 'Added {name}! ✨',
      pressDrinkButton: 'Press Coffee or Milk on the panel! ☕🥛',
      dragCupToTray: 'Drag cup to delivery tray! ☕➡️',
      brewingDrink: 'Brewing beverage...! ⏳',
      noCoffeeStock: 'No Coffee beans! Restock in shop 🛒',
      noMilkStock: 'No Milk cartons! Restock in shop 🛒',
      cupAlreadyInMachine: 'A cup is already in the machine! ☕',
      cupPlaced: 'Cup placed! ☕',
      placeCupFirst: 'Place a cup first! ☕🥛',
      drinkReady: 'Beverage ready! ☕',
      coffeeMilkReady: 'Coffee with milk ready! ☕🥛',
      machineBusy: 'Machine is busy! ☕',
      drinkServed: '{name} served! ☕',
      ovenPreheating: 'Oven on (preheating)! 🔥',
      ovenOff: 'Oven turned off.',
      turnOnOvenFirst: 'Turn on the oven first!',
      ovenEmpty: 'Oven is empty!',
      cookingCookies: 'Baking cookies! ⏳',
      cookieStillRaw: 'Still raw! 🥣',
      cookieBurnt: 'It burnt! 😭🔥',
      perfectBake: 'Perfect Bake! 🍪✨',
      someReady: 'Some cookies are ready! 🍪',
      cookiesReady: 'Cookies ready! 🍪',
      ovenAlreadyOn: 'Oven is already on!',
      ovenFull: 'Oven is full! (Max 3)',
      cookieInserted: 'Cookie inserted ({count}/{total}) 🍪',
      cookieReadyDelivery: 'Cookie ready for delivery! 📦',
      missingDrink: 'Missing drink: {drink}! ☕',
      discarded: 'Discarded! 🗑️',
      takingToCounter: 'Moving to counter! 🍪',
      trayEmptied: 'Tray Emptied! 🗑️'
    }
  },
  audio: {
    title: 'BACKGROUND MUSIC',
    volume: 'Volume: {percent}%',
    muted: '🔇 Muted',
    unmuted: '🔊 Active'
  },
  settings: {
    title: 'SETTINGS & AUDIO',
    language: 'LANGUAGE',
    langToggle: '🌐 Language: English',
    langButton: '🌐 EN'
  },
  editor: {
    indicator: '🛠️ UI EDITOR MODE ACTIVE\n[Drag signs / ⬆️⬇️⬅️➡️ to Resize / S to Save / E to Exit]',
    active: 'Editor Mode Active 🛠️',
    inactive: 'Game Mode Active 🎮',
    selected: 'Selected: {key}',
    copied: 'Configuration copied to clipboard! 📋',
    copyError: 'Copy failed. Check console (F12). ⚠️'
  },
  summary: {
    dayCompleted: 'DAY {day} COMPLETED',
    bankruptcyClosure: 'BANKRUPTCY CLOSURE',
    performance: {
      header: 'Commercial Performance: ({label})',
      insolvencyDebt: 'Financial Insolvency: Insufficient funds to cover daily expenses',
      insolvencySupplies: 'Operational Stockout: No dough in pantry and insufficient funds to restock',
      excellent: 'Excellent',
      good: 'Good',
      tight: 'Tight',
      msgExcellent: 'Sales Record! You well exceeded the daily goal.',
      msgGood: 'Good job! You were very close to the sales goal.',
      msgTight: 'Quiet day. Goal was not reached, but the business remains solvent.'
    },
    sub: {
      goal: 'Goal: {meta}',
      earnings: "•   Today's Sales: {earnings}"
    },
    card: {
      title: 'BILLING & BALANCE BREAKDOWN',
      sales: "Today's Shift Sales:",
      startCoins: 'Previous Cash Balance:',
      totalCoins: 'Total Cash at Closing:',
      rent: 'Store Rent (Fixed):',
      maintenance: 'Electricity / Water / Gas:',
      loanPayment: 'Bank Loan Installment:',
      totalExpenses: 'Total Deducted Expenses:',
      netBalance: 'NET REMAINING BALANCE:',
      pantryTitle: 'Dough Pantry:',
      pantryAvailable: '{count} u. available to open tomorrow',
      pantryRestock: '0 u. (Balance available to restock in shop)',
      pantryBroke: '0 u. (Insufficient funds for basic dough: 10)',
      loanRemaining: 'Remaining Bank Loan: {amount}',
      loanInitial: '(Initial: 200)'
    },
    buttons: {
      declareBankruptcy: 'DECLARE BANKRUPTCY',
      victory: 'FINANCIAL VICTORY',
      shop: 'GO TO SHOP',
      retry: 'RETRY DAY',
      warningBelowGoal: 'Sales below goal. You can proceed to the shop or retry.'
    }
  },
  shop: {
    title: 'KIWI BAKEHOUSE SHOP',
    subtitle: 'Restock your ingredients before Day {day}!',
    availableCoins: '🪙 Available Coins: {coins}',
    columns: {
      molds: 'MOLDS',
      dough: 'DOUGH',
      toppings: 'TOPPINGS',
      drinks: 'DRINKS'
    },
    items: {
      moldHeart: 'Heart Mold',
      moldCat: 'Cat Mold',
      moldFish: 'Fish Mold',
      doughClassic: 'Classic Dough',
      doughChocolate: 'Chocolate Dough',
      doughOat: 'Oat Dough',
      toppingSprinkles: 'Sugar Sprinkles',
      toppingChoco: 'Choco Chips',
      toppingGlazing: 'Sweet Glaze',
      drinkCoffee: 'Coffee Beans',
      drinkMilk: 'Milk Carton'
    },
    units: {
      permanent: 'Permanent',
      pack5: 'Pack x5',
      unlocked: 'Unlocked',
      locked: 'Locked',
      stock: 'Stock: {qty} u.',
      ready: 'READY'
    },
    feedback: {
      unlocked: 'Unlocked! ✨',
      bought: '+5 {name} 🛒'
    },
    warningDough: '⚠️ Warning! You have no dough to open the bakery. Buy at least 1 pack of Classic Dough.',
    startNextDay: 'START NEXT DAY ☕'
  },
  gameOver: {
    title: 'BANKRUPTCY',
    subtitleDebt: 'FINANCIAL INSOLVENCY',
    subtitleSupplies: 'OPERATIONAL STOCKOUT',
    narrativeDebt: 'The burden of debts and daily maintenance costs were too much for Kiwipaw Bakehouse.\n\nWithout enough coins to cover rent, utilities, and bank loan installments, Kiwi had to declare bankruptcy and close the doors permanently.',
    narrativeSupplies: 'You covered fixed daily expenses, but the bakery ran out of dough in the pantry and lacked sufficient funds to buy a basic dough pack in the shop (min. 10 🪙).\n\nWithout flour or dough to bake, Kiwipaw Bakehouse cannot open tomorrow and had to close its doors permanently.',
    retryCampaign: 'RETRY CAMPAIGN 🔄'
  },
  victory: {
    title: 'COMMERCIAL VICTORY',
    narrative: 'YOU DID IT! You have paid off the bank loan completely.\n\nKiwipaw Bakehouse is 100% yours. Now you are a successful pastry cat, free from office stress, and master of your own destiny and delicious cookies.\n\nYou finished with a final net capital of: 🪙 {coins}',
    returnMenu: 'RETURN TO MENU 🏠'
  },
  tutorial: {
    mentorName: 'Kiwii',
    mentorRole: 'Mentor Chef',
    skipButton: 'SKIP ⏭️',
    skipTutorial: 'Skip Tutorial',
    nextButton: 'NEXT ➡️',
    gotItButton: 'GOT IT! 👍',
    continueButton: 'CONTINUE 🐾',
    skipModal: {
      title: 'Skip Tutorial?',
      description: 'Are you sure you want to skip the tutorial? You will jump straight to the bakery rush without guidance.',
      confirm: 'YES, SKIP',
      cancel: 'KEEP PLAYING'
    },
    welcome: "Meow! Welcome to Kiwipaw Bakehouse! 🐾\nI'm Kiwii, your head chef mentor. Our first customer wants a Classic Star Cookie. Let's make it together!",
    complete: "Purr-fect! 🐾✨\nYou've mastered all stations and learned how to handle mistakes. You're ready to run Kiwipaw Bakehouse!",
    steps: {
      // 25 Canonical Keys (1:1 with TutorialSteps.js)
      welcome: "Meow! Welcome to Kiwipaw Bakehouse! 🐾\nI'm Kiwii, your head chef mentor. Our first customer wants a Classic Star Cookie. Let's make it together!",
      doughClassic: "First, drag the Classic Vanilla Dough from the shelf onto the prep table.",
      shapeStar: "Now drag the Star Mold over your dough to cut it into shape!",
      ovenPower: "Raw dough needs baking! Click the POWER button on the oven to preheat it.",
      cookieToOven: "Great! Now drag your star cookie into the oven.",
      ovenBake: "Press the BAKE button to start baking the cookie!",
      burnWait: "Listen to the golden bell! 🔔 The cookie is ready...\n⚠️ But wait! Watch without touching for 5 seconds to see what happens if you get distracted!",
      burntExtract: "Oh no, it burnt to a crisp! 😭🔥\nMistakes happen, don't worry! Click the extract button to take out the burnt cookie.",
      burntTrash: "Drag the burnt cookie to the TRASH BIN 🗑️ to clear the table and keep your kitchen clean.",
      stockExplanation: "Great job cleaning up! 🗑️\nNotice the stock counter under each ingredient bowl? Every dough you use or discard consumes your pantry stock.\n✨ In this tutorial I'll magically restock you if you run out, but on real days remember to buy ingredients in the SHOP!",
      wrongDeliveryIntro: "What happens if we serve the wrong order or raw dough?\nLet's test it on purpose! First, drag a Classic Vanilla Dough to the table.",
      wrongDeliveryToTray: "Drag the raw unbaked dough directly to the DELIVERY TRAY.",
      wrongDeliveryServe: "Tap the customer to serve the raw dough. Let's see how they react!",
      wrongDeliveryClean: "The customer rejected it because it's raw! 😾\nDon't worry: you won't lose the game! As long as you have customer patience left, you can correct the order anytime. Now drag the tray contents to the TRASH BIN 🗑️.",
      drinkCup: "Now let's prepare the drink! Drag an empty cup from the cup stack into the Drink Machine.",
      drinkCoffeeBtn: "Press the COFFEE button ☕ to brew fresh hot coffee!",
      drinkToTray: "Nice! Drag the fresh coffee from the machine to the DELIVERY TRAY.",
      perfectDough: "Now let's bake the perfect cookie! Drag Classic Vanilla Dough to the prep table.",
      perfectShape: "Cut the dough with the Star Mold! ⭐",
      perfectOvenLoad: "Drag your cut star dough into the oven.",
      perfectOvenBake: "Press the BAKE button on the oven! 🔥",
      perfectOvenExtract: "Ding! 🔔 The bell rang! Click the extract button immediately to get your golden cookie!",
      perfectCookieToTray: "Drag the golden star cookie to the DELIVERY TRAY alongside the coffee!",
      patienceDelivery: "Look at the customer's patience bar! ⏱️\nFaster deliveries mean happier cats and BIGGER TIPS! 🪙 Tap the customer or delivery tray to serve the order!",
      complete: "Purr-fect! 🐾✨\nYou've mastered all stations and learned how to handle mistakes. You're ready to run Kiwipaw Bakehouse!",

      // Legacy snake_case / stepX aliases
      step1_dough: "First, drag the Classic Vanilla Dough from the shelf onto the prep table.",
      step2_shape: "Now drag the Star Mold over your dough to cut it into shape!",
      step3_oven_power: "Raw dough needs baking! Click the POWER button on the oven to preheat it.",
      step3b_oven_insert: "Great! Now drag your star cookie into the oven and press the BAKE button.",
      step4_oven_warning: "Listen to the golden bell! 🔔 The cookie is ready...\n⚠️ But wait! Watch without touching for 5 seconds to see what happens if you get distracted!",
      step4b_cookie_burnt: "Oh no, it burnt to a crisp! 😭🔥\nMistakes happen, don't worry! Take out the burnt cookie and drag it to the TRASH BIN to keep your kitchen clean.",
      step5_stock_explanation: "Great job cleaning up! 🗑️\nNotice the stock counter under each ingredient bowl? Every dough you use or discard consumes your pantry stock.",
      step5b_stock_safety: "If your stock reaches 0, you won't be able to bake!\n✨ For this tutorial, I'll magically restock you if you run out. But on real days, remember to buy ingredients in the SHOP after closing!",
      step6_wrong_delivery: "What happens if we try to serve raw dough or the wrong recipe?\nLet's test it on purpose! Place a raw dough on the DELIVERY TRAY and tap Deliver.",
      step6b_wrong_delivery_feedback: "The customer rejected it because it's raw! 😾\nDon't worry: you won't lose the game. As long as you have customer patience left, you can correct the order anytime!",
      step7_drink_cup: "Now let's prepare the drink! Drag an empty cup from the cup stack into the Drink Machine.",
      step7b_drink_brew: "Press the COFFEE button ☕ to brew fresh hot coffee!",
      step7c_drink_tray: "Nice! Drag the fresh coffee from the machine to the DELIVERY TRAY.",
      step8_perfect_cookie: "Now let's bake the perfect cookie: Drag Vanilla Dough -> Apply Star Mold -> Put in Oven -> Press Bake!",
      step8b_extract_ready: "Ding! 🔔 Take it out immediately when the bell rings, then drag the golden cookie to the DELIVERY TRAY.",
      step9_patience_deliver: "Look at the customer's patience bar! ⏱️\nFaster deliveries mean happier cats and BIGGER TIPS! 🪙 Tap the Delivery Tray to serve the customer!",
      step10_complete: "Purr-fect! 🐾✨\nYou've mastered all stations and learned how to handle mistakes. You're ready to run Kiwipaw Bakehouse!",
      dough_classic: "First, drag the Classic Vanilla Dough from the shelf onto the prep table.",
      shape_star: "Now drag the Star Mold over your dough to cut it into shape!",
      oven_power: "Raw dough needs baking! Click the POWER button on the oven to preheat it.",
      oven_bake: "Great! Now drag your star cookie into the oven and press the BAKE button.",
      burn_warning: "Listen to the golden bell! 🔔 The cookie is ready...\n⚠️ But wait! Watch without touching for 5 seconds to see what happens if you get distracted!",
      trash_burnt: "Oh no, it burnt to a crisp! 😭🔥\nMistakes happen, don't worry! Take out the burnt cookie and drag it to the TRASH BIN to keep your kitchen clean.",
      stock_warning: "Great job cleaning up! 🗑️\nNotice the stock counter under each ingredient bowl? Every dough you use or discard consumes your pantry stock.",
      stock_restock: "If your stock reaches 0, you won't be able to bake!\n✨ For this tutorial, I'll magically restock you if you run out. But on real days, remember to buy ingredients in the SHOP after closing!",
      wrong_delivery: "What happens if we try to serve raw dough or the wrong recipe?\nLet's test it on purpose! Place a raw dough on the DELIVERY TRAY and tap Deliver.",
      wrong_feedback: "The customer rejected it because it's raw! 😾\nDon't worry: you won't lose the game. As long as you have customer patience left, you can correct the order anytime!",
      drink_cup: "Now let's prepare the drink! Drag an empty cup from the cup stack into the Drink Machine.",
      drink_brew: "Press the COFFEE button ☕ to brew fresh hot coffee!",
      drink_tray: "Nice! Drag the fresh coffee from the machine to the DELIVERY TRAY.",
      perfect_bake: "Now let's bake the perfect cookie: Drag Vanilla Dough -> Apply Star Mold -> Put in Oven -> Press Bake!",
      perfect_extract: "Ding! 🔔 Take it out immediately when the bell rings, then drag the golden cookie to the DELIVERY TRAY.",
      deliver_order: "Look at the customer's patience bar! ⏱️\nFaster deliveries mean happier cats and BIGGER TIPS! 🪙 Tap the Delivery Tray to serve the customer!",
      celebration: "Purr-fect! 🐾✨\nYou've mastered all stations and learned how to handle mistakes. You're ready to run Kiwipaw Bakehouse!"
    }
  }
};
