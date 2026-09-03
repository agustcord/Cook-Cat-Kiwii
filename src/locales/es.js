export default {
  boot: {
    loading: 'Cargando Kiwipaw Bakehouse...'
  },
  mainMenu: {
    title: 'Kiwipaw Bakehouse',
    subtitle: 'El gato Kiwi repostero para CrazyGames',
    play: 'JUGAR',
    continue: 'CONTINUAR',
    newGame: 'NUEVA PARTIDA',
    subtext: 'Soporta Mouse & Pantalla Táctil',
    langToggle: '🌐 Idioma: Español',
    langButton: '🌐 ES'
  },
  hud: {
    day: 'DÍA {day}',
    coins: '{coins}',
    goal: '{meta}',
    labels: {
      dough: 'MASA',
      shape: 'FORMA',
      topping: 'TOPPING',
      delivery: 'ENTREGA'
    }
  },
  stations: {
    trash: 'BASURA',
    oven: 'HORNO',
    drinks: 'BEBIDAS',
    ovenExtract: 'SACAR GALLETAS'
  },
  recipes: {
    bases: {
      classic: 'Vainilla',
      chocolate: 'Chocolate',
      oat: 'Avena'
    },
    shapes: {
      star: 'Estrella',
      heart: 'Corazón',
      cat: 'Gato',
      fish: 'Pez'
    },
    toppings: {
      sprinkles: 'con Chispas',
      choco: 'con Chips',
      glazing: 'con Glaseado'
    },
    drinks: {
      coffee: 'Café',
      milk: 'Leche',
      coffee_milk: 'Café c/Leche'
    }
  },
  customer: {
    order: 'Pedido: {count} / {total}',
    orderDrinkOnly: 'Pedido: {drink}',
    orderWithDrink: 'Pedido: {count} / {total} + {drink}',
    scratchWarningTutorial: "¡Cuidado! Si arañas a un cliente en servicio normal huirá enojado 🐾",
    scratchDialogues: [
      "¡AUCH! ¡Qué servicio tan salvaje! 😡🐾",
      "¡Miau! ¡Eso dolió mucho! 😿",
      "¡Llamaré al control de animales! 😤",
      "¡Me rasguñó! ¡No volveré jamás! 😡"
    ],
    feedback: {
      perfectDelivery: '¡ENTREGA PERFECTA! 🍪✨',
      perfectDrink: '¡Entrega perfecta! ☕ +{reward} Monedas',
      orderCompleted: '¡Pedido completado! 👍',
      acceptable: '¡Aceptable! 😐',
      orderExcess: '¡Pedido completo! +{reward} (Exceso: -{penalty}) 🗑️',
      emptyTray: '¡La bandeja de entrega está vacía!',
      wrongOrder: '¡Esto no es lo que pedí! 😡',
      rawCookie: '¡Esta galleta está cruda! 🤮',
      burntCookie: '¡Esta galleta está quemada! 🥵',
      missingTopping: '¡Le faltan los toppings! 🍓',
      wrongShape: '¡Esta forma no es la correcta! 📐',
      wrongBase: '¡El sabor de la masa no es el correcto! 🍫',
      incomplete: '¡Incompleto! Faltan {missing} galletas 😡',
      timeout: '¡Me cansé de esperar! 😾',
      coinsAdded: '+{reward} Monedas'
    }
  },
  game: {
    stock: 'Stock: {qty}',
    stockInfinite: 'Stock: ∞',
    stockUnit: '{qty}u',
    feedback: {
      outOfStock: '¡Sin stock! Cómpralo en la tienda 🛒',
      doughSelected: '¡Masa de {name}!',
      tableFull: '¡Mesa llena! (Máx 3)',
      shapeSelected: '¡Forma de {name}!',
      selectDoughFirst: '¡Primero selecciona la masa!',
      cutShapeFirst: '¡Primero corta la forma!',
      toppingAdded: '¡Añadido {name}! ✨',
      pressDrinkButton: '¡Presiona Café o Leche en el panel! ☕🥛',
      dragCupToTray: '¡Arrastra la taza a la bandeja! ☕➡️',
      brewingDrink: '¡Preparando bebida...! ⏳',
      noCoffeeStock: '¡Sin stock de Café! Cómpralo en la tienda 🛒',
      noMilkStock: '¡Sin stock de Leche! Cómpralo en la tienda 🛒',
      cupAlreadyInMachine: '¡Ya hay una taza en la cafetera! ☕',
      cupPlaced: '¡Taza colocada! ☕',
      placeCupFirst: '¡Primero coloca una taza! ☕🥛',
      drinkReady: '¡Bebida lista! ☕',
      coffeeMilkReady: '¡Café con leche listo! ☕🥛',
      machineBusy: '¡La máquina está ocupada! ☕',
      drinkServed: '¡{name} servido! ☕',
      ovenPreheating: '¡Horno encendido (precalentando)! 🔥',
      ovenOff: 'Horno apagado.',
      turnOnOvenFirst: '¡Primero enciende el horno!',
      ovenEmpty: '¡El horno está vacío!',
      cookingCookies: '¡Cocinando galletas! ⏳',
      cookieStillRaw: '¡Sigue cruda! 🥣',
      cookieBurnt: '¡Se ha quemado! 😭🔥',
      perfectBake: '¡Horneado Perfecto! 🍪✨',
      someReady: '¡Algunas están listas! 🍪',
      cookiesReady: '¡Galletas listas! 🍪',
      ovenAlreadyOn: '¡El horno está encendido!',
      ovenFull: '¡El horno está lleno! (Máx 3)',
      cookieInserted: 'Galleta introducida ({count}/{total}) 🍪',
      cookieReadyDelivery: '¡Galleta lista para entrega! 📦',
      missingDrink: '¡Falta la bebida: {drink}! ☕',
      discarded: '¡Desechada! 🗑️',
      takingToCounter: '¡Retirando al mostrador! 🍪',
      trayEmptied: '¡Bandeja Vaciada! 🗑️'
    }
  },
  audio: {
    title: 'MÚSICA DE FONDO',
    volume: 'Volumen: {percent}%',
    muted: '🔇 Silenciado',
    unmuted: '🔊 Activado'
  },
  settings: {
    title: 'AJUSTES Y AUDIO',
    language: 'IDIOMA',
    langToggle: '🌐 Idioma: Español',
    langButton: '🌐 ES'
  },
  editor: {
    indicator: '🛠️ MODO EDITOR DE UI ACTIVO\n[Arrastra letreros / ⬆️⬇️⬅️➡️ para Redimensionar / S para Guardar / E para Salir]',
    active: 'Modo Editor Activo 🛠️',
    inactive: 'Modo Juego Activo 🎮',
    selected: 'Seleccionado: {key}',
    copied: '¡Configuración copiada al portapapeles! 📋',
    copyError: 'Error al copiar. Mira la consola (F12). ⚠️'
  },
  summary: {
    dayCompleted: 'DÍA {day} COMPLETADO',
    bankruptcyClosure: '¡CIERRE POR QUIEBRA!',
    performance: {
      header: 'Desempeño Comercial: ({label})',
      insolvencyDebt: 'Insolvencia Financiera: Fondos insuficientes para cubrir los gastos del día',
      insolvencySupplies: 'Desabastecimiento Operativo: Sin masa en despensa ni fondos para reponerla',
      excellent: 'Excelente',
      good: 'Bueno',
      tight: 'Ajustado',
      msgExcellent: '¡Récord de Ventas! Superaste la meta del día con creces.',
      msgGood: '¡Buen trabajo! Estuviste muy cerca de la meta comercial.',
      msgTight: 'Día tranquilo. No se alcanzó la meta, pero el negocio sigue en pie y solvente.'
    },
    sub: {
      goal: 'Meta: {meta}',
      earnings: "•   Ventas Hoy: {earnings}"
    },
    card: {
      title: 'DETALLE DE FACTURACIÓN Y BALANCE',
      sales: 'Ventas de la Jornada (Hoy):',
      startCoins: 'Saldo Previo en Caja:',
      totalCoins: 'Total Fondos en Caja al Cierre:',
      rent: 'Alquiler del Local (Fijo):',
      maintenance: 'Servicios de Luz / Agua / Gas:',
      loanPayment: 'Cuota del Préstamo Bancario:',
      totalExpenses: 'Total Gastos Deducidos:',
      netBalance: 'SALDO NETO RESTANTE:',
      pantryTitle: 'Despensa de Masa:',
      pantryAvailable: '{count} u. disponibles para abrir mañana',
      pantryRestock: '0 u. (Saldo disponible para reponer en tienda)',
      pantryBroke: '0 u. (Fondos insuficientes para masa básica: 10)',
      loanRemaining: 'Préstamo restante con el banco: {amount}',
      loanInitial: '(Inicial: 200)'
    },
    buttons: {
      declareBankruptcy: 'DECLARAR QUIEBRA',
      victory: 'VICTORIA FINANCIERA',
      shop: 'IR A LA TIENDA',
      retry: 'REINTENTAR EL DÍA',
      warningBelowGoal: 'Rendimiento comercial por debajo de la meta. Puedes continuar a la tienda o reintentar.'
    }
  },
  shop: {
    title: 'TIENDA KIWI BAKERY',
    subtitle: '¡Abastece tus ingredientes antes del Día {day}!',
    availableCoins: '🪙 Monedas Disponibles: {coins}',
    columns: {
      molds: 'MOLDES',
      dough: 'MASAS',
      toppings: 'TOPPINGS',
      drinks: 'BEBIDAS'
    },
    items: {
      moldHeart: 'Molde Corazón',
      moldCat: 'Molde Gato',
      moldFish: 'Molde Pez',
      doughClassic: 'Masa Clásica',
      doughChocolate: 'Masa Chocolate',
      doughOat: 'Masa Avena',
      toppingSprinkles: 'Chispas Azúcar',
      toppingChoco: 'Chispas Choco',
      toppingGlazing: 'Glaseado Dulce',
      drinkCoffee: 'Granos Café',
      drinkMilk: 'Cartón Leche'
    },
    units: {
      permanent: 'Permanente',
      pack5: 'Pack x5',
      unlocked: 'Desbloqueado',
      locked: 'Bloqueado',
      stock: 'Stock: {qty} u.',
      ready: 'LISTO'
    },
    feedback: {
      unlocked: '¡Desbloqueado! ✨',
      bought: '+5 {name} 🛒'
    },
    warningDough: '⚠️ ¡Atención! No tienes masa para abrir la panadería. Compra al menos 1 pack de Masa Clásica.',
    startNextDay: 'EMPEZAR SIGUIENTE DÍA ☕'
  },
  gameOver: {
    title: 'BANCARROTA',
    subtitleDebt: 'INSOLVENCIA FINANCIERA',
    subtitleSupplies: 'DESABASTECIMIENTO OPERATIVO',
    narrativeDebt: 'La presión de las deudas y el costo de mantenimiento diario fueron demasiado para Kiwipaw Bakehouse.\n\nSin monedas suficientes para cubrir el alquiler, servicios y la cuota del banco, el michi se declaró en quiebra y tuvo que cerrar sus puertas definitivamente.',
    narrativeSupplies: 'Pudiste cubrir los gastos fijos de la jornada, pero la panadería se quedó sin masa en la despensa y sin fondos suficientes para comprar un pack de masa básica en la tienda (mínimo 10 🪙).\n\nSin harina ni masa para hornear, Kiwipaw Bakehouse no puede abrir al día siguiente y tuvo que cerrar sus puertas definitivamente.',
    retryCampaign: 'REINTENTAR CAMPAÑA 🔄'
  },
  victory: {
    title: 'VICTORIA COMERCIAL',
    narrative: '¡LO LOGRASTE! Has saldado el préstamo por completo.\n\nKiwipaw Bakehouse es 100% tuya. Ahora eres un michi repostero exitoso, libre del estrés de la oficina y dueño de tu propio destino y deliciosas galletas.\n\nTe has quedado con un capital neto final de: 🪙 {coins}',
    returnMenu: 'VOLVER AL MENÚ 🏠'
  },
  tutorial: {
    mentorName: 'Kiwii',
    mentorRole: 'Chef Mentor',
    skipButton: 'SALTAR ⏭️',
    skipTutorial: 'Saltar Tutorial',
    nextButton: 'SIGUIENTE ➡️',
    gotItButton: '¡ENTENDIDO! 👍',
    continueButton: 'CONTINUAR 🐾',
    skipModal: {
      title: '¿Saltar Tutorial?',
      description: '¿Estás seguro de que deseas saltar el tutorial? Comenzarás directamente a atender la pastelería sin asistencia.',
      confirm: 'SÍ, SALTAR',
      cancel: 'SEGUIR JUGANDO'
    },
    welcome: "¡Miau! Bienvenido a Kiwipaw Bakehouse. 🐾\nSoy Kiwii. ¡Preparemos juntos tu primera galleta!",
    complete: "¡Miau-ravilloso! 🐾✨ ¡Todo listo!\n¡A hornear y triunfar en Kiwipaw Bakehouse!",
    steps: {
      // 26 Canonical Keys (1:1 with TutorialSteps.js)
      welcome: "¡Miau! Bienvenido a Kiwipaw Bakehouse. 🐾\nSoy Kiwii. ¡Preparemos juntos tu primera galleta!",
      doughClassic: "¡Patitas a la masa! Arrastra la Masa Clásica a la mesa.",
      shapeStar: "¡Usa el Molde de Estrella para cortar la masa!",
      ovenPower: "¡Enciende el horno para que empiece a precalentar!",
      cookieToOven: "¡Bien hecho! Arrastra tu galleta cortada al horno.",
      ovenBake: "¡Toca HORNEAR para que empiece la magia del horno!",
      ovenBaking: "El horno está en marcha. ⏳\nEsperemos a que suene la campana...",
      ovenBell: "¡Ding! 🔔 ¡Está lista!\nNo toques nada: ¡mira qué pasa si nos descuidamos!",
      burntExtract: "¡Ups, se nos quemó! 🔥 No pasa nada.\nToca el botón del horno para retirarla.",
      burntTrash: "Arrastra la galleta quemada al BASURERO 🗑️ para despejar.",
      stockExplanation: "¡Buen descarte! 🗑️ Cada masa gasta stock.\nAquí te repondré yo; luego, ¡en la tienda!",
      wrongDeliveryIntro: "¿Qué pasa si servimos masa cruda? 🐾\n¡Probemos a propósito! Arrastra masa a la mesa.",
      wrongDeliveryToTray: "Arrastra la masa cruda a la BANDEJA DE ENTREGA.",
      wrongDeliveryServe: "¡Toca al cliente para servirle la masa cruda!",
      wrongDeliveryClean: "¡Cliente enojado! 😾 Tranqui, no hay Game Over.\nArrastra la bandeja al BASURERO 🗑️ para limpiarla.",
      drinkCup: "¡Hora del café! Arrastra una taza vacía a la cafetera.",
      drinkCoffeeBtn: "¡Toca el botón CAFÉ ☕ para preparar café fresco!",
      drinkToTray: "¡Aromático! Arrastra el café listo a la BANDEJA.",
      perfectDough: "¡Ahora hagamos la galleta ideal! Arrastra Masa Clásica.",
      perfectShape: "¡Corta la masa con el Molde de Estrella! ⭐",
      perfectOvenLoad: "Arrastra la galleta con forma dentro del horno.",
      perfectOvenBake: "¡Toca HORNEAR y vigila el punto justo! 🔥",
      perfectOvenExtract: "¡Ding! 🔔 ¡Está doradita y crocante!\nToca el botón del horno para sacarla a tiempo.",
      perfectCookieToTray: "Arrastra tu galleta dorada a la BANDEJA junto al café.",
      patienceDelivery: "¡Atención a la paciencia! ⏱️ Rápido da más propina 🪙\n¡Toca al cliente o la bandeja para servir!",
      client1Farewell: "¡Primer cliente feliz! 🐾✨\n¡Mira, ya llega el segundo cliente!",
      client2Intro: "Este cliente quiere algo especial: 🐾\n¡Galleta con chispas y un café con leche!",
      client2Dough: "Primero la masa: arrastra Masa Clásica\na la mesa de preparación.",
      client2Shape: "¡Corta la masa con el Molde de Estrella! ⭐",
      client2OvenLoad: "Arrastra la galleta con forma al horno.",
      client2OvenBake: "¡Toca HORNEAR para cocinarla doradita! 🔥",
      client2OvenExtract: "¡Ding! 🔔 ¡Está lista!\nToca el botón del horno para sacarla.",
      toppingSprinkles: "¡Toque mágico! ✨ Arrastra las CHISPAS\ndel estante a tu galleta horneada.",
      client2CookieToTray: "¡Qué linda quedó! Arrástrala a la\nBANDEJA DE ENTREGA.",
      client2Cup: "Ahora el café con leche: arrastra\nuna taza a la máquina.",
      client2Coffee: "¡Toca CAFÉ ☕ para preparar la base!",
      client2MilkMix: "¡Ahora toca LECHE 🥛 para combinar\ny hacer Café con Leche!",
      client2DrinkToTray: "¡Aroma irresistible! Arrastra el\ncafé con leche a la BANDEJA.",
      client2Delivery: "¡Comanda lista! Toca la bandeja\no al cliente para servir.",
      complete: "¡Miau-ravilloso! 🐾✨ ¡Todo listo!\n¡A hornear y triunfar en Kiwipaw Bakehouse!",

      // Legacy snake_case / stepX aliases
      step1_dough: "¡Patitas a la masa! Arrastra la Masa Clásica a la mesa.",
      step2_shape: "¡Usa el Molde de Estrella para cortar la masa!",
      step3_oven_power: "¡Enciende el horno para que empiece a precalentar!",
      step3b_oven_insert: "¡Bien hecho! Arrastra tu galleta al horno y presiona HORNEAR.",
      step3c_oven_baking: "El horno está en marcha. ⏳\nEsperemos a que suene la campana...",
      step4_oven_warning: "¡Ding! 🔔 ¡Está lista!\nNo toques nada: ¡mira qué pasa si nos descuidamos!",
      step4b_cookie_burnt: "¡Ups, se nos quemó! 🔥 No pasa nada: sácala y tírala al BASURERO 🗑️.",
      step5_stock_explanation: "¡Buen descarte! 🗑️ Cada masa que usas o tiras gasta despensa.",
      step5b_stock_safety: "Aquí te repondré yo; en días normales compras en la TIENDA.",
      step6_wrong_delivery: "¿Qué pasa si servimos masa cruda? ¡Probemos a propósito en la BANDEJA!",
      step6b_wrong_delivery_feedback: "¡Cliente enojado! 😾 Tranqui, no hay Game Over: puedes corregir la orden.",
      step7_drink_cup: "¡Hora del café! Arrastra una taza vacía a la cafetera.",
      step7b_drink_brew: "¡Toca el botón CAFÉ ☕ para preparar café fresco!",
      step7c_drink_tray: "¡Aromático! Arrastra el café listo a la BANDEJA.",
      step8_perfect_cookie: "Galleta ideal: Masa Clásica -> Molde Estrella -> Horno -> ¡Hornear!",
      step8b_extract_ready: "¡Ding! 🔔 ¡Sácala dorada y arrástrala a la BANDEJA DE ENTREGA!",
      step9_patience_deliver: "¡Atención a la paciencia! ⏱️ Rápido da más propina 🪙\n¡Toca la bandeja para servir!",
      step10_complete: "¡Miau-ravilloso! 🐾✨ ¡Todo listo!\n¡A hornear y triunfar en Kiwipaw Bakehouse!",
      dough_classic: "¡Patitas a la masa! Arrastra la Masa Clásica a la mesa.",
      shape_star: "¡Usa el Molde de Estrella para cortar la masa!",
      oven_power: "¡Enciende el horno para que empiece a precalentar!",
      oven_bake: "¡Bien hecho! Arrastra tu galleta al horno y presiona HORNEAR.",
      oven_baking: "El horno está en marcha. ⏳\nEsperemos a que suene la campana...",
      burn_warning: "¡Ding! 🔔 ¡Está lista!\nNo toques nada: ¡mira qué pasa si nos descuidamos!",
      trash_burnt: "¡Ups, se nos quemó! 🔥 No pasa nada: sácala y tírala al BASURERO 🗑️.",
      stock_warning: "¡Buen descarte! 🗑️ Cada masa que usas o tiras gasta despensa.",
      stock_restock: "Aquí te repondré yo; en días normales compras en la TIENDA.",
      wrong_delivery: "¿Qué pasa si servimos masa cruda? ¡Probemos a propósito en la BANDEJA!",
      wrong_feedback: "¡Cliente enojado! 😾 Tranqui, no hay Game Over: puedes corregir la orden.",
      drink_cup: "¡Hora del café! Arrastra una taza vacía a la cafetera.",
      drink_brew: "¡Toca el botón CAFÉ ☕ para preparar café fresco!",
      drink_tray: "¡Aromático! Arrastra el café listo a la BANDEJA.",
      perfect_bake: "Galleta ideal: Masa Clásica -> Molde Estrella -> Horno -> ¡Hornear!",
      perfect_extract: "¡Ding! 🔔 ¡Sácala dorada y arrástrala a la BANDEJA DE ENTREGA!",
      deliver_order: "¡Atención a la paciencia! ⏱️ Rápido da más propina 🪙\n¡Toca la bandeja para servir!",
      celebration: "¡Miau-ravilloso! 🐾✨ ¡Todo listo!\n¡A hornear y triunfar en Kiwipaw Bakehouse!"
    }
  }
};
