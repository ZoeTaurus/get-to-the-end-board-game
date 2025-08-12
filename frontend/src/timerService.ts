class TimerService {
  private timerId: NodeJS.Timeout | null = null;
  private onTimeout: (() => void) | null = null;

  startTimer(onTimeout: () => void) {
    this.stopTimer();
    this.onTimeout = onTimeout;
    
    let timeLeft = 30;
    console.log('Timer started: 30 seconds');
    
    this.timerId = setInterval(() => {
      timeLeft -= 1;
      console.log('Timer tick:', timeLeft);
      
      if (timeLeft <= 0) {
        console.log('Timer reached 0! Ending game...');
        this.stopTimer();
        if (this.onTimeout) {
          this.onTimeout(); // This will show the lose/win messages
        }
      }
    }, 1000);
  }

  resetTimer(onTimeout: () => void) {
    this.stopTimer();
    this.onTimeout = onTimeout;
    
    let timeLeft = 30;
    console.log('Timer reset: 30 seconds');
    
    this.timerId = setInterval(() => {
      timeLeft -= 1;
      console.log('Timer tick:', timeLeft);
      
      if (timeLeft <= 0) {
        console.log('Timer reached 0! Ending game...');
        this.stopTimer();
        if (this.onTimeout) {
          this.onTimeout(); // This will show the lose/win messages
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
