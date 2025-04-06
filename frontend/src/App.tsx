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
    // Check if user manually logged out
    const manualLogout = sessionStorage.getItem('manual_logout');
    if (manualLogout === 'true') {
      // Clear the flag
      sessionStorage.removeItem('manual_logout');
      // Set as not authenticated
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    // Check authentication status when the app loads
    const checkAuthStatus = async () => {
      try {
        console.log('Checking auth status with API:', API.auth.status);
        
        const response = await fetch(API.auth.status, {
          method: 'GET',
          credentials: 'include',
          // Add headers to prevent CORS preflight issues
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Auth check failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.error('Auth check failed:', error);
        // If authentication check fails, assume user is not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
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
