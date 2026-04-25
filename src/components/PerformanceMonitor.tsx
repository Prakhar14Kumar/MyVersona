import { useEffect, useState } from 'react';
import { Activity, Zap, Clock, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface PerformanceMetrics {
  fps: number;
  loadTime: number;
  memoryUsage: number;
  apiLatency: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    loadTime: 0,
    memoryUsage: 0,
    apiLatency: 0,
  });
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Calculate initial load time
    if (performance && performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }

    // FPS calculation
    let lastTime = performance.now();
    let frames = 0;
    let fpsInterval: number;

    const measureFPS = () => {
      const now = performance.now();
      frames++;

      if (now >= lastTime + 1000) {
        const currentFPS = Math.round((frames * 1000) / (now - lastTime));
        setMetrics(prev => ({ ...prev, fps: currentFPS }));
        frames = 0;
        lastTime = now;
      }

      fpsInterval = requestAnimationFrame(measureFPS);
    };

    fpsInterval = requestAnimationFrame(measureFPS);

    // Memory usage (if available)
    if ('memory' in performance) {
      const checkMemory = setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
          setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
        }
      }, 2000);

      return () => {
        cancelAnimationFrame(fpsInterval);
        clearInterval(checkMemory);
      };
    }

    return () => cancelAnimationFrame(fpsInterval);
  }, []);

  // Only show in development or when triggered
  if (!showMonitor) {
    return (
      <button
        onClick={() => setShowMonitor(true)}
        className="fixed bottom-22 right-7 w-12 h-12 rounded-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] text-white shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        title="Show Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button >
    );
  }

  const getPerformanceStatus = () => {
    if (metrics.fps >= 55 && metrics.loadTime < 3000) return { text: 'Excellent', color: 'bg-green-500' };
    if (metrics.fps >= 40 && metrics.loadTime < 5000) return { text: 'Good', color: 'bg-yellow-500' };
    return { text: 'Needs Optimization', color: 'bg-red-500' };
  };

  const status = getPerformanceStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FF6F91]" />
              <CardTitle className="text-base">Performance Monitor</CardTitle>
            </div>
            <button
              onClick={() => setShowMonitor(false)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ✕
            </button>
          </div>
          <CardDescription className="flex items-center gap-2 pt-1">
            <span className={`inline-block w-2 h-2 rounded-full ${status.color}`}></span>
            <span>{status.text}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* FPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFB88C]" />
              <span className="text-sm">FPS</span>
            </div>
            <Badge variant="outline" className={metrics.fps >= 55 ? 'border-green-500' : 'border-yellow-500'}>
              {metrics.fps}
            </Badge>
          </div>

          {/* Load Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6F91]" />
              <span className="text-sm">Load Time</span>
            </div>
            <Badge variant="outline">
              {(metrics.loadTime / 1000).toFixed(2)}s
            </Badge>
          </div>

          {/* Memory Usage */}
          {metrics.memoryUsage > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6DE7C5]" />
                <span className="text-sm">Memory</span>
              </div>
              <Badge variant="outline">
                {metrics.memoryUsage} MB
              </Badge>
            </div>
          )}

          {/* Performance Tips */}
          {status.text !== 'Excellent' && (
            <div className="pt-2 border-t text-xs text-muted-foreground">
              💡 Tip: Close unused tabs and refresh to improve performance
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}