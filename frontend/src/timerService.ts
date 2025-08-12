class TimerService {
  private timerId: NodeJS.Timeout | null = null;
  private onTimeout: (() => void) | null = null;
  private timeLeft: number = 30; // Stored as a class property

  startTimer(onTimeout: () => void) {
    this.stopTimer();
    this.onTimeout = onTimeout;
    this.timeLeft = 30; // Initialize when starting
    
    console.log('Timer started: 30 seconds');
    
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      console.log('Timer tick:', this.timeLeft);
      
      if (this.timeLeft <= 0) {
        console.log('Timer reached 0! Ending game...');
        this.stopTimer();
        if (this.onTimeout) {
          this.onTimeout();
        }
      }
    }, 1000);
  }

  resetTimer(onTimeout: () => void) {
    this.stopTimer();
    this.onTimeout = onTimeout;
    this.timeLeft = 30; // Initialize when resetting
    
    console.log('Timer reset: 30 seconds');
    
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      console.log('Timer tick:', this.timeLeft);
      
      if (this.timeLeft <= 0) {
        console.log('Timer reached 0! Ending game...');
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
}

export default TimerService;
