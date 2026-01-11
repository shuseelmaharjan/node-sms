import { authApi } from "./api";
import { useAuthStore } from "./store";
import { toast } from "sonner";

// Prevent multiple bootstrap calls
let isBootstrapping = false;

export async function bootstrapSession() {
  if (isBootstrapping) return;
  
  const store = useAuthStore.getState();
  if (store.isInitialized && store.sessionValid) return;
  
  isBootstrapping = true;
  
  try {
    // Try to refresh the token (this validates the httpOnly refresh token)
    const response = await authApi.refresh();
    
    if (response.accessToken) {
      store.setAccessToken(response.accessToken);
      store.setSessionValid(true);
      
      // Get user info after successful refresh
      try {
        const userResponse = await authApi.me();
        if (userResponse.user) {
          store.setUser(userResponse.user);
        }
      } catch (userError) {
        console.warn('Failed to fetch user info after refresh:', userError);
        // Don't clear session if user fetch fails, just continue with token
      }
      
      console.log('Session validated successfully');
    } else {
      store.clear();
      console.log('No valid session found');
    }
  } catch (error) {
    console.warn('Session bootstrap failed:', error);
    
    // Don't show toast errors during bootstrap on login page or initial loads
    // Let the component handle showing appropriate messages
    if (typeof window !== 'undefined' && 
        !window.location.pathname.includes('/login') && 
        !window.location.pathname.includes('/debug')) {
      const apiError = error as any;
      if (apiError?.response?.status !== 401) {
        toast.error('Session validation failed');
      }
    }
    
    store.clear();
  } finally {
    store.setHydrated(true);
    store.setInitialized(true);
    isBootstrapping = false;
  }
}

export async function login(identifier: string, password: string) {
  try {
    console.log('Login attempt starting...');
    const data = await authApi.login(identifier, password);
    
    if (!data || !data.accessToken) {
      throw new Error('Login failed: Invalid response from server');
    }
    
    console.log('Login successful, setting auth state...');
    const store = useAuthStore.getState();
    store.setAccessToken(data.accessToken);
    store.setUser(data.user);
    store.setSessionValid(true);
    store.setHydrated(true);
    store.setInitialized(true);
    
    console.log('Auth state updated:', {
      hasToken: Boolean(data.accessToken),
      hasUser: Boolean(data.user),
      authenticated: Boolean(data.accessToken && data.user)
    });
    
    // Show success message
    toast.success(data.message || "Signed in successfully");
    
    return data;
  } catch (error: any) {
    console.error('Login failed:', error);
    
    // If it's our clean error from auth API, don't show duplicate toast
    if (error.message === 'LOGIN_FAILED') {
      throw error; // Just re-throw without additional logging/toast
    }
    
    // For other unexpected errors, show toast
    const message = error?.response?.data?.detail || 
                   error?.response?.data?.message || 
                   error?.message || 
                   'Login failed';
    toast.error(message);
    throw new Error(message);
  }
}

export async function logout(skipConfirmation: boolean = false, router?: any) {
  // For browser confirm fallback when not in component context
  if (!skipConfirmation) {
    const confirmed = confirm("Are you sure you want to sign out?");
    if (!confirmed) {
      return; // User cancelled
    }
  }

  const store = useAuthStore.getState();
  
  try {
    console.log('Logout attempt starting...');
    
    // Immediately clear local state to prevent UI hanging
    store.clear();
    console.log('Local auth state cleared immediately');
    
    // Try to logout on server (clears httpOnly refresh token)
    if (store.sessionValid) {
      await authApi.logout();
      console.log('Server logout successful');
    } else {
      console.log('No active session, performing local logout');
    }
  } catch (error: any) {
    console.warn('Server logout failed:', error);
    
    // Don't show error toast if logout API already handled it
    if (error.message !== 'LOGOUT_FAILED') {
      toast.error('Logout failed', { 
        description: 'You have been signed out locally.' 
      });
    }
  } finally {
    // Ensure state is cleared
    store.clear();
    console.log('Final auth state clear completed');
    
    // Show success toast
    toast.success("Signed out successfully");
    
    // Use router if provided, otherwise fallback to window.location
    if (router) {
      console.log('Redirecting via Next.js router...');
      router.push('/login');
    } else {
      console.log('Redirecting via window.location...');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
}
