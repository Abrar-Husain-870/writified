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
        // ENHANCED CLIENT-SIDE LOGOUT SOLUTION
        console.log('Executing enhanced logout procedure');
        
        // 1. Save theme preference
        const currentThemePreference = localStorage.getItem('darkMode');
        
        // 2. Clear localStorage (except theme)
        localStorage.clear();
        if (currentThemePreference) {
            localStorage.setItem('darkMode', currentThemePreference);
        }
        
        // 3. Set logout flags BEFORE clearing storage
        // Store the logout flag in both localStorage (for persistence) and sessionStorage (for immediate use)
        const LOGOUT_FLAG = 'manual_logout';
        localStorage.setItem(LOGOUT_FLAG, 'true');
        sessionStorage.setItem(LOGOUT_FLAG, 'true');
        
        // 4. Clear sessionStorage EXCEPT for our logout flag
        const tempLogoutFlag = sessionStorage.getItem(LOGOUT_FLAG);
        sessionStorage.clear();
        // Re-add the logout flag after clearing
        if (tempLogoutFlag) {
            sessionStorage.setItem(LOGOUT_FLAG, tempLogoutFlag);
        }
        
        // 5. Clear all cookies with multiple approaches to ensure complete removal
        const cookieNames = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
        const domains = [window.location.hostname, '', null, undefined, 'localhost'];
        const paths = ['/', '/api', '', null, undefined];
        
        cookieNames.forEach(name => {
            // Try multiple domain and path combinations to ensure all cookies are cleared
            domains.forEach(domain => {
                paths.forEach(path => {
                    // Standard cookie clearing
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
                        (path ? `; path=${path}` : '') + 
                        (domain ? `; domain=${domain}` : '');
                });
            });
        });
        
        // 6. Also try to make a logout request to the server if possible
        try {
            fetch(`${API.baseUrl}/auth/logout`, {
                method: 'GET',
                credentials: 'include',
                mode: 'no-cors' // Use no-cors to prevent CORS issues
            }).catch(() => console.log('Server logout request failed, continuing with client logout'));
        } catch (e) {
            console.log('Error during server logout attempt:', e);
        }
        
        // 7. Force a complete page reload and navigation to login
        console.log('Redirecting to login page');
        window.location.replace('/login');
        
        // 8. Fallback redirect with a delay in case the first one doesn't work
        setTimeout(() => {
            console.log('Fallback logout redirect triggered');
            window.location.href = '/login';
        }, 500);
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
