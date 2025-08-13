class TurnTimer {
  private timerId: NodeJS.Timeout | null = null;
  private timeLeft: number;
  private gameOver = false;

  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void // THIS will directly call your win logic
  ) {
    this.timeLeft = duration;
  }

  startRound() {
    if (this.gameOver) return;

    this.stop();
    this.timeLeft = this.duration;
    console.log(`🕒 New turn started: ${this.duration} seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft > 0) {
        console.log(`⏳ Time left: ${this.timeLeft}`);
      } else {
        this.triggerTimeout();
      }
    }, 1000);
  }

  private triggerTimeout() {
    if (this.gameOver) return;

    console.log("💥 TIMER HIT 0 — TRIGGERING WIN SEQUENCE");
    this.gameOver = true;
    this.stop();

    // 🔥 DIRECTLY CALL THE WIN FUNCTION HERE
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
