import { useEffect, useRef, useCallback } from "react";

const LAST_ACTIVITY_STORAGE_KEY = "lastActivityTime";

/**
 * A custom hook to detect user inactivity, synchronized across multiple tabs.
 * @param onIdle - The function to call when the user is idle.
 * @param idleTime - The inactivity time in milliseconds.
 */
export const useIdleTimer = (onIdle: () => void, idleTime: number) => {
  const timeoutId = useRef<number | null>(null);

  // Starts or resets the idle timer.
  const startTimer = useCallback(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }
    timeoutId.current = window.setTimeout(onIdle, idleTime);
  }, [onIdle, idleTime]);

  // When activity is detected, update localStorage and reset the timer.
  const handleActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, Date.now().toString());
    startTimer();
  }, [startTimer]);

  // Listens for storage events from other tabs.
  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_STORAGE_KEY) {
        // Activity was detected in another tab, so reset our timer.
        startTimer();
      }
    },
    [startTimer]
  );

  useEffect(() => {
    // List of events that denote user activity.
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    // Add event listeners for user activity in this tab.
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Add listener for activity in other tabs.
    window.addEventListener("storage", handleStorageChange);

    // Start the timer when the component mounts.
    startTimer();

    // Cleanup function to remove event listeners and clear the timer.
    return () => {
      if (timeoutId.current) window.clearTimeout(timeoutId.current);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [handleActivity, handleStorageChange, startTimer]);
};
