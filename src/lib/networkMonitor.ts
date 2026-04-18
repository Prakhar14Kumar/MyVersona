/**
 * Network Monitoring & Quality Detection
 * Monitors network performance and adapts to changing conditions
 * 
 * UI Philosophy: Non-intrusive monitoring
 * - Only shows alerts when there are actual issues
 * - Brief notifications instead of persistent displays
 * - User can enable detailed monitoring if desired
 */

import { NETWORK_CONFIG, NetworkQuality, NETWORK_QUALITY } from './networkConfig';

// Network metrics
interface NetworkMetrics {
  latency: number;
  downloadSpeed: number;
  uploadSpeed: number;
  packetLoss: number;
  jitter: number;
}

// Request metrics
interface RequestMetrics {
  url: string;
  status: number;
  duration: number;
  timestamp: number;
}

// Performance metrics
interface PerformanceMetrics {
  avgLatency: number;
  maxLatency: number;
  minLatency: number;
  successRate: number;
  errorRate: number;
  requestsPerSecond: number;
  totalRequests: number;
  totalErrors: number;
}

// Notification settings
export interface NetworkNotificationSettings {
  enabled: boolean;
  showOnQualityChange: boolean;  // Show when quality changes
  showOnPoorConnection: boolean; // Only show when connection is poor
  autoHideDuration: number;       // Auto-hide after ms (0 = manual)
  minimumQualityToShow: NetworkQuality; // Only show below this quality
}

// Default notification settings (non-intrusive)
const DEFAULT_NOTIFICATION_SETTINGS: NetworkNotificationSettings = {
  enabled: true,
  showOnQualityChange: false,     // Don't show on every change
  showOnPoorConnection: true,      // Only show when poor/offline
  autoHideDuration: 5000,          // Auto-hide after 5 seconds
  minimumQualityToShow: NETWORK_QUALITY.POOR, // Only show when poor or worse
};

class NetworkMonitor {
  private networkQuality: NetworkQuality = NETWORK_QUALITY.GOOD;
  private previousQuality: NetworkQuality = NETWORK_QUALITY.GOOD;
  private networkMetrics: Partial<NetworkMetrics> = {};
  private requestMetrics: RequestMetrics[] = [];
  private listeners: Set<(quality: NetworkQuality) => void> = new Set();
  private notificationListeners: Set<(notification: NetworkNotification) => void> = new Set();
  private detectionInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isOnline: boolean = navigator.onLine;
  private notificationSettings: NetworkNotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
  private detailedMonitoringEnabled: boolean = false; // Hidden by default

  constructor() {
    this.initialize();
  }

  /**
   * Initialize network monitoring
   */
  private initialize() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }

    // Start quality detection (runs in background)
    this.startQualityDetection();

    // Clean old metrics periodically
    this.startMetricsCleaning();
  }

  /**
   * Enable/disable detailed monitoring UI
   * When disabled, monitoring still runs but UI is hidden
   */
  setDetailedMonitoring(enabled: boolean) {
    this.detailedMonitoringEnabled = enabled;
    
    // Notify listeners about monitoring state change
    if (enabled) {
      this.notifyListeners(this.networkQuality);
    }
  }

  /**
   * Check if detailed monitoring UI is enabled
   */
  isDetailedMonitoringEnabled(): boolean {
    return this.detailedMonitoringEnabled;
  }

  /**
   * Update notification settings
   */
  setNotificationSettings(settings: Partial<NetworkNotificationSettings>) {
    this.notificationSettings = {
      ...this.notificationSettings,
      ...settings
    };
  }

  /**
   * Get current notification settings
   */
  getNotificationSettings(): NetworkNotificationSettings {
    return { ...this.notificationSettings };
  }

  /**
   * Handle online event
   */
  private handleOnline = () => {
    this.isOnline = true;
    this.updateNetworkQuality(this.detectQuality());
    
    // Show recovery notification
    if (this.notificationSettings.enabled) {
      this.sendNotification({
        type: 'success',
        message: 'Connection restored',
        quality: this.networkQuality,
        autoHide: true,
        duration: 3000
      });
    }
  };

  /**
   * Handle offline event
   */
  private handleOffline = () => {
    this.isOnline = false;
    this.updateNetworkQuality(NETWORK_QUALITY.OFFLINE);
    
    // Always show offline notification (critical)
    if (this.notificationSettings.enabled) {
      this.sendNotification({
        type: 'error',
        message: 'No internet connection',
        quality: NETWORK_QUALITY.OFFLINE,
        autoHide: false, // Keep visible until reconnected
        duration: 0
      });
    }
  };

  /**
   * Handle connection change
   */
  private handleConnectionChange = () => {
    const quality = this.detectQuality();
    this.updateNetworkQuality(quality);
  };

  /**
   * Start quality detection
   */
  private startQualityDetection() {
    // Check quality every 30 seconds (not too aggressive)
    this.detectionInterval = setInterval(() => {
      const quality = this.detectQuality();
      this.updateNetworkQuality(quality);
    }, 30000);
  }

  /**
   * Start metrics cleaning
   */
  private startMetricsCleaning() {
    // Clean old metrics every 5 minutes
    this.metricsInterval = setInterval(() => {
      const cutoff = Date.now() - 300000; // 5 minutes
      this.requestMetrics = this.requestMetrics.filter(
        (m) => m.timestamp > cutoff
      );
    }, 300000);
  }

  /**
   * Detect current network quality
   */
  private detectQuality(): NetworkQuality {
    if (!this.isOnline) {
      return NETWORK_QUALITY.OFFLINE;
    }

    // Get connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      const downlink = connection?.downlink; // Mbps
      const rtt = connection?.rtt; // ms

      // Store metrics
      if (rtt !== undefined) {
        this.networkMetrics.latency = rtt;
      }
      if (downlink !== undefined) {
        this.networkMetrics.downloadSpeed = downlink;
      }

      // Determine quality based on connection info
      if (effectiveType === '4g' || downlink > 10) {
        return NETWORK_QUALITY.EXCELLENT;
      } else if (effectiveType === '3g' || (downlink > 2 && downlink <= 10)) {
        return NETWORK_QUALITY.GOOD;
      } else if (effectiveType === '2g' || (downlink > 0.5 && downlink <= 2)) {
        return NETWORK_QUALITY.MODERATE;
      } else {
        return NETWORK_QUALITY.POOR;
      }
    }

    // Fallback: Use request metrics
    return this.detectQualityFromMetrics();
  }

  /**
   * Detect quality from request metrics
   */
  private detectQualityFromMetrics(): NetworkQuality {
    if (this.requestMetrics.length === 0) {
      return NETWORK_QUALITY.GOOD; // Default
    }

    const metrics = this.getPerformanceMetrics();

    // Determine quality based on latency and error rate
    if (metrics.avgLatency < 50 && metrics.errorRate < 0.01) {
      return NETWORK_QUALITY.EXCELLENT;
    } else if (metrics.avgLatency < 150 && metrics.errorRate < 0.05) {
      return NETWORK_QUALITY.GOOD;
    } else if (metrics.avgLatency < 300 && metrics.errorRate < 0.1) {
      return NETWORK_QUALITY.MODERATE;
    } else if (metrics.avgLatency < 500 && metrics.errorRate < 0.2) {
      return NETWORK_QUALITY.POOR;
    } else {
      return NETWORK_QUALITY.OFFLINE;
    }
  }

  /**
   * Update network quality and notify if needed
   */
  private updateNetworkQuality(quality: NetworkQuality) {
    const previousQuality = this.networkQuality;
    this.networkQuality = quality;
    this.previousQuality = previousQuality;

    // Only notify if quality actually changed
    if (quality !== previousQuality) {
      this.notifyListeners(quality);
      this.checkAndSendNotification(quality, previousQuality);
    }
  }

  /**
   * Check if notification should be sent and send it
   */
  private checkAndSendNotification(
    currentQuality: NetworkQuality,
    previousQuality: NetworkQuality
  ) {
    if (!this.notificationSettings.enabled) {
      return;
    }

    // Determine if we should show notification
    const shouldShow = this.shouldShowNotification(currentQuality, previousQuality);

    if (shouldShow) {
      const notification = this.createNotification(currentQuality, previousQuality);
      this.sendNotification(notification);
    }
  }

  /**
   * Determine if notification should be shown
   */
  private shouldShowNotification(
    currentQuality: NetworkQuality,
    previousQuality: NetworkQuality
  ): boolean {
    // Always show offline
    if (currentQuality === NETWORK_QUALITY.OFFLINE) {
      return true;
    }

    // Show on quality change if enabled
    if (this.notificationSettings.showOnQualityChange) {
      return true;
    }

    // Show only on poor connection if enabled
    if (this.notificationSettings.showOnPoorConnection) {
      // Show if quality dropped to poor or below
      const qualityOrder = [
        NETWORK_QUALITY.EXCELLENT,
        NETWORK_QUALITY.GOOD,
        NETWORK_QUALITY.MODERATE,
        NETWORK_QUALITY.POOR,
        NETWORK_QUALITY.OFFLINE
      ];
      
      const currentIndex = qualityOrder.indexOf(currentQuality);
      const minIndex = qualityOrder.indexOf(this.notificationSettings.minimumQualityToShow);
      
      // Only show if current quality is at or below minimum threshold
      return currentIndex >= minIndex;
    }

    return false;
  }

  /**
   * Create notification based on quality change
   */
  private createNotification(
    currentQuality: NetworkQuality,
    previousQuality: NetworkQuality
  ): NetworkNotification {
    const messages: Record<NetworkQuality, string> = {
      [NETWORK_QUALITY.EXCELLENT]: 'Excellent connection',
      [NETWORK_QUALITY.GOOD]: 'Good connection',
      [NETWORK_QUALITY.MODERATE]: 'Moderate connection - some features may be slower',
      [NETWORK_QUALITY.POOR]: 'Poor connection - reduced quality mode active',
      [NETWORK_QUALITY.OFFLINE]: 'No internet connection'
    };

    const types: Record<NetworkQuality, 'success' | 'info' | 'warning' | 'error'> = {
      [NETWORK_QUALITY.EXCELLENT]: 'success',
      [NETWORK_QUALITY.GOOD]: 'success',
      [NETWORK_QUALITY.MODERATE]: 'warning',
      [NETWORK_QUALITY.POOR]: 'warning',
      [NETWORK_QUALITY.OFFLINE]: 'error'
    };

    return {
      type: types[currentQuality],
      message: messages[currentQuality],
      quality: currentQuality,
      autoHide: currentQuality !== NETWORK_QUALITY.OFFLINE,
      duration: this.notificationSettings.autoHideDuration
    };
  }

  /**
   * Send notification to listeners
   */
  private sendNotification(notification: NetworkNotification) {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Track request performance
   */
  trackRequest(url: string, status: number, duration: number) {
    this.requestMetrics.push({
      url,
      status,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 100 requests
    if (this.requestMetrics.length > 100) {
      this.requestMetrics.shift();
    }

    // Update quality based on recent metrics (only if monitoring is active)
    if (this.requestMetrics.length >= 10) {
      const quality = this.detectQualityFromMetrics();
      this.updateNetworkQuality(quality);
    }
  }

  /**
   * Alias for trackRequest (backward compatibility)
   * @deprecated Use trackRequest instead
   */
  recordRequest(url: string, status: number, duration: number) {
    this.trackRequest(url, status, duration);
  }

  /**
   * Get current network quality
   */
  getNetworkQuality(): NetworkQuality {
    return this.networkQuality;
  }

  /**
   * Get previous network quality
   */
  getPreviousQuality(): NetworkQuality {
    return this.previousQuality;
  }

  /**
   * Get network metrics
   */
  getNetworkMetrics(): Partial<NetworkMetrics> {
    return { ...this.networkMetrics };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.requestMetrics.length === 0) {
      return {
        avgLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        successRate: 1,
        errorRate: 0,
        requestsPerSecond: 0,
        totalRequests: 0,
        totalErrors: 0,
      };
    }

    const latencies = this.requestMetrics.map((m) => m.duration);
    const totalRequests = this.requestMetrics.length;
    const totalErrors = this.requestMetrics.filter(
      (m) => m.status >= 400
    ).length;

    const timeWindow = Date.now() - (this.requestMetrics[0]?.timestamp || Date.now());
    const requestsPerSecond = totalRequests / (timeWindow / 1000);

    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),
      successRate: (totalRequests - totalErrors) / totalRequests,
      errorRate: totalErrors / totalRequests,
      requestsPerSecond,
      totalRequests,
      totalErrors,
    };
  }

  /**
   * Subscribe to quality changes
   */
  subscribe(listener: (quality: NetworkQuality) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(
    listener: (notification: NetworkNotification) => void
  ): () => void {
    this.notificationListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  /**
   * Notify all quality listeners
   */
  private notifyListeners(quality: NetworkQuality) {
    this.listeners.forEach((listener) => {
      try {
        listener(quality);
      } catch (error) {
        console.error('Error in quality listener:', error);
      }
    });
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): {
    online: boolean;
    quality: NetworkQuality;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } {
    const connection = 'connection' in navigator ? (navigator as any).connection : null;

    return {
      online: this.isOnline,
      quality: this.networkQuality,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.removeEventListener('change', this.handleConnectionChange);
    }

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.listeners.clear();
    this.notificationListeners.clear();
  }
}

// Network notification interface
export interface NetworkNotification {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  quality: NetworkQuality;
  autoHide: boolean;
  duration: number;
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();

// Helper to get adaptive settings based on quality
export function getAdaptiveSettings(quality: NetworkQuality) {
  const settings = NETWORK_CONFIG.quality[quality];

  return {
    imageQuality: settings.imageQuality,
    videoQuality: settings.videoQuality,
    batchSize: settings.batchSize,
    prefetchEnabled: settings.prefetchEnabled,
    shouldReduceAnimations: quality === NETWORK_QUALITY.POOR || quality === NETWORK_QUALITY.OFFLINE,
    shouldDisableAutoplay: quality === NETWORK_QUALITY.POOR || quality === NETWORK_QUALITY.OFFLINE,
    shouldCompressUploads: quality !== NETWORK_QUALITY.EXCELLENT,
  };
}

export default networkMonitor;