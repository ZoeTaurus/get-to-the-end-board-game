class TimerService {
  private timerId: NodeJS.Timeout | null = null;

  startTimer(onTimeout: () => void) {
    this.stopTimer();
    
    let timeLeft = 30;
    
    this.timerId = setInterval(() => {
      timeLeft -= 1;
      
      if (timeLeft <= 0) {
        this.stopTimer();
        onTimeout();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  resetTimer(onTimeout: () => void) {
    this.stopTimer();
    this.startTimer(onTimeout);
  }
}

export default TimerService;
