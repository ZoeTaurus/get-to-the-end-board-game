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
    
    console.log('Timer started with 30 seconds');
    
    this.timerId = setInterval(() => {
      this.currentTime -= 1;
      
      if (this.onTick) {
        this.onTick(this.currentTime);
      }
      
      if (this.currentTime <= 0) {
        console.log('Timer reached 0, calling timeout callback');
        this.stopTimer();
        if (this.onTimeout) {
          console.log('Executing timeout callback');
          this.onTimeout();
        } else {
          console.log('No timeout callback found');
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
