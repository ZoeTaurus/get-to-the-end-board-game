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
    this.currentTime = 30;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }
}

export default TimerService;
