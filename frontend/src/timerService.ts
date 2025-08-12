class TimerService {
  private currentTime: number = 30;
  private intervalId: NodeJS.Timeout | null = null;
  private onTimeout: (() => void) | null = null;

  startTimer(onTimeout: () => void) {
    this.onTimeout = onTimeout;
    this.currentTime = 30;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.currentTime--;
      
      if (this.currentTime <= 0) {
        this.stopTimer();
        if (this.onTimeout) {
          this.onTimeout();
        }
      }
    }, 1000);
  }

  resetTimer() {
    this.currentTime = 30;
  }

  stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCurrentTime(): number {
    return this.currentTime;
  }
}

export default new TimerService();
