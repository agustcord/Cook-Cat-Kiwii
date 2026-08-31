import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Cookie from '../src/game/Cookie.js';

describe('Oven Station & Cookie Baking Integration & Logic Matrix', () => {
  const projectRoot = process.cwd();
  const hornoAssetsDir = path.join(projectRoot, 'public', 'assets', 'horno');
  const bootScenePath = path.join(projectRoot, 'src', 'scenes', 'BootScene.js');
  const gameScenePath = path.join(projectRoot, 'src', 'scenes', 'GameScene.js');

  const expectedOvenAssets = [
    'horno_base.png',
    'cristal_horno_apagado.png',
    'cristal_horno_encendido.png',
    'indicador_de_coccion.png',
    'perilla_indicador_de_coccion.png',
    'boton_encendido_apagado.png',
    'boton_encendido_encendido.png',
    'boton_cocinando_apagado.png',
    'boton_cocinando_encendido.png'
  ];

  test('Todos los 9 assets multicapa del horno existen en public/assets/horno/ y son 400x449', () => {
    expectedOvenAssets.forEach(filename => {
      const assetPath = path.join(hornoAssetsDir, filename);
      assert.ok(fs.existsSync(assetPath), `${filename} debe existir en public/assets/horno/`);
      const buf = fs.readFileSync(assetPath);
      assert.ok(buf.length > 0, `${filename} no debe estar vacío`);
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      assert.equal(width, 400, `${filename} ancho debe ser 400`);
      assert.equal(height, 449, `${filename} alto debe ser 449`);
    });
  });

  test('BootScene precarga todos los assets del horno multicapa', () => {
    const bootContent = fs.readFileSync(bootScenePath, 'utf8');
    assert.ok(bootContent.includes("'oven_base'"), 'Debe precargar oven_base');
    assert.ok(bootContent.includes("'oven_glass_off'"), 'Debe precargar oven_glass_off');
    assert.ok(bootContent.includes("'oven_glass_on'"), 'Debe precargar oven_glass_on');
    assert.ok(bootContent.includes("'oven_timer_base'"), 'Debe precargar oven_timer_base');
    assert.ok(bootContent.includes("'oven_timer_knob'"), 'Debe precargar oven_timer_knob');
    assert.ok(bootContent.includes("'oven_btn_power_off'"), 'Debe precargar oven_btn_power_off');
    assert.ok(bootContent.includes("'oven_btn_power_on'"), 'Debe precargar oven_btn_power_on');
    assert.ok(bootContent.includes("'oven_btn_bake_off'"), 'Debe precargar oven_btn_bake_off');
    assert.ok(bootContent.includes("'oven_btn_bake_on'"), 'Debe precargar oven_btn_bake_on');
  });

  test('GameScene define métodos de interacción y estado del horno', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    assert.ok(gameContent.includes('createOvenStation('), 'Debe contener createOvenStation');
    assert.ok(gameContent.includes('handleOvenBakeClick('), 'Debe contener handleOvenBakeClick');
    assert.ok(gameContent.includes('handleOvenPowerClick('), 'Debe contener handleOvenPowerClick');
    assert.ok(gameContent.includes('handleOvenImageClick('), 'Debe contener handleOvenImageClick');
    assert.ok(gameContent.includes('handleOvenClick('), 'Debe contener handleOvenClick');
    assert.ok(gameContent.includes('evaluateCookiesInOven('), 'Debe contener evaluateCookiesInOven');
  });

  test('El cursor de la pata de gato permite alcanzar la altura de los botones del horno (Y <= 260)', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    // El clamp de Y no debe bloquear el acceso a los botones en Y=261.5
    assert.ok(
      gameContent.includes('Math.max(220, pointer.y)') || gameContent.includes('Math.max(200, pointer.y)'),
      'El clamp vertical del cursor debe permitir alcanzar los botones superiores del horno'
    );
  });

  test('handleOvenBakeClick respeta la mecánica del Capitán: exige precalentado previo y galletas cargadas', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    const bakeClickFnIndex = gameContent.indexOf('handleOvenBakeClick() {');
    assert.ok(bakeClickFnIndex !== -1);
    const bakeClickFn = gameContent.slice(bakeClickFnIndex, gameContent.indexOf('evaluateCookiesInOven()', bakeClickFnIndex));
    
    // Debe bloquear con '¡Primero enciende el horno!' si no está precalentado
    assert.ok(
      bakeClickFn.includes("turnOnOvenFirst") || bakeClickFn.includes("this.showFeedbackText('¡Primero enciende el horno!'"),
      'handleOvenBakeClick debe exigir encendido/precalentado previo'
    );
    // Debe validar existencia de galletas en el horno
    assert.ok(
      bakeClickFn.includes("ovenEmpty") || bakeClickFn.includes("this.showFeedbackText('¡El horno está vacío!'"),
      'handleOvenBakeClick debe rechazar hornear si el horno está vacío'
    );
    // Debe cambiar texturas a estado activo (_on)
    assert.ok(
      bakeClickFn.includes("'oven_btn_bake_on'"),
      'handleOvenBakeClick debe activar textura oven_btn_bake_on'
    );
    assert.ok(
      bakeClickFn.includes("'oven_glass_on'"),
      'handleOvenBakeClick debe activar textura oven_glass_on'
    );
  });

  test('handleOvenPowerClick gestiona precalentado y estados visuales del botón power', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    const powerClickFnIndex = gameContent.indexOf('handleOvenPowerClick() {');
    assert.ok(powerClickFnIndex !== -1);
    const powerClickFn = gameContent.slice(powerClickFnIndex, gameContent.indexOf('handleOvenBakeClick()', powerClickFnIndex));
    
    assert.ok(powerClickFn.includes("'oven_btn_power_on'"), 'handleOvenPowerClick debe activar textura oven_btn_power_on');
    assert.ok(powerClickFn.includes("'oven_btn_power_off'"), 'handleOvenPowerClick debe restaurar textura oven_btn_power_off');
    assert.ok(powerClickFn.includes('this.isOvenPreheated = true'), 'handleOvenPowerClick debe precalentar');
    assert.ok(powerClickFn.includes('this.isOvenPreheated = false'), 'handleOvenPowerClick debe apagar');
  });

  test('handleOvenClick delega a handleOvenPowerClick', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    const ovenClickFnIndex = gameContent.indexOf('handleOvenClick() {');
    assert.ok(ovenClickFnIndex !== -1);
    const ovenClickFn = gameContent.slice(ovenClickFnIndex, ovenClickFnIndex + 120);
    assert.ok(
      ovenClickFn.includes('this.handleOvenPowerClick()'),
      'handleOvenClick debe invocar handleOvenPowerClick'
    );
  });

  test('handleOvenImageClick detiene el zumbido del horno (stopOvenHum) si se extrae mientras hornea', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    const imgClickFnIndex = gameContent.indexOf('handleOvenImageClick() {');
    assert.ok(imgClickFnIndex !== -1);
    const imgClickFn = gameContent.slice(imgClickFnIndex, gameContent.indexOf('drawOvenExtractBtn(', imgClickFnIndex));
    assert.ok(
      imgClickFn.includes('SoundManager.getInstance().stopOvenHum()'),
      'handleOvenImageClick debe detener el zumbido del horno si estaba activo'
    );
  });

  describe('Simulación de Máquina de Estados del Horno (Flujo 100% de Horneado con Precalentado)', () => {
    class OvenMockSimulation {
      constructor() {
        this.config = { bakeMin: 5.5, bakeMax: 7.5 };
        this.isOvenPreheated = false;
        this.isBaking = false;
        this.cookiesInOven = [];
        this.prepTrayCookies = [];
        this.ovenTimeElapsed = 0;
        this.ovenOvercookTimer = 0;
        this.alarmPlayed = false;
        this.hasOvercookedAlarm = false;
        this.audioEvents = [];
        this.feedback = '';
        this.btnPowerTexture = 'oven_btn_power_off';
        this.btnBakeTexture = 'oven_btn_bake_off';
        this.glassTexture = 'oven_glass_off';
      }

      handleOvenPowerClick() {
        this.audioEvents.push('playOvenClick');
        if (!this.isOvenPreheated) {
          this.isOvenPreheated = true;
          this.btnPowerTexture = 'oven_btn_power_on';
          this.feedback = '¡Horno encendido (precalentando)! 🔥';
        } else {
          if (this.isBaking) {
            this.isBaking = false;
            this.audioEvents.push('stopOvenHum');
            this.btnBakeTexture = 'oven_btn_bake_off';
            this.glassTexture = 'oven_glass_off';
            this.evaluateCookiesInOven();
          }
          this.isOvenPreheated = false;
          this.btnPowerTexture = 'oven_btn_power_off';
          this.ovenTimeElapsed = 0;
          this.alarmPlayed = false;
          this.ovenOvercookTimer = 0;
          this.hasOvercookedAlarm = false;
          this.feedback = 'Horno apagado.';
        }
      }

      handleOvenBakeClick() {
        if (!this.isOvenPreheated) {
          this.audioEvents.push('playUiDenied');
          this.feedback = '¡Primero enciende el horno!';
          return;
        }

        if (!this.cookiesInOven || this.cookiesInOven.length === 0) {
          this.audioEvents.push('playUiDenied');
          this.feedback = '¡El horno está vacío!';
          return;
        }

        if (!this.isBaking) {
          this.isBaking = true;
          this.ovenTimeElapsed = 0;
          this.alarmPlayed = false;
          this.ovenOvercookTimer = 0;
          this.hasOvercookedAlarm = false;
          this.btnBakeTexture = 'oven_btn_bake_on';
          this.glassTexture = 'oven_glass_on';
          this.audioEvents.push('playBakingStart');
          this.feedback = '¡Cocinando galletas! ⏳';
        } else {
          this.isBaking = false;
          this.audioEvents.push('stopOvenHum');
          this.audioEvents.push('playOvenClick');
          this.btnBakeTexture = 'oven_btn_bake_off';
          this.glassTexture = 'oven_glass_off';
          this.evaluateCookiesInOven();
        }
      }

      update(deltaMs) {
        if (!this.isBaking) return;
        const elapsed = (deltaMs / 1000) * 1.15;
        this.ovenTimeElapsed += elapsed;
        const bakeDuration = this.config.bakeMin;

        this.cookiesInOven.forEach(cookie => {
          cookie.bakeTime = (cookie.bakeTime || 0) + elapsed;
          if (cookie.bakeTime >= bakeDuration && cookie.bakedState !== 'burnt') {
            cookie.bakedState = 'baked';
          }
        });

        const progress = Math.min(1.0, this.ovenTimeElapsed / bakeDuration);
        if (progress >= 1.0 && !this.alarmPlayed) {
          this.alarmPlayed = true;
          this.ovenOvercookTimer = 0;
          this.btnBakeTexture = 'oven_btn_bake_off';
          this.glassTexture = 'oven_glass_off';
          this.audioEvents.push('stopOvenHum');
          this.audioEvents.push('playOvenBellReady');
          this.feedback = '¡Galletas listas! 🍪';
        } else if (this.alarmPlayed) {
          this.ovenOvercookTimer += (deltaMs / 1000);
          if (this.ovenOvercookTimer >= 5.0 && !this.hasOvercookedAlarm) {
            this.hasOvercookedAlarm = true;
            this.isBaking = false;
            this.audioEvents.push('stopOvenHum');
            this.btnBakeTexture = 'oven_btn_bake_off';
            this.glassTexture = 'oven_glass_off';
            this.cookiesInOven.forEach(c => { c.bakedState = 'burnt'; });
            this.audioEvents.push('playOvenBurnAlert');
            this.audioEvents.push('playCookieBurnt');
            this.feedback = '¡Se ha quemado! 😭🔥';
          }
        }
      }

      evaluateCookiesInOven() {
        const bakeMin = this.config.bakeMin;
        this.cookiesInOven.forEach(cookie => {
          if (cookie.bakedState === 'burnt') {
            // keep burnt
          } else if (cookie.bakeTime >= bakeMin) {
            cookie.bakedState = 'baked';
          } else {
            cookie.bakedState = 'raw';
          }
        });
      }

      handleOvenImageClick() {
        if (!this.cookiesInOven || this.cookiesInOven.length === 0) {
          this.audioEvents.push('playUiDenied');
          return;
        }
        if (this.isBaking) {
          this.isBaking = false;
          this.audioEvents.push('stopOvenHum');
          this.btnBakeTexture = 'oven_btn_bake_off';
          this.glassTexture = 'oven_glass_off';
        }
        this.cookiesInOven.forEach(c => this.prepTrayCookies.push(c));
        this.cookiesInOven = [];
        this.audioEvents.push('playOvenDoor');
        this.audioEvents.push('playUiTap');
        this.feedback = '¡Retirando al mostrador! 🍪';
      }
    }

    test('Intentar hornear sin precalentar o con horno vacío rechaza la acción', () => {
      const sim = new OvenMockSimulation();
      const cookie = new Cookie();
      cookie.base = 'classic';
      cookie.shape = 'star';

      // 1. Intentar cocinar sin precalentar ni galletas
      sim.handleOvenBakeClick();
      assert.equal(sim.isBaking, false, 'No debe hornear sin precalentar');
      assert.equal(sim.feedback, '¡Primero enciende el horno!');
      assert.ok(sim.audioEvents.includes('playUiDenied'));

      // 2. Precalentar pero sin galletas
      sim.handleOvenPowerClick();
      assert.equal(sim.isOvenPreheated, true, 'Debe precalentar');
      assert.equal(sim.btnPowerTexture, 'oven_btn_power_on');
      sim.handleOvenBakeClick();
      assert.equal(sim.isBaking, false, 'No debe hornear con horno vacío');
      assert.equal(sim.feedback, '¡El horno está vacío!');
    });

    test('Flujo completo: Cargar galleta cruda -> precalentar -> hornear -> campana -> extraer galleta horneada', () => {
      const sim = new OvenMockSimulation();
      const cookie = new Cookie();
      cookie.base = 'classic';
      cookie.shape = 'star';
      assert.equal(cookie.bakedState, 'raw');

      // 1. Cargar en horno
      sim.cookiesInOven.push(cookie);
      assert.equal(sim.cookiesInOven.length, 1);

      // 2. Precalentar horno
      sim.handleOvenPowerClick();
      assert.equal(sim.isOvenPreheated, true);
      assert.equal(sim.btnPowerTexture, 'oven_btn_power_on');

      // 3. Presionar hornear
      sim.handleOvenBakeClick();
      assert.equal(sim.isBaking, true, 'Debe iniciar horneado');
      assert.equal(sim.btnBakeTexture, 'oven_btn_bake_on', 'Botón de cocinar debe estar en _on');
      assert.equal(sim.glassTexture, 'oven_glass_on', 'Cristal debe iluminarse en _on');
      assert.ok(sim.audioEvents.includes('playBakingStart'), 'Debe sonar inicio de horneado');

      // 4. Simular transcurso de tiempo (5 segundos = 5000ms a 1.15x = 5.75s > 5.5s)
      sim.update(5000);
      assert.equal(cookie.bakedState, 'baked', 'La galleta debe quedar horneada');
      assert.ok(sim.alarmPlayed, 'La campana debe haberse disparado');
      assert.equal(sim.btnBakeTexture, 'oven_btn_bake_off', 'Botón de cocinar debe volver a _off tras campana');
      assert.equal(sim.glassTexture, 'oven_glass_off', 'Cristal debe volver a _off');
      assert.ok(sim.audioEvents.includes('playOvenBellReady'), 'Debe sonar campana de listo');

      // 5. Extraer galletas horneadas
      sim.handleOvenImageClick();
      assert.equal(sim.cookiesInOven.length, 0, 'El horno debe quedar vacío');
      assert.equal(sim.prepTrayCookies.length, 1, 'La bandeja de preparación debe tener la galleta');
      assert.equal(sim.prepTrayCookies[0].bakedState, 'baked', 'La galleta en bandeja debe estar horneada');
      assert.ok(sim.audioEvents.includes('playOvenDoor'), 'Debe sonar la puerta del horno');
    });

    test('Galleta se quema si transcurre la ventana de gracia de 5s tras la alarma y apaga efectos', () => {
      const sim = new OvenMockSimulation();
      const cookie = new Cookie();
      cookie.base = 'chocolate';
      cookie.shape = 'heart';
      sim.cookiesInOven.push(cookie);

      sim.handleOvenPowerClick();
      sim.handleOvenBakeClick();
      sim.update(5000); // Llega a listo (5.75s acumulados)
      assert.equal(cookie.bakedState, 'baked');

      // Dejar pasar 5.5s adicionales sin sacar
      sim.update(5500);
      assert.equal(cookie.bakedState, 'burnt', 'La galleta debe haberse quemado');
      assert.equal(sim.isBaking, false, 'Cocción activa debe detenerse al quemarse');
      assert.equal(sim.btnBakeTexture, 'oven_btn_bake_off');
      assert.equal(sim.glassTexture, 'oven_glass_off');
      assert.ok(sim.audioEvents.includes('playOvenBurnAlert'), 'Debe sonar alerta de quemado');
    });
  });
});
