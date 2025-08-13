class TurnTimer {
  private timerId: NodeJS.Timeout | null = null;
  private timeLeft: number;
  private gameOver = false; // prevents further turns after time's up

  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void
  ) {
    this.timeLeft = duration;
  }

  startRound() {
    if (this.gameOver) {
      console.warn("🚫 Cannot start a new round — game is already over.");
      return;
    }

    this.stop();
    this.timeLeft = this.duration;
    console.log(`🕒 New turn: ${this.duration} seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft > 0) {
        console.log(`⏳ Time left: ${this.timeLeft}`);
      } else {
        this.triggerGameOver();
      }
    }, 1000);
  }

  private triggerGameOver() {
    if (this.gameOver) return; // prevent multiple triggers

    console.log("⏰ Time's up — GAME OVER!");
    this.stop();
    this.gameOver = true;
    this.onTimeout();
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
