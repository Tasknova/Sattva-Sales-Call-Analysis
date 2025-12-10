import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SessionTimeoutOptions {
  timeoutMinutes: number;
  warningMinutes?: number;
}

export const useSessionTimeout = ({ timeoutMinutes, warningMinutes = 5 }: SessionTimeoutOptions) => {
  const { signOut, userRole } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    toast({
      title: 'Session Expired',
      description: 'You have been logged out due to inactivity.',
      variant: 'destructive',
    });
    await signOut();
  }, [signOut, toast, clearTimers]);

  const showWarning = useCallback(() => {
    toast({
      title: 'Session Expiring Soon',
      description: `You will be logged out in ${warningMinutes} minutes due to inactivity.`,
    });
  }, [toast, warningMinutes]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    clearTimers();

    // Set warning timer (if warningMinutes is provided)
    if (warningMinutes > 0) {
      const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
      warningRef.current = setTimeout(showWarning, warningTime);
    }

    // Set logout timer
    const timeoutDuration = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(handleLogout, timeoutDuration);
  }, [timeoutMinutes, warningMinutes, handleLogout, showWarning, clearTimers]);

  useEffect(() => {
    // Only activate if user is logged in
    if (!userRole) {
      clearTimers();
      return;
    }

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Throttle activity tracking to avoid too many timer resets
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        resetTimer();
        throttleTimeout = null;
      }, 1000); // Throttle to once per second
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      clearTimers();
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [userRole, resetTimer, clearTimers]);

  return { resetTimer };
};
