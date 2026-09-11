(function initTimerLibrary() {
  function formatMs(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const min = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  function createAccurateTimer({ onTick, onComplete }) {
    let remainingMs = 0;
    let endTime = 0;
    let interval = null;
    let running = false;

    const tick = () => {
      const ms = Math.max(0, endTime - Date.now());
      remainingMs = ms;
      onTick(ms);
      if (ms <= 0) {
        clearInterval(interval);
        running = false;
        onComplete();
      }
    };

    return {
      start(minutes) {
        remainingMs = minutes * 60 * 1000;
        endTime = Date.now() + remainingMs;
        running = true;
        onTick(remainingMs);
        clearInterval(interval);
        interval = setInterval(tick, 250);
      },
      pause() {
        if (!running) return;
        remainingMs = Math.max(0, endTime - Date.now());
        clearInterval(interval);
        running = false;
        onTick(remainingMs);
      },
      resume() {
        if (running || remainingMs <= 0) return;
        endTime = Date.now() + remainingMs;
        running = true;
        clearInterval(interval);
        interval = setInterval(tick, 250);
      },
      stop() {
        clearInterval(interval);
        running = false;
        remainingMs = 0;
        onTick(0);
      },
      remainingMinutes() {
        return Math.max(1, Math.round(remainingMs / 60000));
      },
      isRunning() {
        return running;
      },
      formatMs,
    };
  }

  window.createAccurateTimer = createAccurateTimer;
})();
