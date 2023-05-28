class Time {
  start: number;
  current: number;
  elapsed: number;
  delta: number;
  playing: boolean;
  constructor() {
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;
    this.playing = true;
  }

  value() {
    return this.elapsed;
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  tick() {
    const current = Date.now();

    this.delta = current - this.current;
    this.elapsed += this.playing ? this.delta : 0;
    this.current = current;

    if (this.delta > 60) {
      this.delta = 60;
    }
  }
}

export default Time;
