/**
 * SoundManager.js
 * 
 * Unified Audio Architecture for Kiwipaw Bakehouse.
 * Features:
 * - Singleton management with 5 gain buses: Master, BGM, SFX, UI, Ambience.
 * - Dynamic pitch randomizer (+/- 5%) and micro-volume variance (+/- 5%).
 * - Round-robin anti-fatigue pools (N-1 consecutive check) for high-frequency actions.
 * - ASMR procedural audio synthesis (dough, oven, toppings, drinks, cat vocalizations, UI).
 * - Full persistence in localStorage with backward-compatibility for legacy keys.
 * - CrazyGames SDK ad lifecycle hooks (onAdStarted / onAdFinished) and Page Visibility handlers.
 * - Node test friendly (safely runs in mock environments without Web Audio API errors).
 */

class SoundManager {
  static #instance = null;

  /**
   * Get the singleton instance of SoundManager.
   * @param {Object} [options]
   * @param {boolean} [options.reset=false] Force instance recreation (useful for tests)
   * @param {Storage} [options.storage] Custom storage provider (defaults to window.localStorage)
   * @returns {SoundManager}
   */
  static getInstance(options = {}) {
    if (!SoundManager.#instance || options.reset) {
      SoundManager.#instance = new SoundManager(options);
    }
    return SoundManager.#instance;
  }

  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);

    // 5 independent gain buses
    this.buses = {
      master: { volume: 1.0, muted: false, node: null },
      bgm: { volume: 0.25, muted: false, node: null },
      sfx: { volume: 0.7, muted: false, node: null },
      ui: { volume: 0.6, muted: false, node: null },
      ambience: { volume: 0.3, muted: false, node: null }
    };

    // State tracking
    this.adPlaying = false;
    this.preAdMuteState = false;
    this.tabHidden = false;
    this.isUnlocked = false;

    // Web Audio context and active voice tracking
    this.ctx = null;
    this.activeHumNode = null;
    this.activeHumGain = null;

    // Round-robin history tracker
    this.roundRobinHistory = new Map();

    // Load persisted settings
    this.loadSettings();

    // Register browser lifecycle events if in DOM environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.bindBrowserEvents();
    }
  }

  // =========================================================================
  // 1. BUS MANAGEMENT & VOLUME HIERARCHY
  // =========================================================================

  getBusNames() {
    return Object.keys(this.buses);
  }

  getVolume(busName) {
    if (!this.buses[busName]) return 0;
    return this.buses[busName].volume;
  }

  setVolume(busName, volume) {
    if (!this.buses[busName]) return;
    const clamped = Math.max(0.0, Math.min(1.0, parseFloat(volume) || 0));
    this.buses[busName].volume = clamped;
    this.updateBusGainNodes();
    this.saveSettings();
  }

  isMuted(busName = 'master') {
    if (!this.buses[busName]) return false;
    return Boolean(this.buses[busName].muted);
  }

  setMuted(busName, muted) {
    if (!this.buses[busName]) return;
    this.buses[busName].muted = Boolean(muted);
    this.updateBusGainNodes();
    this.saveSettings();
  }

  toggleMute(busName = 'master') {
    this.setMuted(busName, !this.isMuted(busName));
    return this.isMuted(busName);
  }

  getEffectiveGain(busName) {
    if (!this.buses[busName]) return 0;
    if (this.adPlaying || this.tabHidden || this.buses.master.muted) {
      return 0;
    }
    if (this.buses[busName].muted) {
      return 0;
    }

    const masterVol = this.buses.master.volume;
    const busVol = this.buses[busName].volume;
    return busName === 'master' ? masterVol : masterVol * busVol;
  }

  // =========================================================================
  // 2. PERSISTENCE & LOCALSTORAGE SYNC
  // =========================================================================

  saveSettings() {
    if (!this.storage) return;
    try {
      const state = {
        volumes: {
          master: this.buses.master.volume,
          bgm: this.buses.bgm.volume,
          sfx: this.buses.sfx.volume,
          ui: this.buses.ui.volume,
          ambience: this.buses.ambience.volume
        },
        mutes: {
          master: this.buses.master.muted,
          bgm: this.buses.bgm.muted,
          sfx: this.buses.sfx.muted,
          ui: this.buses.ui.muted,
          ambience: this.buses.ambience.muted
        }
      };
      this.storage.setItem('kiwibakery_audio_settings', JSON.stringify(state));

      // Backward-compatible sync with legacy keys
      this.storage.setItem('bg_music_volume', this.buses.bgm.volume);
      this.storage.setItem('bg_music_muted', this.buses.bgm.muted);
    } catch {
      // Ignore localStorage exceptions in restricted sandboxes
    }
  }

  loadSettings() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem('kiwibakery_audio_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.volumes) {
          Object.keys(parsed.volumes).forEach(bus => {
            if (this.buses[bus]) {
              this.buses[bus].volume = Math.max(0, Math.min(1, parsed.volumes[bus]));
            }
          });
        }
        if (parsed.mutes) {
          Object.keys(parsed.mutes).forEach(bus => {
            if (this.buses[bus]) {
              this.buses[bus].muted = Boolean(parsed.mutes[bus]);
            }
          });
        }
        return;
      }

      // Fallback: Read legacy keys if present
      const legacyBgmVol = this.storage.getItem('bg_music_volume');
      if (legacyBgmVol !== null) {
        this.buses.bgm.volume = Math.max(0, Math.min(1, parseFloat(legacyBgmVol)));
      }
      const legacyBgmMuted = this.storage.getItem('bg_music_muted');
      if (legacyBgmMuted !== null) {
        this.buses.bgm.muted = legacyBgmMuted === 'true';
      }
    } catch {
      // Default initial state is preserved if parsing fails
    }
  }

  // =========================================================================
  // 3. PITCH RANDOMIZER & ROUND-ROBIN POOLS
  // =========================================================================

  calculatePitch(baseFreq, variance = 0.05) {
    const shift = (Math.random() * 2 - 1) * variance; // range: [-variance, +variance]
    return baseFreq * (1 + shift);
  }

  calculatePlaybackRate(baseRate = 1.0, variance = 0.05) {
    const shift = (Math.random() * 2 - 1) * variance;
    return Math.max(0.1, baseRate * (1 + shift));
  }

  calculateVolumeVariance(baseGain = 1.0, variance = 0.05) {
    const shift = (Math.random() * 2 - 1) * variance;
    return Math.max(0.001, baseGain * (1 + shift));
  }

  getNextFromPool(poolKey, pool) {
    if (!pool || pool.length === 0) return null;
    if (pool.length === 1) return pool[0];

    const lastIdx = this.roundRobinHistory.get(poolKey);
    let newIdx = Math.floor(Math.random() * pool.length);

    // Guarantee N-1 variation (never repeat identical item consecutively)
    if (lastIdx !== undefined && newIdx === lastIdx) {
      newIdx = (newIdx + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length;
    }

    this.roundRobinHistory.set(poolKey, newIdx);
    return pool[newIdx];
  }

  // =========================================================================
  // 4. WEB AUDIO CONTEXT & LIFECYCLE MANAGEMENT
  // =========================================================================

  initAudioContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    if (typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
          this.setupBusGainNodes();
        } catch {
          // AudioContext not supported or restricted
        }
      }
    }

    return this.ctx;
  }

  setupBusGainNodes() {
    if (!this.ctx) return;
    try {
      const masterNode = this.ctx.createGain();
      masterNode.connect(this.ctx.destination);
      this.buses.master.node = masterNode;

      ['bgm', 'sfx', 'ui', 'ambience'].forEach(name => {
        const busNode = this.ctx.createGain();
        busNode.connect(masterNode);
        this.buses[name].node = busNode;
      });

      this.updateBusGainNodes();
    } catch {
      // Ignore errors in mock/restricted nodes
    }
  }

  updateBusGainNodes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime || 0;

    Object.keys(this.buses).forEach(name => {
      const bus = this.buses[name];
      if (bus.node && bus.node.gain) {
        const effectiveGain = this.getEffectiveGain(name);
        try {
          bus.node.gain.setValueAtTime(effectiveGain, now);
        } catch {
          // fallback
          bus.node.gain.value = effectiveGain;
        }
      }
    });
  }

  bindBrowserEvents() {
    const unlockHandler = () => {
      if (!this.isUnlocked) {
        this.initAudioContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else {
          this.isUnlocked = true;
        }
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });

    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange(document.hidden);
    });

    window.addEventListener('blur', () => {
      this.handleVisibilityChange(true);
    });

    window.addEventListener('focus', () => {
      this.handleVisibilityChange(false);
    });
  }

  handleVisibilityChange(hidden) {
    this.tabHidden = Boolean(hidden);
    if (this.ctx) {
      if (this.tabHidden) {
        if (this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      } else {
        if (this.ctx.state === 'suspended' && !this.adPlaying) {
          this.ctx.resume().catch(() => {});
        }
      }
    }
    this.updateBusGainNodes();
  }

  isTabHidden() {
    return this.tabHidden;
  }

  // =========================================================================
  // 5. CRAZYGAMES SDK AD LIFECYCLE HOOKS
  // =========================================================================

  onAdStarted() {
    this.adPlaying = true;
    this.preAdMuteState = this.buses.master.muted;
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
    this.updateBusGainNodes();
  }

  onAdFinished() {
    this.adPlaying = false;
    this.buses.master.muted = this.preAdMuteState;
    if (this.ctx && this.ctx.state === 'suspended' && !this.tabHidden) {
      this.ctx.resume().catch(() => {});
    }
    this.updateBusGainNodes();
  }

  isAdPlaying() {
    return this.adPlaying;
  }

  // =========================================================================
  // 6. PROCEDURAL ASMR SOUND SYNTHESIS ENGINE
  // =========================================================================

  /**
   * Core helper to create an oscillator connected to a specific bus.
   */
  _createOscVoice(busName, type, freq, gainVal, duration, freqEnd = null) {
    const ctx = this.initAudioContext();
    if (!ctx) return null;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (freqEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), now + duration);
      }

      const effectiveVolume = this.getEffectiveGain(busName);
      if (effectiveVolume <= 0) return null;

      const targetGain = gainVal * effectiveVolume;
      gainNode.gain.setValueAtTime(targetGain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gainNode);
      const busGainNode = this.buses[busName]?.node || ctx.destination;
      gainNode.connect(busGainNode);

      osc.start(now);
      osc.stop(now + duration);

      return { osc, gainNode };
    } catch {
      return null;
    }
  }

  /**
   * Helper to create a filtered noise buffer (for ASMR liquid, squish, steam, crunch).
   */
  _createNoiseVoice(busName, filterType, filterFreqStart, filterFreqEnd, gainVal, duration, q = 2.0) {
    const ctx = this.initAudioContext();
    if (!ctx) return null;

    try {
      const effectiveVolume = this.getEffectiveGain(busName);
      if (effectiveVolume <= 0) return null;

      const sampleRate = ctx.sampleRate || 44100;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      const now = ctx.currentTime;
      filter.frequency.setValueAtTime(filterFreqStart, now);
      if (filterFreqEnd !== null) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, filterFreqEnd), now + duration);
      }
      filter.Q.setValueAtTime(q, now);

      const gainNode = ctx.createGain();
      const targetGain = gainVal * effectiveVolume;
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(targetGain, now + duration * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gainNode);
      const busGainNode = this.buses[busName]?.node || ctx.destination;
      gainNode.connect(busGainNode);

      noise.start(now);
      return { noise, filter, gainNode };
    } catch {
      return null;
    }
  }

  // --- DOUGH & SHAPING ASMR ---

  playDoughSelect() {
    const freq = this.calculatePitch(240, 0.05);
    const gain = this.calculateVolumeVariance(0.12, 0.05);
    this._createOscVoice('sfx', 'sine', freq, gain, 0.12, freq * 0.6);
  }

  playDoughCut() {
    const pool = [
      () => {
        // Variation 1: ASMR Squish cutter
        const f1 = this.calculatePitch(460, 0.05);
        this._createOscVoice('sfx', 'triangle', f1, 0.11, 0.10, f1 * 0.4);
        this._createNoiseVoice('sfx', 'bandpass', 550, 220, 0.08, 0.09, 3.5);
      },
      () => {
        // Variation 2: Soft tactile dough slice
        const f2 = this.calculatePitch(520, 0.05);
        this._createOscVoice('sfx', 'sine', f2, 0.10, 0.12, f2 * 0.35);
        this._createNoiseVoice('sfx', 'bandpass', 680, 280, 0.07, 0.11, 4.0);
      },
      () => {
        // Variation 3: Resonant cookie stamp squish
        const f3 = this.calculatePitch(380, 0.05);
        this._createOscVoice('sfx', 'triangle', f3, 0.12, 0.14, f3 * 0.5);
        this._createNoiseVoice('sfx', 'bandpass', 420, 180, 0.09, 0.12, 3.0);
      }
    ];

    const chosen = this.getNextFromPool('dough_cut', pool);
    if (chosen) chosen();
  }

  playDoughPlace() {
    const freq = this.calculatePitch(130, 0.05);
    this._createOscVoice('sfx', 'sine', freq, 0.09, 0.14, 60);
    this._createNoiseVoice('sfx', 'lowpass', 300, 80, 0.05, 0.12, 1.5);
  }

  // --- OVEN STATION ASMR ---

  playOvenDoor() {
    const f = this.calculatePitch(160, 0.04);
    this._createOscVoice('sfx', 'triangle', f, 0.10, 0.18, 55);
    this._createNoiseVoice('sfx', 'lowpass', 450, 100, 0.06, 0.16, 2.0);
  }

  playOvenClick() {
    const f = this.calculatePitch(1200, 0.05);
    this._createOscVoice('sfx', 'square', f, 0.06, 0.04, f * 0.5);
  }

  startOvenHum() {
    if (this.activeHumNode) return;
    const ctx = this.initAudioContext();
    if (!ctx) return;

    try {
      const effectiveVol = this.getEffectiveGain('sfx');
      if (effectiveVol <= 0) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(113.5, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.04 * effectiveVol, ctx.currentTime + 0.4);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);

      const busGainNode = this.buses.sfx?.node || ctx.destination;
      gainNode.connect(busGainNode);

      osc1.start();
      osc2.start();

      this.activeHumNode = { osc1, osc2, gainNode, filter };
      this.activeHumGain = gainNode;
    } catch {
      // Graceful fallback
    }
  }

  stopOvenHum() {
    if (!this.activeHumNode) return;
    const ctx = this.ctx;
    if (ctx && this.activeHumGain) {
      try {
        const now = ctx.currentTime;
        this.activeHumGain.gain.setValueAtTime(this.activeHumGain.gain.value, now);
        this.activeHumGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
        const nodeRef = this.activeHumNode;
        setTimeout(() => {
          try {
            nodeRef.osc1.stop();
            nodeRef.osc2.stop();
          } catch {}
        }, 320);
      } catch {}
    }
    this.activeHumNode = null;
    this.activeHumGain = null;
  }

  playOvenWarningTick() {
    const f = this.calculatePitch(1600, 0.03);
    this._createOscVoice('sfx', 'sine', f, 0.05, 0.03, f * 0.9);
  }

  playOvenBellReady() {
    const ctx = this.initAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Dual resonant Japanese pastry bell ding
      const f1 = this.calculatePitch(1567.98, 0.02); // G6
      const f2 = f1 * 2;                             // G7 harmonic shimmer

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(f1, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(f2, now);

      const effective = this.getEffectiveGain('sfx');
      gainNode.gain.setValueAtTime(0.12 * effective, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      const busGainNode = this.buses.sfx?.node || ctx.destination;
      gainNode.connect(busGainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    } catch {}
  }

  playOvenBurnAlert() {
    const f = this.calculatePitch(880, 0.05);
    this._createOscVoice('sfx', 'sawtooth', f, 0.08, 0.22, f * 0.7);
    this._createNoiseVoice('sfx', 'highpass', 2400, 800, 0.09, 0.25, 1.5);
  }

  playCookieBurnt() {
    const f = this.calculatePitch(180, 0.05);
    this._createOscVoice('sfx', 'sawtooth', f, 0.12, 0.35, 60);
    this._createNoiseVoice('sfx', 'bandpass', 1200, 300, 0.10, 0.28, 2.0);
  }

  // --- TOPPINGS STATION ASMR ---

  playToppingSprinkles() {
    const pool = [
      () => {
        const base = this.calculatePitch(1800, 0.05);
        this._createOscVoice('sfx', 'sine', base, 0.06, 0.05);
        setTimeout(() => this._createOscVoice('sfx', 'sine', base * 1.25, 0.05, 0.06), 35);
        setTimeout(() => this._createOscVoice('sfx', 'sine', base * 1.5, 0.04, 0.08), 70);
      },
      () => {
        const base = this.calculatePitch(2000, 0.05);
        this._createNoiseVoice('sfx', 'bandpass', 3500, 1800, 0.07, 0.12, 4.0);
        this._createOscVoice('sfx', 'sine', base, 0.05, 0.06);
        setTimeout(() => this._createOscVoice('sfx', 'sine', base * 1.2, 0.05, 0.07), 40);
      },
      () => {
        const base = this.calculatePitch(1900, 0.05);
        this._createOscVoice('sfx', 'triangle', base, 0.06, 0.05);
        setTimeout(() => this._createOscVoice('sfx', 'triangle', base * 1.35, 0.05, 0.07), 45);
      }
    ];

    const chosen = this.getNextFromPool('topping_sprinkles', pool);
    if (chosen) chosen();
  }

  playToppingChoco() {
    const pool = [
      () => {
        const f1 = this.calculatePitch(820, 0.06);
        this._createOscVoice('sfx', 'sine', f1, 0.08, 0.06, f1 * 0.5);
        this._createNoiseVoice('sfx', 'bandpass', 1200, 400, 0.06, 0.05, 3.0);
      },
      () => {
        const f2 = this.calculatePitch(940, 0.06);
        this._createOscVoice('sfx', 'sine', f2, 0.08, 0.05, f2 * 0.55);
        this._createNoiseVoice('sfx', 'bandpass', 1400, 500, 0.06, 0.05, 3.2);
      },
      () => {
        const f3 = this.calculatePitch(780, 0.06);
        this._createOscVoice('sfx', 'sine', f3, 0.07, 0.06, f3 * 0.45);
        setTimeout(() => {
          const f4 = this.calculatePitch(860, 0.06);
          this._createOscVoice('sfx', 'sine', f4, 0.06, 0.05, f4 * 0.5);
        }, 30);
      }
    ];

    const chosen = this.getNextFromPool('topping_choco', pool);
    if (chosen) chosen();
  }

  playToppingGlazing() {
    this._createNoiseVoice('sfx', 'bandpass', 400, 950, 0.09, 0.28, 2.5);
    const f = this.calculatePitch(320, 0.05);
    this._createOscVoice('sfx', 'sine', f, 0.07, 0.25, f * 1.5);
  }

  // --- DRINK STATION ASMR ---

  playDrinkButton() {
    const f = this.calculatePitch(1200, 0.05);
    this._createOscVoice('sfx', 'square', f, 0.08, 0.05, f * 0.4);
    this._createOscVoice('sfx', 'sine', 280, 0.09, 0.08, 120);
  }

  playDrinkSteam() {
    this._createNoiseVoice('sfx', 'highpass', 3200, 1800, 0.11, 0.45, 1.2);
  }

  playDrinkPour() {
    this._createNoiseVoice('sfx', 'bandpass', 350, 780, 0.09, 1.8, 2.2);
  }

  playDrinkReady() {
    const f = this.calculatePitch(2093, 0.02); // C7
    this._createOscVoice('sfx', 'sine', f, 0.09, 0.35, f * 0.95);
    this._createOscVoice('sfx', 'triangle', 1046.5, 0.06, 0.25);
  }

  // --- CAT CUSTOMERS ASMR ---

  playDoorChime() {
    const base = this.calculatePitch(1046.5, 0.03); // C6
    this._createOscVoice('sfx', 'sine', base, 0.08, 0.55);
    setTimeout(() => {
      this._createOscVoice('sfx', 'sine', base * 1.5, 0.07, 0.65); // G6
    }, 120);
  }

  playCatMeow(mood = 'curious') {
    if (mood === 'happy') {
      const f = this.calculatePitch(680, 0.05);
      this._createOscVoice('sfx', 'triangle', f, 0.09, 0.24, f * 1.35);
    } else if (mood === 'anxious') {
      const f = this.calculatePitch(460, 0.05);
      this._createOscVoice('sfx', 'sawtooth', f, 0.07, 0.30, f * 0.75);
    } else {
      // curious default
      const f = this.calculatePitch(540, 0.05);
      this._createOscVoice('sfx', 'triangle', f, 0.08, 0.26, f * 1.25);
    }
  }

  playCatPurr() {
    const ctx = this.initAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const modOsc = ctx.createOscillator();
      const modGain = ctx.createGain();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);

      modOsc.type = 'sine';
      modOsc.frequency.setValueAtTime(24, now); // 24Hz purr rumble
      modGain.gain.setValueAtTime(20, now);

      modOsc.connect(modGain);
      modGain.connect(osc.frequency);

      const effective = this.getEffectiveGain('sfx');
      gainNode.gain.setValueAtTime(0.08 * effective, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gainNode);
      const busGainNode = this.buses.sfx?.node || ctx.destination;
      gainNode.connect(busGainNode);

      osc.start(now);
      modOsc.start(now);
      osc.stop(now + 0.8);
      modOsc.stop(now + 0.8);

      // Add gentle sparkle chime
      this.playStarPop(2);
    } catch {}
  }

  playCatSad() {
    const f = this.calculatePitch(380, 0.04);
    this._createOscVoice('sfx', 'sine', f, 0.09, 0.35, f * 0.55);
  }

  playCustomerAngry() {
    const f = this.calculatePitch(110, 0.05);
    this._createOscVoice('sfx', 'sawtooth', f, 0.12, 0.32, 70);
  }

  playScratch() {
    this._createNoiseVoice('sfx', 'bandpass', 2200, 800, 0.14, 0.12, 2.0);
  }

  // --- UI & FEEDBACK ASMR ---

  playUiTap() {
    const pool = [
      () => {
        const f1 = this.calculatePitch(460, 0.05);
        this._createOscVoice('ui', 'sine', f1, 0.12, 0.07, f1 * 0.35);
      },
      () => {
        const f2 = this.calculatePitch(490, 0.05);
        this._createOscVoice('ui', 'sine', f2, 0.11, 0.06, f2 * 0.38);
      },
      () => {
        const f3 = this.calculatePitch(430, 0.05);
        this._createOscVoice('ui', 'sine', f3, 0.13, 0.08, f3 * 0.32);
      }
    ];

    const chosen = this.getNextFromPool('ui_tap', pool);
    if (chosen) chosen();
  }

  playUiHover() {
    const f = this.calculatePitch(1500, 0.04);
    this._createOscVoice('ui', 'sine', f, 0.03, 0.02, f * 0.8);
  }

  playUiDenied() {
    const f = this.calculatePitch(160, 0.04);
    this._createOscVoice('ui', 'triangle', f, 0.10, 0.16, f * 0.8);
  }

  playCoinCollect(index = 0) {
    const coinNotes = [
      { f1: 987.77, f2: 1318.51 }, // B5 -> E6
      { f1: 1046.50, f2: 1567.98 }, // C6 -> G6
      { f1: 1174.66, f2: 1760.00 }, // D6 -> A6
      { f1: 1318.51, f2: 2093.00 }  // E6 -> C7
    ];

    const pool = coinNotes.map(pair => () => {
      const p1 = this.calculatePitch(pair.f1, 0.03);
      const p2 = this.calculatePitch(pair.f2, 0.03);
      this._createOscVoice('ui', 'square', p1, 0.05, 0.07);
      setTimeout(() => {
        this._createOscVoice('ui', 'square', p2, 0.06, 0.28);
      }, 55);
    });

    const chosen = this.getNextFromPool('coin_pool', pool);
    if (chosen) chosen();
  }

  playStarPop(index = 0) {
    const starNotes = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
    const baseFreq = starNotes[index % starNotes.length] || 1046.50;
    const freq = this.calculatePitch(baseFreq, 0.03);
    this._createOscVoice('ui', 'triangle', freq, 0.08, 0.18, freq * 1.15);
  }

  playCoinCascade() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playCoinCollect();
      }, i * 65);
    }
  }

  playShopBuy() {
    const f = this.calculatePitch(1567.98, 0.03); // G6
    this._createOscVoice('ui', 'sine', f, 0.10, 0.45);
    setTimeout(() => {
      this.playCoinCollect();
    }, 80);
  }

  playVictoryFanfare() {
    const notes = [
      { f: 261.63, d: 0.18 }, // C4
      { f: 329.63, d: 0.18 }, // E4
      { f: 392.00, d: 0.18 }, // G4
      { f: 523.25, d: 0.25 }, // C5
      { f: 659.25, d: 0.25 }, // E5
      { f: 783.99, d: 0.55 }  // G5
    ];

    notes.forEach((n, idx) => {
      setTimeout(() => {
        this._createOscVoice('ui', 'triangle', n.f, 0.08, n.d);
      }, idx * 110);
    });
  }

  playGameOverMelody() {
    const notes = [
      { f: 349.23, d: 0.35 }, // F4
      { f: 329.63, d: 0.35 }, // E4
      { f: 293.66, d: 0.45 }, // D4
      { f: 261.63, d: 0.70 }  // C4
    ];

    notes.forEach((n, idx) => {
      setTimeout(() => {
        this._createOscVoice('ui', 'sine', n.f, 0.09, n.d, n.f * 0.95);
      }, idx * 280);
    });
  }

  // =========================================================================
  // 7. BACKWARD-COMPATIBILITY ALIASES (Drop-in replacement for SoundEffects)
  // =========================================================================

  playClick() {
    this.playUiTap();
  }

  playCoin() {
    this.playCoinCollect();
  }

  playAngry() {
    this.playCustomerAngry();
  }

  playTrash() {
    this._createOscVoice('sfx', 'sawtooth', 200, 0.08, 0.22, 50);
    this._createNoiseVoice('sfx', 'lowpass', 400, 100, 0.06, 0.20, 2.0);
  }

  playDing() {
    this.playOvenBellReady();
  }

  playAlarm() {
    const f = this.calculatePitch(880, 0.03);
    this._createOscVoice('sfx', 'sine', f, 0.06, 0.12);
    setTimeout(() => this._createOscVoice('sfx', 'sine', f, 0.06, 0.12), 150);
    setTimeout(() => this._createOscVoice('sfx', 'sine', f * 1.36, 0.07, 0.18), 300);
  }

  playBakingStart() {
    this.playOvenDoor();
    setTimeout(() => {
      this.playOvenClick();
      this.startOvenHum();
    }, 120);
  }

  playCoffeePour() {
    this.playDrinkSteam();
    setTimeout(() => {
      this.playDrinkPour();
    }, 200);
  }

  playPerfect() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this._createOscVoice('ui', 'triangle', freq, 0.06, 0.24);
      }, idx * 50);
    });
  }

  playMainMenuMusic() {
    const notes = [
      { f: 261.63, d: 0.35 },
      { f: 329.63, d: 0.35 },
      { f: 392.00, d: 0.35 },
      { f: 523.25, d: 0.50 },
      { f: 493.88, d: 0.50 },
      { f: 392.00, d: 0.65 },
      { f: 440.00, d: 0.65 },
      { f: 349.23, d: 0.65 },
      { f: 261.63, d: 1.00 }
    ];

    notes.forEach((n, idx) => {
      setTimeout(() => {
        this._createOscVoice('bgm', 'triangle', n.f, 0.05, n.d);
      }, idx * 220);
    });
  }
}

export default SoundManager;
