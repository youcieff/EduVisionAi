/**
 * Cinematic Sound Engine for EduVisionAI
 * Uses native Web Audio API to synthesize premium, zero-latency micro-interactions.
 * No external MP3s needed. Zero bundle size impact.
 */

class SoundEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.enabled = true; // Hardcoded true for now, can be hooked to user settings
    this.baseVolume = 0.2; // Keep it subtle and elegant
  }

  // Initialize context on first user interaction (browser policy)
  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.baseVolume;
    }
    
    // Resume context if suspended (Chrome policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // Helper to create a basic envelope (Attack, Decay)
  _createEnv(param, time, attack, decay, peakAmount) {
    param.setValueAtTime(0, time);
    param.linearRampToValueAtTime(peakAmount, time + attack);
    param.exponentialRampToValueAtTime(0.001, time + attack + decay);
  }

  // 1. XP Pop (Sleek, liquid drop sound)
  playXpPop() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    
    // Pitch drops rapidly
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    
    // Volume envelope
    this._createEnv(gain.gain, now, 0.01, 0.1, 0.8);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 2. Level Up (Lush, major 7th arpeggio)
  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.context.currentTime;
    // Frequencies for C Major 7th arpeggio (C5, E5, G5, B5, C6)
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
    
    freqs.forEach((freq, idx) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + (idx * 0.08); // Arpeggiated timing
      
      this._createEnv(gain.gain, startTime, 0.02, 0.4, 0.4);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // 3. Badge Unlock (Sparkling shimmer)
  playBadgeUnlock() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.context.currentTime;
    const freqs = [1046.50, 1567.98, 2093.00, 3135.96]; // High sparkly harmonics
    
    freqs.forEach((freq) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      // Slight detune for shimmer
      osc.detune.value = (Math.random() - 0.5) * 15;
      
      this._createEnv(gain.gain, now, 0.05, 0.6, 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 0.7);
    });
  }

  // 4. Interface Swoosh (For modals and tabs)
  playSwoosh() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.context.currentTime;
    
    // Noise generation for swoosh
    const bufferSize = this.context.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    
    // Sweep the filter frequency from low to high
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    const gain = this.context.createGain();
    this._createEnv(gain.gain, now, 0.1, 0.2, 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.3);
  }
}

// Export a singleton instance
const soundEngine = new SoundEngine();
export default soundEngine;
