export class SoundManager {
  private static ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!SoundManager.ctx) {
      SoundManager.ctx = new AudioContext();
    }
    if (SoundManager.ctx.state === 'suspended') {
      void SoundManager.ctx.resume();
    }
    return SoundManager.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.15,
    freqEnd?: number,
    delay = 0,
  ): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
    }

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  jump(): void {
    this.playTone(250, 0.15, 'square', 0.12, 500);
  }

  collectCarrot(): void {
    // Two quick ascending notes
    this.playTone(523, 0.08, 'square', 0.1); // C5
    this.playTone(659, 0.12, 'square', 0.1, undefined, 0.06); // E5
  }

  collectGem(): void {
    // Quick bright chime
    this.playTone(880, 0.06, 'sine', 0.1); // A5
    this.playTone(1108, 0.1, 'sine', 0.1, undefined, 0.05); // C#6
  }

  depositGem(): void {
    // Softer chime for each gem deposited into portal
    this.playTone(660, 0.08, 'sine', 0.06, 880);
  }

  portalActivate(): void {
    // Ascending arpeggio
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'sine', 0.1, undefined, i * 0.1);
    });
  }

  portalEnter(): void {
    // Shimmery sweep up
    this.playTone(400, 0.5, 'sine', 0.12, 1200);
    this.playTone(600, 0.4, 'triangle', 0.08, 1400, 0.1);
  }

  gameOver(): void {
    // Descending sad tones
    const notes = [440, 370, 330, 262]; // A G# E C
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 'triangle', 0.1, undefined, i * 0.15);
    });
  }

  levelComplete(): void {
    // Victory fanfare
    const notes = [523, 659, 784, 1047, 784, 1047]; // C E G C G C
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.18, 'square', 0.08, undefined, i * 0.1);
    });
    // Final sustained note
    this.playTone(1047, 0.5, 'sine', 0.12, undefined, 0.6);
  }

  menuSelect(): void {
    this.playTone(660, 0.1, 'square', 0.1, 880);
  }

  autoEat(): void {
    // Soft munch sound
    this.playTone(200, 0.08, 'sawtooth', 0.06, 150);
    this.playTone(180, 0.06, 'sawtooth', 0.05, 130, 0.06);
  }

  zap(): void {
    // Electric sawtooth sweep
    this.playTone(800, 0.15, 'sawtooth', 0.12, 200);
    this.playTone(600, 0.1, 'sawtooth', 0.08, 100, 0.05);
  }

  lowEnergy(): void {
    // Warning beep
    this.playTone(220, 0.1, 'square', 0.08);
  }

  throwBomb(): void {
    // Whoosh sound
    this.playTone(300, 0.2, 'sine', 0.1, 100);
  }

  bombEmp(): void {
    // Electric crackle/zap
    this.playTone(1200, 0.1, 'sawtooth', 0.15, 200);
    this.playTone(800, 0.15, 'square', 0.1, 100, 0.05);
    this.playTone(1500, 0.08, 'sawtooth', 0.1, 400, 0.1);
  }
}
