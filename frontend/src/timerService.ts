class TimerService {
  private timerId: NodeJS.Timeout | null = null;
  private onTimeout: (() => void) | null = null;

  startTimer(onTimeout: () => void) {
    this.stopTimer();
    this.onTimeout = onTimeout;
    
    let timeLeft = 30;
    
    this.timerId = setInterval(() => {
      timeLeft -= 1;
      
      if (timeLeft <= 0) {
        this.stopTimer();
        if (this.onTimeout) {
          this.onTimeout();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  resetTimer() {
    this.stopTimer();
    if (this.onTimeout) {
      this.startTimer(this.onTimeout);
    }
  }
}

export default TimerService;
