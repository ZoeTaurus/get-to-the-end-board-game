import { EventEmitter } from "events";

class TurnTimer extends EventEmitter {
  private timerId: NodeJS.Timeout | null = null;
  private timeLeft: number;
  private gameOver = false;

  constructor(private readonly duration: number) {
    super();
    this.timeLeft = duration;
  }

  startRound() {
    if (this.gameOver) return;

    this.stop();
    this.timeLeft = this.duration;
    console.log(`🕒 New turn: ${this.duration} seconds`);

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

    this.gameOver = true;
    this.stop();
    console.log("💥 TIMER HIT 0 — EMITTING TIMEOUT EVENT");
    this.emit("timeout"); // <-- broadcast to other code
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
