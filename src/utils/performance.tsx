// Lazy loading utilities for mobile performance optimization

import { lazy, Suspense } from 'react';

// Loading component
export const LoadingSpinner: React.FC = () => (
  <div className="loading">
    <div className="spinner"></div>
  </div>
);

// Lazy load components to reduce initial bundle size
export const LazyHomeScreen = lazy(() => import('../screens/HomeScreen'));
export const LazyPOIDetailScreen = lazy(() => import('../screens/POIDetailScreen'));
export const LazyAudioPlayerScreen = lazy(() => import('../screens/AudioPlayerScreen'));
export const LazyCivicActionsScreen = lazy(() => import('../screens/CivicActionsScreen'));

// HOC for wrapping lazy components with Suspense
export const withSuspense = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback: React.ReactNode = <LoadingSpinner />
) => {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <WrappedComponent {...props} />
    </Suspense>
  );
};

// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  //console.log(`${name} took ${end - start} milliseconds`);
};

// Preload images for better user experience
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Service worker registration with update handling
export const registerServiceWorkerWithUpdate = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              if (confirm('New version available! Update now?')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
};

// Optimize images for mobile
export const optimizeImageForMobile = (src: string, width: number = 800): string => {
  // In a real app, this would use a service like Cloudinary or ImageKit
  // For now, we'll use Unsplash's built-in optimization
  if (src.includes('unsplash.com')) {
    return `${src}&w=${width}&q=80&fm=webp`;
  }
  return src;
};

// Debounce utility for search and input handlers
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Check if device supports touch
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Memory usage monitoring (for development)
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    //console.log({
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
};