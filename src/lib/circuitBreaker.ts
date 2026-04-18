/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by detecting and handling failing services
 */

import { NETWORK_CONFIG } from './networkConfig';

// Circuit states
enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

// Circuit breaker options
interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  volumeThreshold?: number;
  errorRateThreshold?: number;
  windowSize?: number;
}

// Request result
interface RequestResult {
  success: boolean;
  timestamp: number;
  duration: number;
  error?: any;
}

class CircuitBreaker {
  private circuits: Map<string, Circuit> = new Map();

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    key: string = 'default',
    options?: CircuitBreakerOptions
  ): Promise<T> {
    // Get or create circuit
    const circuit = this.getOrCreateCircuit(key, options);

    // Check if circuit is open
    if (circuit.state === CircuitState.OPEN) {
      // Check if timeout expired (move to half-open)
      if (Date.now() - circuit.openedAt >= circuit.options.timeout) {
        circuit.state = CircuitState.HALF_OPEN;
        circuit.halfOpenSuccesses = 0;
        console.log(`🔄 Circuit [${key}] moved to HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker [${key}] is OPEN - service unavailable`);
      }
    }

    // Execute the function
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      // Record success
      circuit.recordResult({
        success: true,
        timestamp: Date.now(),
        duration,
      });

      // If in half-open state, check if we can close
      if (circuit.state === CircuitState.HALF_OPEN) {
        circuit.halfOpenSuccesses++;
        if (circuit.halfOpenSuccesses >= circuit.options.successThreshold) {
          circuit.state = CircuitState.CLOSED;
          console.log(`✅ Circuit [${key}] moved to CLOSED state`);
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failure
      circuit.recordResult({
        success: false,
        timestamp: Date.now(),
        duration,
        error,
      });

      // If in half-open state, reopen immediately
      if (circuit.state === CircuitState.HALF_OPEN) {
        circuit.state = CircuitState.OPEN;
        circuit.openedAt = Date.now();
        console.log(`❌ Circuit [${key}] moved back to OPEN state`);
      }
      // If in closed state, check if we should open
      else if (circuit.state === CircuitState.CLOSED) {
        const shouldOpen = circuit.shouldOpen();
        if (shouldOpen) {
          circuit.state = CircuitState.OPEN;
          circuit.openedAt = Date.now();
          console.log(`❌ Circuit [${key}] moved to OPEN state (failure threshold exceeded)`);
        }
      }

      throw error;
    }
  }

  /**
   * Get circuit state
   */
  getState(key: string = 'default'): CircuitState {
    const circuit = this.circuits.get(key);
    return circuit?.state || CircuitState.CLOSED;
  }

  /**
   * Get circuit stats
   */
  getStats(key: string = 'default'): {
    state: CircuitState;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number;
    avgDuration: number;
  } | null {
    const circuit = this.circuits.get(key);
    if (!circuit) return null;

    const recentResults = circuit.getRecentResults();
    const total = recentResults.length;
    const successful = recentResults.filter((r) => r.success).length;
    const failed = total - successful;
    const errorRate = total > 0 ? failed / total : 0;
    const avgDuration =
      total > 0 ? recentResults.reduce((sum, r) => sum + r.duration, 0) / total : 0;

    return {
      state: circuit.state,
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      errorRate,
      avgDuration,
    };
  }

  /**
   * Reset circuit
   */
  reset(key: string = 'default'): void {
    const circuit = this.circuits.get(key);
    if (circuit) {
      circuit.state = CircuitState.CLOSED;
      circuit.results = [];
      circuit.consecutiveFailures = 0;
      circuit.halfOpenSuccesses = 0;
      console.log(`🔄 Circuit [${key}] reset to CLOSED state`);
    }
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    this.circuits.forEach((_, key) => this.reset(key));
  }

  /**
   * Get or create circuit
   */
  private getOrCreateCircuit(key: string, options?: CircuitBreakerOptions): Circuit {
    let circuit = this.circuits.get(key);
    if (!circuit) {
      circuit = new Circuit(options);
      this.circuits.set(key, circuit);
    }
    return circuit;
  }
}

/**
 * Individual circuit instance
 */
class Circuit {
  state: CircuitState = CircuitState.CLOSED;
  options: Required<CircuitBreakerOptions>;
  results: RequestResult[] = [];
  consecutiveFailures: number = 0;
  halfOpenSuccesses: number = 0;
  openedAt: number = 0;

  constructor(options?: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: options?.failureThreshold ?? NETWORK_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
      successThreshold: options?.successThreshold ?? NETWORK_CONFIG.CIRCUIT_BREAKER.SUCCESS_THRESHOLD,
      timeout: options?.timeout ?? NETWORK_CONFIG.CIRCUIT_BREAKER.TIMEOUT,
      volumeThreshold: options?.volumeThreshold ?? NETWORK_CONFIG.CIRCUIT_BREAKER.VOLUME_THRESHOLD,
      errorRateThreshold: options?.errorRateThreshold ?? NETWORK_CONFIG.CIRCUIT_BREAKER.ERROR_RATE_THRESHOLD,
      windowSize: options?.windowSize ?? NETWORK_CONFIG.CIRCUIT_BREAKER.WINDOW_SIZE,
    };
  }

  /**
   * Record request result
   */
  recordResult(result: RequestResult): void {
    this.results.push(result);

    // Update consecutive failures
    if (result.success) {
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }

    // Clean old results outside window
    this.cleanOldResults();
  }

  /**
   * Check if circuit should open
   */
  shouldOpen(): boolean {
    const recentResults = this.getRecentResults();

    // Need minimum volume
    if (recentResults.length < this.options.volumeThreshold) {
      return false;
    }

    // Check consecutive failures
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      return true;
    }

    // Check error rate
    const failures = recentResults.filter((r) => !r.success).length;
    const errorRate = failures / recentResults.length;
    if (errorRate >= this.options.errorRateThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Get recent results within window
   */
  getRecentResults(): RequestResult[] {
    const cutoff = Date.now() - this.options.windowSize;
    return this.results.filter((r) => r.timestamp >= cutoff);
  }

  /**
   * Clean results outside window
   */
  private cleanOldResults(): void {
    const cutoff = Date.now() - this.options.windowSize;
    this.results = this.results.filter((r) => r.timestamp >= cutoff);
  }
}

// Export singleton instance
export const circuitBreaker = new CircuitBreaker();

// Export types and enums
export { CircuitState };
export type { CircuitBreakerOptions };
