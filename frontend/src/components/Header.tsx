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
        // First, create a hidden iframe to make a proper logout request
        const logoutFrame = document.createElement('iframe');
        logoutFrame.style.display = 'none';
        document.body.appendChild(logoutFrame);
        
        // Set up a message listener to know when the iframe has loaded
        window.addEventListener('message', function logoutComplete(event) {
            if (event.data === 'logout_complete') {
                // Save the current theme preference
                const currentThemePreference = localStorage.getItem('darkMode');
                
                // Clear all localStorage except theme
                localStorage.clear();
                if (currentThemePreference) {
                    localStorage.setItem('darkMode', currentThemePreference);
                }
                
                // Clear all sessionStorage
                sessionStorage.clear();
                
                // Clear all cookies
                document.cookie.split(';').forEach(cookie => {
                    const [name] = cookie.trim().split('=');
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                });
                
                // Remove the iframe
                document.body.removeChild(logoutFrame);
                
                // Remove the event listener
                window.removeEventListener('message', logoutComplete);
                
                console.log('Logout completed successfully');
                
                // Force a hard reload to the login page
                window.location.href = '/login';
            }
        });
        
        // Set the iframe source to the logout endpoint
        logoutFrame.src = `${API.baseUrl}/auth/logout`;
        
        // Set a fallback timeout in case the message event doesn't fire
        setTimeout(() => {
            // Force redirect to login page after 2 seconds regardless
            window.location.href = '/login';
        }, 2000);
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
