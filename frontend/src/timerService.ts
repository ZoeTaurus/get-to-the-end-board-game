// Internal timer
class TurnTimer {
  private timerId: NodeJS.Timeout | null = null;
  private gameOver = false;
  public timeLeft: number;

  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void // directly triggers win
  ) {
    this.timeLeft = duration;
  }

  startRound() {
    if (this.gameOver) return;

    this.stop();
    this.timeLeft = this.duration;
    console.log(`🕒 Turn started: ${this.duration} seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft--;
      console.log(`⏳ Time left: ${this.timeLeft}`);

      if (this.timeLeft <= 0) {
        this.triggerTimeout();
      }
    }, 1000);
  }

  private triggerTimeout() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.stop();
    console.log("💥 TIMEOUT — triggering win sequence!");
    this.onTimeout(); // 🔥 guaranteed call
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export default TurnTimer;
