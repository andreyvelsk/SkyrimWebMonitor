import { onMounted, onUnmounted } from 'vue';

const HIDE_DELAY_MS = 1300;

export function useAutoHideCursor() {
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let cursorHidden = false;

  const isFullscreenLike = () => {
    return (
      document.fullscreenElement !== null ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: minimal-ui)').matches
    );
  };

  const setCursor = (hidden: boolean) => {
    if (cursorHidden === hidden) return;
    cursorHidden = hidden;
    document.documentElement.style.cursor = hidden ? 'none' : '';
    document.body.style.cursor = hidden ? 'none' : '';
  };

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimer = setTimeout(() => {
      if (!isFullscreenLike()) {
        setCursor(false);
        return;
      }
      setCursor(true);
    }, HIDE_DELAY_MS);
  };

  const showCursorTemporarily = () => {
    setCursor(false);
    if (isFullscreenLike()) {
      scheduleHide();
    }
  };

  const onMouseMove = () => {
    showCursorTemporarily();
  };

  const onWheel = () => {
    showCursorTemporarily();
  };

  const onTouch = () => {
    if (!isFullscreenLike()) {
      setCursor(false);
      return;
    }

    clearHideTimer();
    setCursor(true);
  };

  // Pointer events keep behavior precise on hybrid devices.
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      onTouch();
    }
  };

  const applyInitialState = () => {
    if (!isFullscreenLike()) {
      setCursor(false);
      return;
    }

    // Prefer hidden cursor in fullscreen handheld usage; mouse/touchpad
    // movement immediately shows it back.
    setCursor(true);
    scheduleHide();
  };

  onMounted(() => {
    applyInitialState();

    document.addEventListener('fullscreenchange', applyInitialState);
    document.addEventListener('visibilitychange', applyInitialState);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });

    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
  });

  onUnmounted(() => {
    clearHideTimer();

    document.removeEventListener('fullscreenchange', applyInitialState);
    document.removeEventListener('visibilitychange', applyInitialState);

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('wheel', onWheel);

    window.removeEventListener('touchstart', onTouch);
    window.removeEventListener('touchmove', onTouch);

    window.removeEventListener('pointerdown', onPointerDown);

    setCursor(false);
  });
}