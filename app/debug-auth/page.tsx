"use client";

import { useAuth } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth/store";
import { useRouter } from "next/navigation";

export default function AuthDebugPage() {
  const auth = useAuth();
  const store = useAuthStore();
  const router = useRouter();

  const handleManualRedirect = () => {
    console.log('Manual redirect attempt...');
    if (auth.isAuthenticated) {
      window.location.href = '/overview';
    } else {
      alert('User is not authenticated');
    }
  };

  const handleRouterRedirect = () => {
    console.log('Router redirect attempt...');
    router.push('/overview');
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Debug Info</h1>
      
      <div className="bg-yellow-100 p-4 rounded mb-4">
        <h3 className="font-semibold">Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server'}</h3>
        <p>Authenticated: {auth.isAuthenticated ? 'YES' : 'NO'}</p>
        <p>Loading: {auth.isLoading ? 'YES' : 'NO'}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">useAuth Hook</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(auth, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">Auth Store</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              hasToken: Boolean(store.accessToken),
              tokenLength: store.accessToken?.length || 0,
              hasUser: Boolean(store.user),
              hydrated: store.hydrated,
              isInitialized: store.isInitialized,
              sessionValid: store.sessionValid,
              user: store.user ? { id: store.user.id, email: store.user.email } : null
            }, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-8 space-x-4">
        <button 
          onClick={() => console.log('Current store state:', store)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Log Store to Console
        </button>
        
        <button 
          onClick={handleManualRedirect}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Manual Redirect to Dashboard
        </button>
        
        <button 
          onClick={handleRouterRedirect}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Router Redirect to Dashboard
        </button>
        
        <button 
          onClick={() => auth.logout()}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}