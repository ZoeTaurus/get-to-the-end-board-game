class TimerService {
  private currentTime: number = 30;
  private intervalId: NodeJS.Timeout | null = null;

  startTimer() {
    this.currentTime = 30;
    this.intervalId = setInterval(() => {
      this.currentTime--; // Count down from 30
      if (this.currentTime === 0) { // Check if time = 0
        console.log('Timer reached 0, ending game!'); // Debug log
        this.endGame(); // End game if it = 0
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

  private endGame() {
    // End the game when timer reaches 0
    console.log('endGame called, dispatching gameTimeout event'); // Debug log
    this.stopTimer();
    // Emit a custom event that the React app can listen to
    window.dispatchEvent(new CustomEvent('gameTimeout'));
  }
}

export default new TimerService();
