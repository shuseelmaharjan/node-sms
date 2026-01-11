"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Something went wrong!</CardTitle>
          <CardDescription>
            An error occurred while loading the application.
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2 text-sm">
                <summary>Error details</summary>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">
                  {error.message}
                </pre>
              </details>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}