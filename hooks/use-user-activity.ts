"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

interface UseUserActivityOptions {
  idleTimeout?: number; // in milliseconds, default 5 minutes
  syncInterval?: number; // in milliseconds, default 5 minutes
}

interface ActivityData {
  date: string;
  minutes: number;
}

export function useUserActivity(options: UseUserActivityOptions = {}) {
  const { idleTimeout = 5 * 60 * 1000, syncInterval = 5 * 60 * 1000 } = options;
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [activeTime, setActiveTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Use refs for values that don't need to trigger re-renders
  const isIdleRef = useRef<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minuteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const tabIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));
  const activeTabRef = useRef<string | null>(null);
  const activeTimeRef = useRef<number>(0);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  // Reset idle timer function
  const resetIdleTimer = useCallback(() => {
    // Only track activity if this is the active tab
    if (activeTabRef.current !== tabIdRef.current) return;

    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Reset idle state
    if (isIdleRef.current) {
      isIdleRef.current = false;
    }

    // Update last activity timestamp
    lastActivityRef.current = Date.now();

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true;
    }, idleTimeout);
  }, [idleTimeout]);

  // Check if date changed and reset if needed
  const checkDateAndReset = useCallback(() => {
    if (!isUserLoaded || !isSignedIn || !user?.id) return false;

    const today = getTodayDate();
    const storageKey = `user_${user.id}_active_time`;
    const storedTimeData = localStorage.getItem(storageKey);

    if (storedTimeData) {
      try {
        const data = JSON.parse(storedTimeData) as ActivityData;
        // If the stored date is not today, reset
        if (data.date !== today) {
          setActiveTime(0);
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              date: today,
              minutes: 0,
            }),
          );
          return true; // Date changed
        }
      } catch (error) {
        console.error("Error parsing stored time data:", error);
      }
    }

    return false; // Date didn't change
  }, [isUserLoaded, isSignedIn, user?.id]);

  // Initialize active time from localStorage
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user?.id) return;

    const today = getTodayDate();
    const storageKey = `user_${user.id}_active_time`;

    // Check if we have stored time data
    const storedTimeData = localStorage.getItem(storageKey);
    let initialTime = 0;

    if (storedTimeData) {
      try {
        const data = JSON.parse(storedTimeData) as ActivityData;
        // If the stored date is today, use the stored minutes, otherwise reset
        if (data.date === today) {
          initialTime = data.minutes;
        } else {
          // Reset for new day
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              date: today,
              minutes: 0,
            }),
          );
        }
      } catch (error) {
        console.error("Error parsing stored time data:", error);
        // Reset if error
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            date: today,
            minutes: 0,
          }),
        );
      }
    } else {
      // Initialize if not exists
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: today,
          minutes: 0,
        }),
      );
    }

    // Initialize with stored value or default
    setActiveTime(initialTime);

    // Also fetch from database to ensure we have the latest data
    fetchActivityFromDatabase();
  }, [isUserLoaded, isSignedIn, user?.id]);

  // Fetch activity data from database
  const fetchActivityFromDatabase = async () => {
    if (!isUserLoaded || !isSignedIn || !user?.id) return;

    try {
      const response = await fetch("/api/user/activity", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const today = getTodayDate();

        // If the database has more recent data for today, use it
        if (data.success && data.activity && data.activity.date === today) {
          // Only update if database value is higher (to avoid losing progress)
          if (data.activity.minutes > activeTime) {
            setActiveTime(data.activity.minutes);

            // Also update localStorage
            localStorage.setItem(
              `user_${user.id}_active_time`,
              JSON.stringify({
                date: today,
                minutes: data.activity.minutes,
              }),
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching activity from database:", error);
    }
  };

  // Sync activity data to database
  const syncActivityToDatabase = async () => {
    if (!isUserLoaded || !isSignedIn || !user?.id || activeTime <= 0) return;

    try {
      setIsSyncing(true);

      const response = await fetch("/api/user/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minutes: activeTime,
          date: getTodayDate(),
        }),
      });

      if (response.ok) {
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error("Error syncing activity to database:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle tab visibility changes
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user?.id) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";

      if (isVisibleRef.current) {
        // Tab became visible, check if date changed
        checkDateAndReset();

        // Become the active tab
        localStorage.setItem(`user_${user.id}_active_tab`, tabIdRef.current);
        activeTabRef.current = tabIdRef.current;

        // Reset idle state
        resetIdleTimer();
      } else {
        // Tab became hidden, sync to database
        syncActivityToDatabase();

        // Clear active tab if this was the active one
        if (activeTabRef.current === tabIdRef.current) {
          localStorage.removeItem(`user_${user.id}_active_tab`);
          activeTabRef.current = null;
        }
      }
    };

    // Check active tab on load
    const activeTab = localStorage.getItem(`user_${user.id}_active_tab`);
    if (!activeTab) {
      // No active tab, become the active one
      localStorage.setItem(`user_${user.id}_active_tab`, tabIdRef.current);
      activeTabRef.current = tabIdRef.current;
    } else {
      activeTabRef.current = activeTab;
    }

    // Set up visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial visibility check
    isVisibleRef.current = document.visibilityState === "visible";

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isUserLoaded, isSignedIn, user?.id, resetIdleTimer, checkDateAndReset]);

  // Handle user activity and idle detection
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user?.id) return;

    // Set up activity listeners
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);

    // Initial idle timer
    resetIdleTimer();

    return () => {
      // Clean up activity listeners
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);

      // Clear timers
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [idleTimeout, isUserLoaded, isSignedIn, user?.id, resetIdleTimer]);

  // Update active time every minute if not idle
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user?.id) return;

    const updateActiveTime = () => {
      // Only update if visible, not idle, and this is the active tab
      if (
        isVisibleRef.current &&
        !isIdleRef.current &&
        activeTabRef.current === tabIdRef.current
      ) {
        setActiveTime((prevTime) => {
          const newTime = prevTime + 1;
          const today = getTodayDate();

          // Update ref for use in sync
          activeTimeRef.current = newTime;

          // Store the updated time in localStorage
          localStorage.setItem(
            `user_${user.id}_active_time`,
            JSON.stringify({
              date: today,
              minutes: newTime,
            }),
          );

          return newTime;
        });
      }
    };

    // Set up minute timer
    minuteTimerRef.current = setInterval(updateActiveTime, 60000); // Every minute

    return () => {
      // Clear minute timer
      if (minuteTimerRef.current) {
        clearInterval(minuteTimerRef.current);
      }
    };
  }, [isUserLoaded, isSignedIn, user?.id]);

  // Sync to database periodically
  // Note: We use a ref for activeTime to avoid recreating the interval on every time update
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user?.id) return;

    // Set up sync timer - uses ref to get latest activeTime without dependency
    syncTimerRef.current = setInterval(() => {
      if (activeTimeRef.current > 0) {
        syncActivityToDatabase();
      }
    }, syncInterval);

    return () => {
      // Clear sync timer
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [syncInterval, isUserLoaded, isSignedIn, user?.id]);

  // Sync to database when unmounting
  // Note: Using ref instead of state to avoid effect running on every activeTime change
  useEffect(() => {
    return () => {
      if (isUserLoaded && isSignedIn && user?.id && activeTimeRef.current > 0) {
        syncActivityToDatabase();
      }
    };
  }, [isUserLoaded, isSignedIn, user?.id]);

  return {
    activeTime,
    isSyncing,
    lastSynced,
    syncNow: syncActivityToDatabase,
  };
}
