import { Card, CardContent } from "./ui/card";

export function PostSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-4">
        {/* Post Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-3 w-24 bg-muted rounded"></div>
            </div>
          </div>
          <div className="w-8 h-8 bg-muted rounded-full"></div>
        </div>

        {/* Post Content Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-5/6 bg-muted rounded"></div>
          <div className="h-4 w-4/6 bg-muted rounded"></div>
          
          <div className="w-full h-64 bg-muted rounded-lg mt-4"></div>
        </div>

        {/* Post Actions Skeleton */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-muted rounded"></div>
            <div className="h-8 w-16 bg-muted rounded"></div>
          </div>
          <div className="h-8 w-16 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}
