class TimerService {
  private timerId: NodeJS.Timeout | null = null;
  private currentTime: number = 30;
  private onTimeout: (() => void) | null = null;
  private onTick: ((time: number) => void) | null = null;

  startTimer(onTick: (time: number) => void, onTimeout: () => void) {
    this.stopTimer();
    this.currentTime = 30;
    this.onTick = onTick;
    this.onTimeout = onTimeout;
    
    this.timerId = setInterval(() => {
      this.currentTime -= 1;
      
      if (this.onTick) {
        this.onTick(this.currentTime);
      }
      
      if (this.currentTime <= 0) {
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
    // Stop the current timer
    this.stopTimer();
    // Reset the time
    this.currentTime = 30;
    // Update the display immediately
    if (this.onTick) {
      this.onTick(this.currentTime);
    }
    // Restart the timer with the same callbacks
    if (this.onTick && this.onTimeout) {
      this.startTimer(this.onTick, this.onTimeout);
    }
  }

  getCurrentTime(): number {
    return this.currentTime;
  }
}

export default TimerService;
