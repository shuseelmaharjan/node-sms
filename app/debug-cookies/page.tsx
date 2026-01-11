"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookieDebugPage() {
  const [cookies, setCookies] = useState<string>("");
  
  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  const refreshCookies = () => {
    setCookies(document.cookie);
  };

  const clearCookies = () => {
    // Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    refreshCookies();
  };

  const forceRedirect = () => {
    window.location.href = "/dashboard";
  };

  const cookieList = cookies ? cookies.split(';').map(c => c.trim()) : [];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Cookie Debug Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Current Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button onClick={refreshCookies} variant="outline">
                Refresh Cookies
              </Button>
              <Button onClick={clearCookies} variant="destructive">
                Clear All Cookies
              </Button>
              <Button onClick={forceRedirect} className="ml-2">
                Force Redirect to Dashboard
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">All Cookies ({cookieList.length}):</h3>
              {cookieList.length > 0 ? (
                <div className="bg-gray-100 p-4 rounded-lg">
                  {cookieList.map((cookie, index) => (
                    <div key={index} className="font-mono text-sm mb-1">
                      {cookie}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No cookies found</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Raw Cookie String:</h3>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm break-all">
                {cookies || "No cookies"}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Likely Refresh Token Cookies:</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                {cookieList.filter(cookie => 
                  cookie.toLowerCase().includes('refresh') || 
                  cookie.toLowerCase().includes('token') ||
                  cookie.toLowerCase().includes('session')
                ).map((cookie, index) => (
                  <div key={index} className="font-mono text-sm mb-1 text-blue-700">
                    {cookie}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => window.location.href = "/login"} variant="outline">
              Go to Login
            </Button>
            <Button onClick={() => window.location.href = "/dashboard"} variant="outline">
              Go to Dashboard
            </Button>
            <Button onClick={() => window.location.href = "/debug-auth"} variant="outline">
              Go to Auth Debug
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}