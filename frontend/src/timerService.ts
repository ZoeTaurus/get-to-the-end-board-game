class TurnTimer {
  private timerId: NodeJS.Timeout | null = null;
  private timeLeft: number;
  private gameOver = false;

  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void
  ) {
    this.timeLeft = duration;
  }

  startRound() {
    if (this.gameOver) {
      console.warn("🚫 Tried to start a new round, but the game is already over.");
      return;
    }

    this.stop();
    this.timeLeft = this.duration;
    console.log(`🕒 New turn started: ${this.duration} seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft--;
      console.log(`⏳ Time left: ${this.timeLeft}`);

      if (this.timeLeft <= 0) {
        this.endGameDueToTimeout();
      }
    }, 1000);
  }

  private endGameDueToTimeout() {
    if (this.gameOver) return;

    console.log("💥 TIMER HIT 0 — TRIGGERING GAME OVER");
    this.gameOver = true;
    this.stop();
    try {
      this.onTimeout();
    } catch (err) {
      console.error("❌ Error running game over callback:", err);
    }
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log("🛑 Timer stopped");
    }
  }

  getTimeLeft() {
    return this.timeLeft;
  }
}

export default TurnTimer;
