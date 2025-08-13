class TurnTimer {
  private timerId: NodeJS.Timeout | null = null;
  private timeLeft: number;

  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void // called when time runs out
  ) {
    this.timeLeft = duration;
  }

  startRound() {
    // Stop any running timer first
    this.stop();
    this.timeLeft = this.duration;
    console.log(`🕒 New turn: ${this.duration} seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      console.log(`Time left: ${this.timeLeft}`);

      if (this.timeLeft <= 0) {
        console.log("⏰ Time's up — GAME OVER!");
        this.stop();
        this.onTimeout(); // End game here
      }
    }, 1000);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getTimeLeft() {
    return this.timeLeft;
  }
}

export default TurnTimer;
