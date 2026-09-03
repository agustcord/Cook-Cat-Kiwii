/**
 * TutorialSteps.js
 * 
 * Diccionario declarativo y máquina de micropasos del sistema de tutorial interactivo (Día 1).
 * Organizado en 6 bloques pedagógicos progresivos con errores forzados y redes de seguridad:
 * 1. Primeros Pasos & Corte de Masa (Cliente 1)
 * 2. ERROR FORZADO #1: Quemado en Horno & Descarte en Basurero
 * 3. ERROR FORZADO #2: Gestión de Stock & Auto-Restock Asistido
 * 4. ERROR FORZADO #3: Entrega Incorrecta & Tolerancia sin Game Over
 * 5. Preparación de Bebida, Horneado Perfecto y Cierre Cliente 1
 * 6. Toppings & Café con Leche (Cliente 2)
 * 
 * Cook Gatos Kiwii
 */

export const TUTORIAL_STEPS = [
  // ==========================================
  // BLOQUE 1: Primeros Pasos & Corte de Masa
  // ==========================================
  {
    id: 'step_welcome',
    block: 1,
    i18nKey: 'tutorial.steps.welcome',
    targetKey: 'customer',
    targetCoords: { x: 960, y: 431, width: 320, height: 320 },
    allowedAction: 'DIALOG_ACK',
    showNextBtn: true,
    showPointer: false,
    triggerEvent: 'game:dialog_acknowledged',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_dough_classic',
    block: 1,
    i18nKey: 'tutorial.steps.doughClassic',
    sourceTargetKey: 'dough_classic',
    destinationTargetKey: 'prep_table',
    targetKey: 'dough_classic',
    sourceCoords: { x: 148, y: 684, width: 168, height: 116 },
    destinationCoords: { x: 960, y: 911, width: 375, height: 169 },
    targetCoords: { x: 148, y: 684, width: 168, height: 116 },
    allowedAction: 'DRAG_DOUGH',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:dough_placed',
    validation: (data) => !data || ((data.base === undefined || data.base === 'classic') && (data.destination === undefined || data.destination === 'prep_table')),
    bubblePosition: 'top'
  },
  {
    id: 'step_shape_star',
    block: 1,
    i18nKey: 'tutorial.steps.shapeStar',
    sourceTargetKey: 'shape_star',
    destinationTargetKey: 'table_cookie',
    targetKey: 'shape_star',
    sourceCoords: { x: 384, y: 721, width: 110, height: 110 },
    destinationCoords: { x: 960, y: 911, width: 120, height: 120 },
    targetCoords: { x: 384, y: 721, width: 110, height: 110 },
    allowedAction: 'DRAG_SHAPE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:shape_applied',
    validation: (data) => !data || ((data.shape === undefined || data.shape === 'star') && (data.target === undefined || data.target === 'table_cookie' || data.target === 'prep_cookie')),
    bubblePosition: 'top'
  },

  // ==========================================
  // BLOQUE 2: ERROR FORZADO #1 - Horno & Quemado
  // ==========================================
  {
    id: 'step_oven_power',
    block: 2,
    i18nKey: 'tutorial.steps.ovenPower',
    targetKey: 'oven_power',
    targetCoords: { x: 1375, y: 261.5, width: 60, height: 60 },
    allowedAction: 'CLICK_POWER',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:oven_power',
    validation: (data) => !data || data.isPreheated === undefined || data.isPreheated === true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_cookie_to_oven',
    block: 2,
    i18nKey: 'tutorial.steps.cookieToOven',
    sourceTargetKey: 'table_cookie',
    destinationTargetKey: 'oven_door',
    targetKey: 'table_cookie',
    sourceCoords: { x: 960, y: 911, width: 120, height: 120 },
    destinationCoords: { x: 1499, y: 475, width: 306, height: 249 },
    targetCoords: { x: 960, y: 911, width: 120, height: 120 },
    allowedAction: 'LOAD_OVEN',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_loaded_oven',
    validation: (data) => !data || data.destination === undefined || data.destination === 'oven' || data.destination === 'oven_door' || data.item === 'prep_tray' || data.item === 'table_cookie',
    bubblePosition: 'top'
  },
  {
    id: 'step_oven_bake',
    block: 2,
    i18nKey: 'tutorial.steps.ovenBake',
    targetKey: 'oven_bake',
    targetCoords: { x: 1434, y: 261.5, width: 60, height: 60 },
    allowedAction: 'CLICK_BAKE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:oven_bake_start',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_oven_baking',
    block: 2,
    i18nKey: 'tutorial.steps.ovenBaking',
    targetKey: 'oven_timer',
    targetCoords: { x: 1535, y: 261.5, width: 160, height: 60 },
    allowedAction: 'WAIT_BAKE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:oven_bell',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_oven_bell',
    block: 2,
    i18nKey: 'tutorial.steps.ovenBell',
    targetKey: 'oven_timer',
    targetCoords: { x: 1535, y: 261.5, width: 160, height: 60 },
    allowedAction: 'WAIT_BURN',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_burnt',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_burnt_extract',
    block: 2,
    i18nKey: 'tutorial.steps.burntExtract',
    targetKey: 'oven_extract',
    targetCoords: { x: 1494, y: 717, width: 210, height: 60 },
    allowedAction: 'CLICK_EXTRACT',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_extracted',
    validation: (data) => true,
    bubblePosition: 'top'
  },
  {
    id: 'step_burnt_trash',
    block: 2,
    i18nKey: 'tutorial.steps.burntTrash',
    sourceTargetKey: 'table_cookie',
    destinationTargetKey: 'trash_bin',
    targetKey: 'table_cookie',
    sourceCoords: { x: 960, y: 911, width: 120, height: 120 },
    destinationCoords: { x: 619, y: 911, width: 234, height: 164 },
    targetCoords: { x: 960, y: 911, width: 120, height: 120 },
    allowedAction: 'DRAG_TRASH',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_trashed',
    validation: (data) => !data || ((data.destination === undefined || data.destination === 'trash' || data.destination === 'trash_bin') && (data.item === undefined || data.item === 'table_cookie' || data.item === 'prep_cookie' || typeof data.item === 'object' || data.cookie !== undefined)),
    bubblePosition: 'top'
  },

  // ==========================================
  // BLOQUE 3: ERROR FORZADO #2 - Control de Stock
  // ==========================================
  {
    id: 'step_stock_explanation',
    block: 3,
    i18nKey: 'tutorial.steps.stockExplanation',
    targetKey: 'stock_dough_classic',
    targetCoords: { x: 148, y: 750, width: 140, height: 50 },
    allowedAction: 'DIALOG_ACK',
    showNextBtn: true,
    showPointer: false,
    triggerEvent: 'game:dialog_acknowledged',
    validation: (data) => true,
    bubblePosition: 'top'
  },

  // ==========================================
  // BLOQUE 4: ERROR FORZADO #3 - Entrega Incorrecta
  // ==========================================
  {
    id: 'step_wrong_delivery_intro',
    block: 4,
    i18nKey: 'tutorial.steps.wrongDeliveryIntro',
    sourceTargetKey: 'dough_classic',
    destinationTargetKey: 'prep_table',
    targetKey: 'dough_classic',
    sourceCoords: { x: 148, y: 684, width: 168, height: 116 },
    destinationCoords: { x: 960, y: 911, width: 375, height: 169 },
    targetCoords: { x: 148, y: 684, width: 168, height: 116 },
    allowedAction: 'DRAG_DOUGH',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:dough_placed',
    validation: (data) => !data || ((data.base === undefined || data.base === 'classic') && (data.destination === undefined || data.destination === 'prep_table')),
    bubblePosition: 'top'
  },
  {
    id: 'step_wrong_delivery_to_tray',
    block: 4,
    i18nKey: 'tutorial.steps.wrongDeliveryToTray',
    sourceTargetKey: 'table_cookie',
    destinationTargetKey: 'delivery_tray',
    targetKey: 'table_cookie',
    sourceCoords: { x: 960, y: 911, width: 120, height: 120 },
    destinationCoords: { x: 1037, y: 675, width: 375, height: 94 },
    targetCoords: { x: 960, y: 911, width: 120, height: 120 },
    allowedAction: 'DRAG_COOKIE_TRAY',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_to_tray',
    validation: (data) => !data || data.destination === undefined || data.destination === 'delivery_tray',
    bubblePosition: 'top'
  },
  {
    id: 'step_wrong_delivery_serve',
    block: 4,
    i18nKey: 'tutorial.steps.wrongDeliveryServe',
    sourceTargetKey: 'delivery_tray',
    destinationTargetKey: 'customer',
    targetKey: 'delivery_tray',
    sourceCoords: { x: 1037, y: 675, width: 375, height: 94 },
    destinationCoords: { x: 960, y: 431, width: 320, height: 320 },
    targetCoords: { x: 1037, y: 675, width: 375, height: 94 },
    allowedAction: 'DELIVER_ORDER',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:tray_delivered',
    validation: (data) => !data || ((data.destination === undefined || data.destination === 'customer') && (data.rejected === undefined || data.rejected === true)),
    bubblePosition: 'top'
  },
  {
    id: 'step_wrong_delivery_clean',
    block: 4,
    i18nKey: 'tutorial.steps.wrongDeliveryClean',
    sourceTargetKey: 'delivery_tray',
    destinationTargetKey: 'trash_bin',
    targetKey: 'delivery_tray',
    sourceCoords: { x: 1037, y: 675, width: 375, height: 94 },
    destinationCoords: { x: 619, y: 911, width: 234, height: 164 },
    targetCoords: { x: 1037, y: 675, width: 375, height: 94 },
    allowedAction: 'DRAG_TRASH',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:tray_trashed',
    validation: (data) => !data || ((data.destination === undefined || data.destination === 'trash' || data.destination === 'trash_bin') && (data.item === undefined || data.item === 'delivery_tray')),
    bubblePosition: 'top'
  },

  // ==========================================
  // BLOQUE 5: Preparación de Bebida, Horneado Perfecto & Cierre Cliente 1
  // ==========================================
  {
    id: 'step_drink_cup',
    block: 5,
    i18nKey: 'tutorial.steps.drinkCup',
    sourceTargetKey: 'cup_stack',
    destinationTargetKey: 'drink_machine',
    targetKey: 'cup_stack',
    sourceCoords: { x: 431, y: 347, width: 70, height: 60 },
    destinationCoords: { x: 351, y: 507, width: 320, height: 320 },
    targetCoords: { x: 431, y: 347, width: 70, height: 60 },
    allowedAction: 'DRAG_CUP',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cup_placed',
    validation: (data) => !data || data.destination === undefined || data.destination === 'drink_machine',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_drink_coffee_btn',
    block: 5,
    i18nKey: 'tutorial.steps.drinkCoffeeBtn',
    targetKey: 'btn_coffee',
    targetCoords: { x: 287, y: 424, width: 83, height: 68 },
    allowedAction: 'CLICK_COFFEE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:drink_brewed',
    validation: (data) => !data || data.drink === undefined || data.drink === 'coffee' || data.type === 'coffee_beans' || data.type === 'coffee',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_drink_to_tray',
    block: 5,
    i18nKey: 'tutorial.steps.drinkToTray',
    sourceTargetKey: 'drink_machine',
    destinationTargetKey: 'delivery_tray',
    targetKey: 'drink_machine',
    sourceCoords: { x: 351, y: 507, width: 320, height: 320 },
    destinationCoords: { x: 1037, y: 675, width: 375, height: 94 },
    targetCoords: { x: 351, y: 507, width: 320, height: 320 },
    allowedAction: 'DRAG_DRINK_TRAY',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:drink_to_tray',
    validation: (data) => !data || data.destination === undefined || data.destination === 'delivery_tray',
    bubblePosition: 'top'
  },
  {
    id: 'step_perfect_dough',
    block: 5,
    i18nKey: 'tutorial.steps.perfectDough',
    sourceTargetKey: 'dough_classic',
    destinationTargetKey: 'prep_table',
    targetKey: 'dough_classic',
    sourceCoords: { x: 148, y: 684, width: 168, height: 116 },
    destinationCoords: { x: 960, y: 911, width: 375, height: 169 },
    targetCoords: { x: 148, y: 684, width: 168, height: 116 },
    allowedAction: 'DRAG_DOUGH',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:dough_placed',
    validation: (data) => !data || ((data.base === undefined || data.base === 'classic') && (data.destination === undefined || data.destination === 'prep_table')),
    bubblePosition: 'top'
  },
  {
    id: 'step_perfect_shape',
    block: 5,
    i18nKey: 'tutorial.steps.perfectShape',
    sourceTargetKey: 'shape_star',
    destinationTargetKey: 'table_cookie',
    targetKey: 'shape_star',
    sourceCoords: { x: 384, y: 721, width: 110, height: 110 },
    destinationCoords: { x: 960, y: 911, width: 120, height: 120 },
    targetCoords: { x: 384, y: 721, width: 110, height: 110 },
    allowedAction: 'DRAG_SHAPE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:shape_applied',
    validation: (data) => !data || ((data.shape === undefined || data.shape === 'star') && (data.target === undefined || data.target === 'table_cookie' || data.target === 'prep_cookie')),
    bubblePosition: 'top'
  },
  {
    id: 'step_perfect_oven_load',
    block: 5,
    i18nKey: 'tutorial.steps.perfectOvenLoad',
    sourceTargetKey: 'table_cookie',
    destinationTargetKey: 'oven_door',
    targetKey: 'table_cookie',
    sourceCoords: { x: 960, y: 911, width: 120, height: 120 },
    destinationCoords: { x: 1499, y: 475, width: 306, height: 249 },
    targetCoords: { x: 960, y: 911, width: 120, height: 120 },
    allowedAction: 'LOAD_OVEN',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_loaded_oven',
    validation: (data) => !data || data.destination === undefined || data.destination === 'oven' || data.destination === 'oven_door' || data.item === 'prep_tray' || data.item === 'table_cookie',
    bubblePosition: 'top'
  },
  {
    id: 'step_perfect_oven_bake',
    block: 5,
    i18nKey: 'tutorial.steps.perfectOvenBake',
    targetKey: 'oven_bake',
    targetCoords: { x: 1434, y: 261.5, width: 60, height: 60 },
    allowedAction: 'CLICK_BAKE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:oven_bake_start',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_perfect_oven_extract',
    block: 5,
    i18nKey: 'tutorial.steps.perfectOvenExtract',
    targetKey: 'oven_extract',
    targetCoords: { x: 1494, y: 717, width: 210, height: 60 },
    allowedAction: 'CLICK_EXTRACT',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_extracted',
    validation: (data) => !data || !data.cookies || (Array.isArray(data.cookies) && data.cookies.some(c => c.bakedState === 'baked')),
    bubblePosition: 'top'
  },
  {
    id: 'step_perfect_cookie_to_tray',
    block: 5,
    i18nKey: 'tutorial.steps.perfectCookieToTray',
    sourceTargetKey: 'table_cookie',
    destinationTargetKey: 'delivery_tray',
    targetKey: 'table_cookie',
    sourceCoords: { x: 960, y: 911, width: 120, height: 120 },
    destinationCoords: { x: 1037, y: 675, width: 375, height: 94 },
    targetCoords: { x: 960, y: 911, width: 120, height: 120 },
    allowedAction: 'DRAG_COOKIE_TRAY',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_to_tray',
    validation: (data) => !data || data.destination === undefined || data.destination === 'delivery_tray',
    bubblePosition: 'top'
  },
  {
    id: 'step_patience_delivery',
    block: 5,
    i18nKey: 'tutorial.steps.patienceDelivery',
    sourceTargetKey: 'delivery_tray',
    destinationTargetKey: 'customer',
    targetKey: 'delivery_tray',
    sourceCoords: { x: 1037, y: 675, width: 375, height: 94 },
    destinationCoords: { x: 960, y: 431, width: 320, height: 320 },
    targetCoords: { x: 1037, y: 675, width: 375, height: 94 },
    allowedAction: 'DELIVER_ORDER',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:tray_delivered',
    validation: (data) => !data || ((data.destination === undefined || data.destination === 'customer') && (data.success === undefined || data.success === true)),
    bubblePosition: 'top'
  },
  {
    id: 'step_client1_farewell',
    block: 5,
    i18nKey: 'tutorial.steps.client1Farewell',
    targetKey: 'customer',
    targetCoords: { x: 960, y: 431, width: 320, height: 320 },
    allowedAction: 'DIALOG_ACK',
    showNextBtn: true,
    showPointer: false,
    triggerEvent: 'game:dialog_acknowledged',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },

  // ==========================================
  // BLOQUE 6: Toppings & Café con Leche (Cliente 2)
  // ==========================================
  {
    id: 'step_client2_intro',
    block: 6,
    i18nKey: 'tutorial.steps.client2Intro',
    targetKey: 'customer',
    targetCoords: { x: 960, y: 431, width: 320, height: 320 },
    allowedAction: 'DIALOG_ACK',
    showNextBtn: true,
    showPointer: false,
    triggerEvent: 'game:dialog_acknowledged',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_client2_dough',
    block: 6,
    i18nKey: 'tutorial.steps.client2Dough',
    sourceTargetKey: 'dough_classic',
    destinationTargetKey: 'prep_table',
    targetKey: 'dough_classic',
    sourceCoords: { x: 148, y: 684, width: 168, height: 116 },
    destinationCoords: { x: 960, y: 911, width: 375, height: 169 },
    targetCoords: { x: 148, y: 684, width: 168, height: 116 },
    allowedAction: 'DRAG_DOUGH',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:dough_placed',
    validation: (data) => !data || ((data.base === undefined || data.base === 'classic') && (data.destination === undefined || data.destination === 'prep_table')),
    bubblePosition: 'top'
  },
  {
    id: 'step_client2_shape',
    block: 6,
    i18nKey: 'tutorial.steps.client2Shape',
    sourceTargetKey: 'shape_star',
    destinationTargetKey: 'table_cookie',
    targetKey: 'shape_star',
    sourceCoords: { x: 384, y: 721, width: 110, height: 110 },
    destinationCoords: { x: 960, y: 911, width: 120, height: 120 },
    targetCoords: { x: 384, y: 721, width: 110, height: 110 },
    allowedAction: 'DRAG_SHAPE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:shape_applied',
    validation: (data) => !data || ((data.shape === undefined || data.shape === 'star') && (data.target === undefined || data.target === 'table_cookie' || data.target === 'prep_cookie')),
    bubblePosition: 'top'
  },
  {
    id: 'step_client2_oven_load',
    block: 6,
    i18nKey: 'tutorial.steps.client2OvenLoad',
    sourceTargetKey: 'table_cookie',
    destinationTargetKey: 'oven_door',
    targetKey: 'table_cookie',
    sourceCoords: { x: 960, y: 911, width: 120, height: 120 },
    destinationCoords: { x: 1499, y: 475, width: 306, height: 249 },
    targetCoords: { x: 960, y: 911, width: 120, height: 120 },
    allowedAction: 'LOAD_OVEN',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_loaded_oven',
    validation: (data) => !data || data.destination === undefined || data.destination === 'oven' || data.destination === 'oven_door' || data.item === 'prep_tray' || data.item === 'table_cookie',
    bubblePosition: 'top'
  },
  {
    id: 'step_client2_oven_bake',
    block: 6,
    i18nKey: 'tutorial.steps.client2OvenBake',
    targetKey: 'oven_bake',
    targetCoords: { x: 1434, y: 261.5, width: 60, height: 60 },
    allowedAction: 'CLICK_BAKE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:oven_bake_start',
    validation: (data) => true,
    bubblePosition: 'bottom'
  },
  {
    id: 'step_client2_oven_extract',
    block: 6,
    i18nKey: 'tutorial.steps.client2OvenExtract',
    targetKey: 'oven_extract',
    targetCoords: { x: 1494, y: 717, width: 210, height: 60 },
    allowedAction: 'CLICK_EXTRACT',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_extracted',
    validation: (data) => !data || !data.cookies || (Array.isArray(data.cookies) && data.cookies.some(c => c.bakedState === 'baked')),
    bubblePosition: 'top'
  },
  {
    id: 'step_topping_sprinkles',
    block: 6,
    i18nKey: 'tutorial.steps.toppingSprinkles',
    sourceTargetKey: 'topping_sprinkles',
    destinationTargetKey: 'table_cookie',
    targetKey: 'topping_sprinkles',
    sourceCoords: { x: 1767, y: 660, width: 158, height: 158 },
    destinationCoords: { x: 960, y: 911, width: 120, height: 120 },
    targetCoords: { x: 1767, y: 660, width: 158, height: 158 },
    allowedAction: 'DRAG_TOPPING',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:topping_applied',
    validation: (data) => !data || ((data.topping === undefined || data.topping === 'sprinkles') && (data.target === undefined || data.target === 'table_cookie' || data.target === 'prep_cookie')),
    bubblePosition: 'top'
  },
  {
    id: 'step_client2_cookie_to_tray',
    block: 6,
    i18nKey: 'tutorial.steps.client2CookieToTray',
    sourceTargetKey: 'table_cookie',
    destinationTargetKey: 'delivery_tray',
    targetKey: 'table_cookie',
    sourceCoords: { x: 960, y: 911, width: 120, height: 120 },
    destinationCoords: { x: 1037, y: 675, width: 375, height: 94 },
    targetCoords: { x: 960, y: 911, width: 120, height: 120 },
    allowedAction: 'DRAG_COOKIE_TRAY',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cookie_to_tray',
    validation: (data) => !data || data.destination === undefined || data.destination === 'delivery_tray',
    bubblePosition: 'top'
  },
  {
    id: 'step_client2_cup',
    block: 6,
    i18nKey: 'tutorial.steps.client2Cup',
    sourceTargetKey: 'cup_stack',
    destinationTargetKey: 'drink_machine',
    targetKey: 'cup_stack',
    sourceCoords: { x: 431, y: 347, width: 70, height: 60 },
    destinationCoords: { x: 351, y: 507, width: 320, height: 320 },
    targetCoords: { x: 431, y: 347, width: 70, height: 60 },
    allowedAction: 'DRAG_CUP',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:cup_placed',
    validation: (data) => !data || data.destination === undefined || data.destination === 'drink_machine',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_client2_coffee',
    block: 6,
    i18nKey: 'tutorial.steps.client2Coffee',
    targetKey: 'btn_coffee',
    targetCoords: { x: 287, y: 424, width: 83, height: 68 },
    allowedAction: 'CLICK_COFFEE',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:drink_brewed',
    validation: (data) => !data || data.drink === undefined || data.drink === 'coffee' || data.type === 'coffee_beans' || data.type === 'coffee',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_client2_milk_mix',
    block: 6,
    i18nKey: 'tutorial.steps.client2MilkMix',
    targetKey: 'btn_milk',
    targetCoords: { x: 385, y: 422, width: 83, height: 68 },
    allowedAction: 'CLICK_MILK',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:drink_brewed',
    validation: (data) => !data || data.drink === undefined || data.drink === 'coffee_milk' || data.type === 'coffee_milk' || data.drink === 'milk' || data.type === 'milk',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_client2_drink_to_tray',
    block: 6,
    i18nKey: 'tutorial.steps.client2DrinkToTray',
    sourceTargetKey: 'drink_machine',
    destinationTargetKey: 'delivery_tray',
    targetKey: 'drink_machine',
    sourceCoords: { x: 351, y: 507, width: 320, height: 320 },
    destinationCoords: { x: 1037, y: 675, width: 375, height: 94 },
    targetCoords: { x: 351, y: 507, width: 320, height: 320 },
    allowedAction: 'DRAG_DRINK_TRAY',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:drink_to_tray',
    validation: (data) => !data || data.destination === undefined || data.destination === 'delivery_tray',
    bubblePosition: 'top'
  },
  {
    id: 'step_client2_delivery',
    block: 6,
    i18nKey: 'tutorial.steps.client2Delivery',
    sourceTargetKey: 'delivery_tray',
    destinationTargetKey: 'customer',
    targetKey: 'delivery_tray',
    sourceCoords: { x: 1037, y: 675, width: 375, height: 94 },
    destinationCoords: { x: 960, y: 431, width: 320, height: 320 },
    targetCoords: { x: 1037, y: 675, width: 375, height: 94 },
    allowedAction: 'DELIVER_ORDER',
    showNextBtn: false,
    showPointer: true,
    triggerEvent: 'game:tray_delivered',
    validation: (data) => !data || ((data.destination === undefined || data.destination === 'customer') && (data.success === undefined || data.success === true)),
    bubblePosition: 'top'
  },
  {
    id: 'step_tutorial_complete',
    block: 6,
    i18nKey: 'tutorial.steps.complete',
    targetKey: 'customer',
    targetCoords: { x: 960, y: 431, width: 320, height: 320 },
    allowedAction: 'DIALOG_ACK',
    showNextBtn: true,
    showPointer: false,
    triggerEvent: 'game:dialog_acknowledged',
    validation: (data) => true,
    bubblePosition: 'bottom'
  }
];

/**
 * Obtiene un paso por su ID único.
 * @param {string} id - Identificador del paso
 * @returns {Object|undefined}
 */
export function getStepById(id) {
  return TUTORIAL_STEPS.find(step => step.id === id);
}

/**
 * Retorna todos los pasos correspondientes a un bloque pedagógico específico (1 a 6).
 * @param {number} block - Número del bloque (1..6)
 * @returns {Array<Object>}
 */
export function getStepsByBlock(block) {
  return TUTORIAL_STEPS.filter(step => step.block === block);
}

export default {
  TUTORIAL_STEPS,
  getStepById,
  getStepsByBlock
};
