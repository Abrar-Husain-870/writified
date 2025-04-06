import React from 'react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { API } from '../utils/api';

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = true }) => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        console.log('Executing complete logout procedure');
        
        // Create a hidden iframe for the server-side logout
        const logoutFrame = document.createElement('iframe');
        logoutFrame.style.display = 'none';
        document.body.appendChild(logoutFrame);
        
        // 1. Save theme preference
        const currentThemePreference = localStorage.getItem('darkMode');
        
        // 2. Set permanent logout flags in both localStorage and sessionStorage
        localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
        sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
        
        // 3. Define a function to handle the complete client-side logout
        const completeClientLogout = () => {
            // Clear localStorage (except theme)
            const themeValue = localStorage.getItem('darkMode');
            localStorage.clear();
            if (themeValue) {
                localStorage.setItem('darkMode', themeValue);
            }
            
            // Keep the logout flag
            localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            
            // Clear sessionStorage but keep the logout flag
            const logoutFlag = sessionStorage.getItem('FORCE_LOGOUT');
            sessionStorage.clear();
            sessionStorage.setItem('FORCE_LOGOUT', logoutFlag || Date.now().toString());
            
            // Aggressively clear all cookies
            const cookieNames = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
            
            // Try multiple combinations of domain and path to ensure complete cookie removal
            const domains = [window.location.hostname, '', 'localhost', null];
            const paths = ['/', '/api', '/auth', '', null];
            
            cookieNames.forEach(name => {
                if (!name) return;
                
                domains.forEach(domain => {
                    paths.forEach(path => {
                        // Clear with various combinations
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
                            (path ? `; path=${path}` : '') + 
                            (domain ? `; domain=${domain}` : '');
                    });
                });
            });
            
            // Remove the iframe if it exists
            if (document.body.contains(logoutFrame)) {
                document.body.removeChild(logoutFrame);
            }
            
            console.log('Client-side logout completed, redirecting to login page');
            
            // Force navigation to login page with cache-busting parameter
            window.location.href = `/login?t=${Date.now()}`;
        };
        
        // 4. Set up a listener for the iframe completion or timeout
        let logoutCompleted = false;
        
        // Listen for message from the logout-complete.html page
        window.addEventListener('message', function logoutHandler(event) {
            if (event.data === 'logout_complete' && !logoutCompleted) {
                logoutCompleted = true;
                window.removeEventListener('message', logoutHandler);
                completeClientLogout();
            }
        });
        
        // Set a timeout to ensure logout completes even if the server response fails
        setTimeout(() => {
            if (!logoutCompleted) {
                logoutCompleted = true;
                console.log('Logout timeout reached, forcing client-side logout');
                completeClientLogout();
            }
        }, 3000);
        
        // 5. Start the server-side logout process
        try {
            // Use the iframe for the server logout with the correct endpoint
            // The server has a route at /api/auth/logout that redirects to /auth/logout
            logoutFrame.src = `${API.auth.logout}`;
            console.log('Server-side logout initiated with correct endpoint:', API.auth.logout);
        } catch (e) {
            console.error('Error during server logout attempt:', e);
            // If server logout fails, proceed with client-side logout
            setTimeout(() => {
                if (!logoutCompleted) {
                    logoutCompleted = true;
                    completeClientLogout();
                }
            }, 500);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow">
            <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start mb-4 sm:mb-0">
                    {showBackButton && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                    <div className="sm:hidden">
                        <DarkModeToggle />
                    </div>
                </div>
                <div className="flex items-center space-x-4 w-full sm:w-auto justify-center sm:justify-end">
                    <div className="hidden sm:block">
                        <DarkModeToggle />
                    </div>
                    <button
                        onClick={() => navigate('/my-assignments')}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
