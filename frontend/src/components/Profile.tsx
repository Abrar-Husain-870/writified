import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header'; // Assuming the Header component is in the same directory
import { API } from '../utils/api'; // Correct import path for the API utility

interface User {
    id: number;
    name: string;
    email: string;
    profile_picture: string;
    university_stream: string;
    whatsapp_number: string;
    writer_status: 'active' | 'busy' | 'inactive';
    rating: number;
    total_ratings: number;
}

interface Portfolio {
    sample_work_image: string;
    description: string;
}

const Profile: React.FC = () => {
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [portfolio, setPortfolio] = useState<Portfolio>({
        sample_work_image: '',
        description: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Fetch user profile
        fetch(API.users.profile, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                // Log the error response for debugging
                console.error(`Profile fetch failed with status: ${res.status}`);
                return res.text().then(text => {
                    try {
                        // Try to parse as JSON
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.error || `Failed to fetch profile: ${res.status}`);
                    } catch (e) {
                        // If parsing fails, use the raw text or status
                        throw new Error(`Failed to fetch profile: ${text || res.status}`);
                    }
                });
            }
            return res.json();
        })
        .then(data => {
            setUser(data);
            if (data.portfolio) {
                setPortfolio(data.portfolio);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching profile:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to load profile' });
            setLoading(false);
        });
    }, []);

    const handleWriterStatusUpdate = async (status: 'active' | 'busy' | 'inactive') => {
        try {
            // Check if user is trying to set status to active or busy without a WhatsApp number
            if ((status === 'active' || status === 'busy') && (!user?.whatsapp_number || user.whatsapp_number.trim() === '')) {
                setMessage({ 
                    type: 'error', 
                    text: 'Please add your WhatsApp number before setting your status to Available or Busy' 
                });
                return;
            }
            
            console.log('Sending writer status update:', {
                writer_status: status,
                university_stream: user?.university_stream || '',
                whatsapp_number: user?.whatsapp_number || ''
            });
            
            const response = await fetch(API.users.updateWriterProfile, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    writer_status: status,
                    university_stream: user?.university_stream || '',
                    whatsapp_number: user?.whatsapp_number || ''
                })
            });

            console.log('Response status:', response.status);
            
            if (response.ok) {
                const updatedUser = await response.json();
                console.log('Updated user:', updatedUser);
                setUser(updatedUser);
                setMessage({ type: 'success', text: 'Writer status updated successfully!' });
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                try {
                    const error = JSON.parse(errorText);
                    setMessage({ type: 'error', text: error.error || 'Failed to update writer status' });
                } catch (e) {
                    setMessage({ type: 'error', text: 'Failed to update writer status' });
                }
            }
        } catch (error) {
            console.error('Error updating writer status:', error);
            setMessage({ type: 'error', text: 'Failed to update writer status' });
        }
    };

    const handlePortfolioUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert Google Drive link if necessary
        let imageUrl = portfolio.sample_work_image;
        if (imageUrl) {
            // Handle Google Drive links
            if (imageUrl.includes('drive.google.com/file/d/')) {
                // Extract file ID from Google Drive link
                const fileIdMatch = imageUrl.match(/\/d\/([^/]+)/);
                if (fileIdMatch && fileIdMatch[1]) {
                    const fileId = fileIdMatch[1];
                    imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                    console.log('Converted Google Drive URL:', imageUrl);
                }
            }
            // Handle Google Drive sharing links
            else if (imageUrl.includes('drive.google.com/open?id=')) {
                const idParam = new URL(imageUrl).searchParams.get('id');
                if (idParam) {
                    imageUrl = `https://drive.google.com/uc?export=view&id=${idParam}`;
                    console.log('Converted Google Drive sharing URL:', imageUrl);
                }
            }
        }
        
        try {
            const response = await fetch(API.users.updatePortfolio, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...portfolio,
                    sample_work_image: imageUrl
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Portfolio updated successfully!' });
                
                // Update the portfolio state only once with the final URL
                setPortfolio(prevState => ({
                    ...prevState,
                    sample_work_image: imageUrl
                }));
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Failed to update portfolio' });
            }
        } catch (error) {
            console.error('Error updating portfolio:', error);
            setMessage({ type: 'error', text: 'Failed to update portfolio' });
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setDeleteError(null);
            const response = await fetch(API.users.deleteAccount, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    confirmDelete: 'DELETE_MY_ACCOUNT_PERMANENTLY'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error deleting account:', errorText);
                try {
                    const error = JSON.parse(errorText);
                    setDeleteError(error.error || 'Failed to delete account');
                } catch (e) {
                    setDeleteError('Failed to delete account');
                }
                return;
            }

            // Account deleted successfully, redirect to account deleted page
            navigate('/account-deleted');
        } catch (error) {
            console.error('Error deleting account:', error);
            setDeleteError('Failed to delete account. Please try again later.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header title="Profile" />

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-md ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Profile Section */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center space-x-4 mb-6">
                                <img
                                    src={user.profile_picture}
                                    alt={user.name}
                                    className="h-16 w-16 rounded-full"
                                />
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                                    <p className="text-gray-600">{user.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">University Stream</label>
                                    <input
                                        type="text"
                                        value={user.university_stream || ''}
                                        onChange={(e) => setUser({ ...user, university_stream: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                                    <input
                                        type="tel"
                                        value={user.whatsapp_number || ''}
                                        onChange={(e) => setUser({ ...user, whatsapp_number: e.target.value })}
                                        placeholder="+91XXXXXXXXXX"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    {!user.whatsapp_number && (
                                        <p className="mt-1 text-sm text-amber-600">
                                            * Required to set your status as Available or Busy
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Writer Status</label>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => handleWriterStatusUpdate('active')}
                                            disabled={!user.whatsapp_number || user.whatsapp_number.trim() === ''}
                                            className={`px-4 py-2 rounded-md ${
                                                user.writer_status === 'active'
                                                    ? 'bg-green-600 text-white'
                                                    : !user.whatsapp_number || user.whatsapp_number.trim() === ''
                                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Available
                                        </button>
                                        <button
                                            onClick={() => handleWriterStatusUpdate('busy')}
                                            disabled={!user.whatsapp_number || user.whatsapp_number.trim() === ''}
                                            className={`px-4 py-2 rounded-md ${
                                                user.writer_status === 'busy'
                                                    ? 'bg-red-600 text-white'
                                                    : !user.whatsapp_number || user.whatsapp_number.trim() === ''
                                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Busy
                                        </button>
                                        <button
                                            onClick={() => handleWriterStatusUpdate('inactive')}
                                            className={`px-4 py-2 rounded-md ${
                                                user.writer_status === 'inactive'
                                                    ? 'bg-gray-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {user.rating > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings & Reviews</h3>
                                <div className="flex items-center space-x-2">
                                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-xl font-semibold text-gray-900">{typeof user.rating === 'number' ? user.rating.toFixed(1) : '0.0'}</span>
                                    <span className="text-gray-500">({user.total_ratings || 0} reviews)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Portfolio Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Writer Portfolio</h3>
                        <form onSubmit={handlePortfolioUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sample Work Image URL</label>
                                <input
                                    type="url"
                                    value={portfolio.sample_work_image}
                                    onChange={(e) => setPortfolio(prev => ({ ...prev, sample_work_image: e.target.value }))}
                                    placeholder="https://example.com/image.jpg"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    For best results, use direct image URLs from Imgur or other image hosting services.
                                </p>
                                <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                                    <p className="font-medium text-blue-700">How to use Imgur for image hosting:</p>
                                    <ol className="list-decimal pl-5 mt-1 text-blue-600 space-y-1">
                                        <li>Go to <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline">imgur.com/upload</a></li>
                                        <li>Upload your image (no account required)</li>
                                        <li>Right-click on the uploaded image and select "Copy image address"</li>
                                        <li>Paste the copied URL here</li>
                                    </ol>
                                </div>
                                {portfolio.sample_work_image && (
                                    <div className="mt-4 border p-3 rounded-md">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                                        <img 
                                            src={portfolio.sample_work_image} 
                                            alt="Preview" 
                                            className="max-h-60 rounded border border-gray-300"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e96ddb7f%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e96ddb7f%22%3E%3Crect%20width%3D%22400%22%20height%3D%22200%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22150%22%20y%3D%22110%22%3EInvalid%20Image%20URL%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                                                target.onerror = null; // Prevent infinite error loop
                                            }}
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={portfolio.description}
                                    onChange={(e) => setPortfolio(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Tell others about your writing experience and expertise..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Update Portfolio
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            
            {/* Account Settings Section */}
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Account Settings</h3>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 rounded-md">
                            <p className="text-blue-700">
                                <span className="font-medium">Tip:</span> Getting unwanted assignment requests? Try switching your writing status to "Inactive".
                            </p>
                        </div>
                        
                        <div className="border-t pt-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Danger Zone</h4>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start space-x-3">
                                        <svg className="h-6 w-6 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <h5 className="text-md font-medium text-gray-900">Delete Account</h5>
                                            <p className="text-sm text-gray-500">
                                                Permanently delete your account and all associated data. This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteConfirmation(true)}
                                        className="px-4 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Account Deletion</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete your account? This action is irreversible.</p>
                        {deleteError && (
                            <div className="mb-6 p-4 rounded-md bg-red-100 text-red-700">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
