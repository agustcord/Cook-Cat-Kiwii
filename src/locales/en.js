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
    scratchWarningTutorial: "Careful! Scratching a customer during normal service will make them leave angry 🐾",
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
    tabs: {
      supplies: 'Kitchen Supplies',
      decorations: 'Café Decoration'
    },
    columns: {
      molds: 'MOLDS',
      dough: 'DOUGH',
      toppings: 'TOPPINGS',
      drinks: 'DRINKS'
    },
    decorHeader: 'Customize your bakery atmosphere with cozy upgrades!',
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
    decorItems: {
      decor_window: {
        name: 'Rustic Window',
        desc: 'Beautiful wooden window with a view of the café garden.',
        tag: 'Permanent Decor'
      },
      decor_bunting: {
        name: 'Festive Bunting',
        desc: 'Cheerful decorative bunting flags that brighten up the bakery café.',
        tag: 'Permanent Decor'
      },
      decor_clock: {
        name: 'Cat Wall Clock',
        desc: 'Handcrafted pendulum clock with cat silhouette.',
        tag: 'Permanent Decor'
      },
      decor_lights: {
        name: 'Cozy Fairy Lights',
        desc: 'Warm golden fairy lights to illuminate the bakery.',
        tag: 'Permanent Decor'
      }
    },
    units: {
      permanent: 'Permanent',
      pack5: 'Pack x5',
      unlocked: 'Unlocked',
      locked: 'Locked',
      stock: 'Stock: {qty} u.',
      ready: 'READY',
      comingSoon: 'COMING SOON',
      costLabel: 'Cost: 🪙 {cost}'
    },
    feedback: {
      unlocked: 'Unlocked! ✨',
      bought: '+5 {name} 🛒',
      decorUnlocked: 'Renovation Installed! ✨',
      comingSoonNotice: 'Available in upcoming updates! 🔒'
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
    welcome: "Meow! Welcome to Kiwipaw Bakehouse. 🐾\nI'm Kiwii. Let's bake your first cookie together!",
    complete: "Purr-fect! 🐾✨ You're all set!\nLet's bake and shine at Kiwipaw Bakehouse!",
    steps: {
      // 26 Canonical Keys (1:1 with TutorialSteps.js)
      welcome: "Meow! Welcome to Kiwipaw Bakehouse. 🐾\nI'm Kiwii. Let's bake your first cookie together!",
      doughClassic: "Paws to the dough! Drag the Classic Dough to the table.",
      shapeStar: "Use the Star Mold over the dough to cut the shape!",
      ovenPower: "Turn on the oven so it starts preheating!",
      cookieToOven: "Nicely shaped! Drag your cookie into the oven.",
      ovenBake: "Press BAKE to start baking the cookie!",
      ovenBaking: "The oven is working. ⏳\nLet's wait for the bell...",
      ovenBell: "Ding! 🔔 It's ready!\nDon't touch anything: let's see what happens if we wait!",
      burntExtract: "Oops, it burnt! 🔥 No worries.\nPress the button on the oven to take it out.",
      burntTrash: "Drag the burnt cookie to the TRASH 🗑️ to clear the table.",
      stockExplanation: "Nice clean up! 🗑️ Discarding uses stock.\nI'll restock you now; later, use the shop!",
      wrongDeliveryIntro: "What if we serve raw dough? 🐾\nLet's test it on purpose! Drag dough to the table.",
      wrongDeliveryToTray: "Drag the raw dough to the DELIVERY TRAY.",
      wrongDeliveryServe: "Tap the customer to serve the raw dough!",
      wrongDeliveryClean: "Grumpy customer! 😾 Don't worry, no Game Over.\nDrag the tray to the TRASH 🗑️ to clean it up.",
      drinkCup: "Drink time! Drag an empty cup into the coffee machine.",
      drinkCoffeeBtn: "Press the COFFEE button ☕ to brew fresh coffee!",
      drinkToTray: "Smells good! Drag the coffee to the DELIVERY TRAY.",
      perfectDough: "Now let's bake the ideal cookie! Drag Classic Dough.",
      perfectShape: "Cut the dough with the Star Mold! ⭐",
      perfectOvenLoad: "Drag the shaped cookie into the oven.",
      perfectOvenBake: "Press BAKE and watch for the right spot! 🔥",
      perfectOvenExtract: "Ding! 🔔 Golden and crispy!\nPress the oven button to take it out on time.",
      perfectCookieToTray: "Drag your golden cookie to the TRAY next to the coffee!",
      patienceDelivery: "Watch customer patience! ⏱️ Faster means more tips 🪙\nTap the customer or tray to serve the order!",
      client1Farewell: "First happy customer! 🐾✨\nLook, here comes customer number two!",
      client2Intro: "This customer wants a special treat: 🐾\nA sprinkle cookie and a coffee with milk!",
      client2Dough: "Dough first: drag Classic Dough\nto the table.",
      client2Shape: "Cut the dough with the Star Mold! ⭐",
      client2OvenLoad: "Drag your shaped cookie into the oven.",
      client2OvenBake: "Press BAKE to make it golden! 🔥",
      client2OvenExtract: "Ding! 🔔 Ready!\nPress the oven button to take it out.",
      toppingSprinkles: "Magic touch! ✨ Drag SPRINKLES\nfrom the right shelf to your cookie.",
      client2CookieToTray: "Looks delicious! Drag it to the\nDELIVERY TRAY.",
      client2Cup: "Now for coffee with milk: drag\na cup to the machine.",
      client2Coffee: "Press COFFEE ☕ to brew the base!",
      client2MilkMix: "Now press MILK 🥛 to combine\ninto Coffee with Milk!",
      client2DrinkToTray: "Smells amazing! Drag the coffee\nwith milk to the TRAY.",
      client2Delivery: "Order complete! Tap the tray\nor customer to serve.",
      complete: "Purr-fect! 🐾✨ You're all set!\nLet's bake and shine at Kiwipaw Bakehouse!",

      // Legacy snake_case / stepX aliases
      step1_dough: "Paws to the dough! Drag the Classic Dough to the table.",
      step2_shape: "Use the Star Mold over the dough to cut the shape!",
      step3_oven_power: "Turn on the oven so it starts preheating!",
      step3b_oven_insert: "Nicely shaped! Drag your cookie to the oven and press BAKE.",
      step3c_oven_baking: "The oven is working. ⏳\nLet's wait for the bell...",
      step4_oven_warning: "Ding! 🔔 It's ready!\nDon't touch anything: let's see what happens if we wait!",
      step4b_cookie_burnt: "Oops, it burnt! 🔥 No worries: take it out and drag it to TRASH 🗑️.",
      step5_stock_explanation: "Nice clean up! 🗑️ Discarding dough uses pantry supplies.",
      step5b_stock_safety: "I'll restock you now; on normal days you buy in the SHOP!",
      step6_wrong_delivery: "What if we serve raw dough? Let's test it on purpose on the TRAY!",
      step6b_wrong_delivery_feedback: "Grumpy customer! 😾 No worries: you can always fix the order.",
      step7_drink_cup: "Drink time! Drag an empty cup into the coffee machine.",
      step7b_drink_brew: "Press the COFFEE button ☕ to brew fresh hot coffee!",
      step7c_drink_tray: "Smells good! Drag the fresh coffee to the DELIVERY TRAY.",
      step8_perfect_cookie: "Ideal cookie: Classic Dough -> Star Mold -> Oven -> Press Bake!",
      step8b_extract_ready: "Ding! 🔔 Golden and crispy! Drag it to the DELIVERY TRAY!",
      step9_patience_deliver: "Watch customer patience! ⏱️ Faster means more tips 🪙\nTap the Delivery Tray to serve!",
      step10_complete: "Purr-fect! 🐾✨ You're all set!\nLet's bake and shine at Kiwipaw Bakehouse!",
      dough_classic: "Paws to the dough! Drag the Classic Dough to the table.",
      shape_star: "Use the Star Mold over the dough to cut the shape!",
      oven_power: "Turn on the oven so it starts preheating!",
      oven_bake: "Nicely shaped! Drag your cookie to the oven and press BAKE.",
      oven_baking: "The oven is working. ⏳\nLet's wait for the bell...",
      burn_warning: "Ding! 🔔 It's ready!\nDon't touch anything: let's see what happens if we wait!",
      trash_burnt: "Oops, it burnt! 🔥 No worries: take it out and drag it to TRASH 🗑️.",
      stock_warning: "Nice clean up! 🗑️ Discarding dough uses pantry supplies.",
      stock_restock: "I'll restock you now; on normal days you buy in the SHOP!",
      wrong_delivery: "What if we serve raw dough? Let's test it on purpose on the TRAY!",
      wrong_feedback: "Grumpy customer! 😾 No worries: you can always fix the order.",
      drink_cup: "Drink time! Drag an empty cup into the coffee machine.",
      drink_brew: "Press the COFFEE button ☕ to brew fresh hot coffee!",
      drink_tray: "Smells good! Drag the fresh coffee to the DELIVERY TRAY.",
      perfect_bake: "Ideal cookie: Classic Dough -> Star Mold -> Oven -> Press Bake!",
      perfect_extract: "Ding! 🔔 Golden and crispy! Drag it to the DELIVERY TRAY!",
      deliver_order: "Watch customer patience! ⏱️ Faster means more tips 🪙\nTap the Delivery Tray to serve!",
      celebration: "Purr-fect! 🐾✨ You're all set!\nLet's bake and shine at Kiwipaw Bakehouse!"
    }
  }
};
