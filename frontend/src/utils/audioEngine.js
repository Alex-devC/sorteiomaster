// Web Audio API Engine para Efeitos Sonoros da Roleta Sorteio Master
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    // Carregar preferência salva
    try {
      const saved = localStorage.getItem('@SorteioMaster:muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch (e) {}
  }

  init() {
    if (this.isMuted) return;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('@SorteioMaster:muted', String(this.isMuted));
    } catch (e) {}
    if (!this.isMuted) {
      this.init();
    }
    return this.isMuted;
  }

  // Som mecânico de catraca / tick ao cruzar cada fatia
  playTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 150, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // Som suave de início de giro
  playSpinStart() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.25);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }

  // Acorde triunfante de revelação da vitória (Arpeggio em C Maior)
  playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const chord = [523.25, 659.25, 783.99, 1046.50]; // Dó, Mi, Sol, Dó oitava
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + (idx * 0.09);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.14, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.85);
      });
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
