// ---- TurnTimer Class ----
class TurnTimer {
  public timeLeft: number;
  private timerId: NodeJS.Timeout | null = null;

  constructor(
    private readonly duration: number,
    private readonly onTimeout: () => void
  ) {
    this.timeLeft = duration;
  }

  start() {
    this.stop();
    this.timeLeft = this.duration;

    this.timerId = setInterval(() => {
      this.timeLeft -= 1;

      if (this.timeLeft <= 0) {
        this.stop();
        this.onTimeout(); // Trigger the win sequence
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
