export class SoundManager {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15, freqEnd?: number): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  jump(): void {
    this.playTone(250, 0.15, 'square', 0.12, 500);
  }

  collectCarrot(): void {
    const ctx = this.getCtx();
    // Two quick ascending notes
    this.playTone(523, 0.08, 'square', 0.1); // C5
    setTimeout(() => this.playTone(659, 0.12, 'square', 0.1), 60); // E5
  }

  collectGem(): void {
    // Quick bright chime
    this.playTone(880, 0.06, 'sine', 0.1); // A5
    setTimeout(() => this.playTone(1108, 0.1, 'sine', 0.1), 50); // C#6
  }

  depositGem(): void {
    // Softer chime for each gem deposited into portal
    this.playTone(660, 0.08, 'sine', 0.06, 880);
  }

  portalActivate(): void {
    // Ascending arpeggio
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.1), i * 100);
    });
  }

  portalEnter(): void {
    // Shimmery sweep up
    this.playTone(400, 0.5, 'sine', 0.12, 1200);
    setTimeout(() => this.playTone(600, 0.4, 'triangle', 0.08, 1400), 100);
  }

  gameOver(): void {
    // Descending sad tones
    const notes = [440, 370, 330, 262]; // A G# E C
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'triangle', 0.1), i * 150);
    });
  }

  levelComplete(): void {
    // Victory fanfare
    const notes = [523, 659, 784, 1047, 784, 1047]; // C E G C G C
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.18, 'square', 0.08), i * 100);
    });
    // Final sustained note
    setTimeout(() => this.playTone(1047, 0.5, 'sine', 0.12), 600);
  }

  menuSelect(): void {
    this.playTone(660, 0.1, 'square', 0.1, 880);
  }

  autoEat(): void {
    // Soft munch sound
    this.playTone(200, 0.08, 'sawtooth', 0.06, 150);
    setTimeout(() => this.playTone(180, 0.06, 'sawtooth', 0.05, 130), 60);
  }

  zap(): void {
    // Electric sawtooth sweep
    this.playTone(800, 0.15, 'sawtooth', 0.12, 200);
    setTimeout(() => this.playTone(600, 0.1, 'sawtooth', 0.08, 100), 50);
  }

  lowEnergy(): void {
    // Warning beep
    this.playTone(220, 0.1, 'square', 0.08);
  }
}
