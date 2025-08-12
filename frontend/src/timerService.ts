class TimerService {
  private timerId: NodeJS.Timeout | null = null;

  startTimer(onTimeout: () => void) {
    this.stopTimer();
    
    let timeLeft = 30;
    console.log('Internal timer started with 30 seconds');
    
    this.timerId = setInterval(() => {
      timeLeft -= 1;
      console.log('Internal timer tick:', timeLeft);
      
      if (timeLeft <= 0) {
        console.log('Internal timer reached 0, ending game');
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
