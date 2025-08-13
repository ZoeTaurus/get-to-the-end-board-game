class TurnTimer {
  private timerId: NodeJS.Timeout | null = null;
  private timeLeft: number;

  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void // runs when timer hits 0
  ) {
    this.timeLeft = duration;
  }

  startRound() {
    // Clear any existing timer first
    this.stop();
    this.timeLeft = this.duration;
    console.log(`🕒 New turn: ${this.duration} seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft > 0) {
        console.log(`⏳ Time left: ${this.timeLeft}`);
      } else {
        console.log("⏰ Time's up — GAME OVER!");
        this.stop();
        this.onTimeout(); // End game now
      }
    }, 1000);
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getTimeLeft() {
    return this.timeLeft;
  }
}

export default TurnTimer;
