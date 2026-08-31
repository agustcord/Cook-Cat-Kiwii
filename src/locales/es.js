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
  }
};
