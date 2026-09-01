/**
 * TutorialSteps.js
 * 
 * Diccionario declarativo y máquina de micropasos del sistema de tutorial interactivo (Día 1).
 * Organizado en 5 bloques pedagógicos progresivos con errores forzados y redes de seguridad:
 * 1. Primeros Pasos & Corte de Masa (Cliente 1)
 * 2. ERROR FORZADO #1: Quemado en Horno & Descarte en Basurero
 * 3. ERROR FORZADO #2: Gestión de Stock & Auto-Restock Asistido
 * 4. ERROR FORZADO #3: Entrega Incorrecta & Tolerancia sin Game Over
 * 5. Preparación de Bebida, Horneado Perfecto y Victoria del Día 1
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
    triggerEvent: 'game:dialog_acknowledged',
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
    triggerEvent: 'game:dough_placed',
    validation: (data) => !data || data.base === 'classic',
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
    triggerEvent: 'game:shape_applied',
    validation: (data) => !data || data.shape === 'star',
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
    triggerEvent: 'game:oven_power',
    validation: (data) => !data || data.isPreheated === true,
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
    triggerEvent: 'game:cookie_loaded_oven',
    bubblePosition: 'top'
  },
  {
    id: 'step_oven_bake',
    block: 2,
    i18nKey: 'tutorial.steps.ovenBake',
    targetKey: 'oven_bake',
    targetCoords: { x: 1434, y: 261.5, width: 60, height: 60 },
    allowedAction: 'CLICK_BAKE',
    triggerEvent: 'game:oven_bake_start',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_burn_wait',
    block: 2,
    i18nKey: 'tutorial.steps.burnWait',
    targetKey: 'oven_timer',
    targetCoords: { x: 1535, y: 261.5, width: 160, height: 60 },
    allowedAction: 'WAIT_BURN',
    triggerEvent: 'game:cookie_burnt',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_burnt_extract',
    block: 2,
    i18nKey: 'tutorial.steps.burntExtract',
    targetKey: 'oven_extract',
    targetCoords: { x: 1494, y: 717, width: 210, height: 60 },
    allowedAction: 'CLICK_EXTRACT',
    triggerEvent: 'game:cookie_extracted',
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
    triggerEvent: 'game:cookie_trashed',
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
    triggerEvent: 'game:dialog_acknowledged',
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
    triggerEvent: 'game:dough_placed',
    validation: (data) => !data || data.base === 'classic',
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
    triggerEvent: 'game:cookie_to_tray',
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
    triggerEvent: 'game:tray_delivered',
    validation: (data) => !data || data.rejected === true,
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
    triggerEvent: 'game:tray_trashed',
    bubblePosition: 'top'
  },

  // ==========================================
  // BLOQUE 5: Bebida, Horneado Perfecto & Victoria
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
    triggerEvent: 'game:cup_placed',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_drink_coffee_btn',
    block: 5,
    i18nKey: 'tutorial.steps.drinkCoffeeBtn',
    targetKey: 'btn_coffee',
    targetCoords: { x: 287, y: 424, width: 83, height: 68 },
    allowedAction: 'CLICK_COFFEE',
    triggerEvent: 'game:drink_brewed',
    validation: (data) => !data || data.drink === 'coffee' || data.type === 'coffee_beans',
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
    triggerEvent: 'game:drink_to_tray',
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
    triggerEvent: 'game:dough_placed',
    validation: (data) => !data || data.base === 'classic',
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
    triggerEvent: 'game:shape_applied',
    validation: (data) => !data || data.shape === 'star',
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
    triggerEvent: 'game:cookie_loaded_oven',
    bubblePosition: 'top'
  },
  {
    id: 'step_perfect_oven_bake',
    block: 5,
    i18nKey: 'tutorial.steps.perfectOvenBake',
    targetKey: 'oven_bake',
    targetCoords: { x: 1434, y: 261.5, width: 60, height: 60 },
    allowedAction: 'CLICK_BAKE',
    triggerEvent: 'game:oven_bake_start',
    bubblePosition: 'bottom'
  },
  {
    id: 'step_perfect_oven_extract',
    block: 5,
    i18nKey: 'tutorial.steps.perfectOvenExtract',
    targetKey: 'oven_extract',
    targetCoords: { x: 1494, y: 717, width: 210, height: 60 },
    allowedAction: 'CLICK_EXTRACT',
    triggerEvent: 'game:cookie_extracted',
    validation: (data) => !data || (Array.isArray(data.cookies) && data.cookies.some(c => c.bakedState === 'baked')),
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
    triggerEvent: 'game:cookie_to_tray',
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
    triggerEvent: 'game:tray_delivered',
    validation: (data) => !data || data.success === true,
    bubblePosition: 'top'
  },
  {
    id: 'step_tutorial_complete',
    block: 5,
    i18nKey: 'tutorial.steps.complete',
    targetKey: 'customer',
    targetCoords: { x: 960, y: 431, width: 320, height: 320 },
    allowedAction: 'DIALOG_ACK',
    triggerEvent: 'game:dialog_acknowledged',
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
 * Retorna todos los pasos correspondientes a un bloque pedagógico específico (1 a 5).
 * @param {number} block - Número del bloque (1..5)
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
