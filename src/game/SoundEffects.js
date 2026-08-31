/**
 * SoundEffects.js (Legacy Adapter)
 * 
 * Delegates all legacy calls to the unified SoundManager singleton.
 */
import SoundManager from './SoundManager.js';

class SoundEffects {
  static get manager() {
    return SoundManager.getInstance();
  }

  static init() {
    this.manager.initAudioContext();
  }

  static playClick() {
    this.manager.playClick();
  }

  static playCoin() {
    this.manager.playCoin();
  }

  static playBakingStart() {
    this.manager.playBakingStart();
  }

  static playAlarm() {
    this.manager.playAlarm();
  }

  static playTrash() {
    this.manager.playTrash();
  }

  static playAngry() {
    this.manager.playAngry();
  }

  static playDing() {
    this.manager.playDing();
  }

  static playCoffeePour() {
    this.manager.playCoffeePour();
  }

  static playPerfect() {
    this.manager.playPerfect();
  }

  static playMainMenuMusic() {
    this.manager.playMainMenuMusic();
  }
}

export default SoundEffects;
