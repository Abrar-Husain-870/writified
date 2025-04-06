import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateAssignment from './components/CreateAssignment';
import FindWriter from './components/FindWriter';
import WriterProfile from './components/WriterProfile';
import BrowseRequests from './components/BrowseRequests';
import Profile from './components/Profile';
import MyAssignments from './components/MyAssignments';
import MyRatings from './components/MyRatings';
import Tutorial from './components/Tutorial';
import AccountDeleted from './components/AccountDeleted';
import { ThemeProvider } from './contexts/ThemeContext';
import { API } from './utils/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persistent logout flag in localStorage (survives browser restarts)
    const userLoggedOut = localStorage.getItem('user_logged_out');
    
    // Check for session-based logout flag (only survives page refreshes)
    const manualLogout = sessionStorage.getItem('manual_logout');
    
    // If either logout flag is set, keep the user logged out
    if (userLoggedOut === 'true' || manualLogout === 'true') {
      console.log('Logout flag detected, preventing automatic login');
      
      // Clear the flags
      localStorage.removeItem('user_logged_out');
      sessionStorage.removeItem('manual_logout');
      
      // Clear any remaining auth cookies to be extra safe
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });
      
      // Set as not authenticated
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    // Check authentication status when the app loads
    const checkAuthStatus = async (retryCount = 0) => {
      try {
        console.log(`Checking auth status with API (attempt ${retryCount + 1}):`, API.auth.status);
        
        // First, check if we have any auth-related items in localStorage
        // If not, we can skip the API call and assume not authenticated
        const hasLocalAuthItems = Object.keys(localStorage).some(key => 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('user')
        );
        
        if (!hasLocalAuthItems) {
          console.log('No auth items found in localStorage, skipping auth check');
          setIsAuthenticated(false);
          return;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(API.auth.status, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          // Add headers to prevent CORS preflight issues
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Auth check failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Auth check response:', data);
        setIsAuthenticated(data.isAuthenticated);
        
        // If we're not authenticated according to the server, clear any local auth data
        if (!data.isAuthenticated) {
          console.log('Server reports not authenticated, clearing any local auth data');
          // Set the logout flag to prevent auto-login attempts
          localStorage.setItem('user_logged_out', 'true');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        
        // Properly type the error for TypeScript
        const err = error as Error;
        
        // Retry up to 2 times if the error is likely temporary (network issue)
        if (retryCount < 2 && (
          err.name === 'AbortError' || 
          (err.message && err.message.includes('NetworkError'))
        )) {
          console.log(`Retrying auth check (${retryCount + 1}/2)...`);
          setTimeout(() => checkAuthStatus(retryCount + 1), 1000); // Wait 1 second before retry
          return;
        }
        
        // If authentication check fails after retries, assume user is not authenticated
        setIsAuthenticated(false);
      } finally {
        if (retryCount === 0 || retryCount >= 2) {
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <AppContent isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      </Router>
    </ThemeProvider>
  );
}

// Separate component to access useLocation hook
const AppContent = ({ isAuthenticated, setIsAuthenticated }: { isAuthenticated: boolean | null, setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>> }) => {
  const location = useLocation();
  
  // Reset authentication state when account-deleted page is accessed
  useEffect(() => {
    if (location.pathname === '/account-deleted') {
      setIsAuthenticated(false);
    }
  }, [location.pathname, setIsAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/find-writer" element={isAuthenticated ? <FindWriter /> : <Navigate to="/login" replace />} />
        <Route path="/writer/:id" element={isAuthenticated ? <WriterProfile /> : <Navigate to="/login" replace />} />
        <Route path="/browse-requests" element={isAuthenticated ? <BrowseRequests /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="/my-assignments" element={isAuthenticated ? <MyAssignments /> : <Navigate to="/login" replace />} />
        <Route path="/my-ratings" element={isAuthenticated ? <MyRatings /> : <Navigate to="/login" replace />} />
        <Route path="/tutorial" element={isAuthenticated ? <Tutorial /> : <Navigate to="/login" replace />} />
        <Route path="/account-deleted" element={<AccountDeleted />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
};

export default App;
