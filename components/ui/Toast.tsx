import React, { useState, useEffect, useRef } from 'react';
import type { NotificationType } from '../../types';

interface ToastProps {
  message: string;
  type: NotificationType;
  onDismiss: () => void;
  duration?: number;
}

const toastConfig = {
  success: {
    icon: (
      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    barClass: 'bg-green-500',
  },
  error: {
    icon: (
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    barClass: 'bg-red-500',
  },
  info: {
    icon: (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    barClass: 'bg-blue-500',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss, duration = 3000 }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    setIsExiting(true);
    // The actual removal is delayed to allow for the fade-out animation
    setTimeout(() => {
      onDismiss();
    }, 300); // Corresponds to animation duration
  };

  useEffect(() => {
    timerRef.current = window.setTimeout(handleDismiss, duration);
    if (progressRef.current) {
        progressRef.current.style.transitionDuration = `${duration}ms`;
        // Delay setting width to ensure transition is applied
        setTimeout(() => {
            if (progressRef.current) progressRef.current.style.width = '0%';
        }, 50);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration]);

  const config = toastConfig[type];

  return (
    <div
      role="alert"
      className={`relative flex items-center w-full max-w-sm p-4 overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 ${isExiting ? 'animate-fade-out' : 'animate-slide-in-top'}`}
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
        {message}
      </div>
       <button
        onClick={handleDismiss}
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-300"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
      <div className="absolute bottom-0 left-0 h-1 transition-all ease-linear" ref={progressRef} style={{ width: '100%', background: toastConfig[type].barClass }}></div>
    </div>
  );
};

export default Toast;
