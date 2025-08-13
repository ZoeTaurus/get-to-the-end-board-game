class TurnTimer {
  private timerId: NodeJS.Timeout | null = null;
  private timeLeft: number;
  
  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void
  ) {
    this.timeLeft = duration;
  }

  start() {
    this.stop();
    this.timeLeft = this.duration;
    console.log(`Turn started: ${this.duration} seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      console.log('Time left:', this.timeLeft);

      if (this.timeLeft <= 0) {
        this.stop();
        console.log("Timer reached 0 — ending game!");
        this.onTimeout(); // Always called here
      }
    }, 1000);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export default TurnTimer;
