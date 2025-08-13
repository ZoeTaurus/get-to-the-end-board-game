class TimerService {
  private timerId: NodeJS.Timeout | null = null;
  private onTimeout: (() => void) | null = null;
  private timeLeft: number = 30;

  private startCountdown(label: string) {
    this.stopTimer();
    console.log(`${label}: 30 seconds`);

    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      console.log('Timer tick:', this.timeLeft);

      if (this.timeLeft <= 0) {
        console.log('Timer reached 0! Ending game...');
        this.stopTimer();
        this.onTimeout?.();
      }
    }, 1000);
  }

  startTimer(onTimeout: () => void) {
    this.onTimeout = onTimeout;
    this.timeLeft = 30;
    this.startCountdown('Timer started');
  }

  resetTimer(onTimeout: () => void) {
    this.onTimeout = onTimeout;
    this.timeLeft = 30;
    this.startCountdown('Timer reset');
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export default TimerService;
