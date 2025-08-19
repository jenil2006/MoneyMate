// in src/pages/AccountSettings.jsx

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { toast } from 'react-hot-toast';
import { User, Lock, Mail, Save, Key } from 'lucide-react';

const AccountSettings = () => {
    const [userData, setUserData] = useState({ username: '', name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axiosInstance.get('/api/users/profile/');
                setUserData(response.data);
            } catch (error) {
                toast.error("Failed to fetch user data.");
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleUserChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.patch('/api/users/profile/', {
                username: userData.username,
                name: userData.name,
                
            });
            toast.success("Details updated successfully!");
        } catch (error) {
            // This will find and display the specific error from Django
            const errorMsg = Object.values(error.response.data).join(' ');
            toast.error(errorMsg || "Failed to update details.");
        }
    };
    
    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.put('/api/users/change-password/', passwordData);
            toast.success("Password changed successfully!");
            setPasswordData({ old_password: '', new_password: '' });
        } catch (error) {
            toast.error(error.response?.data?.old_password?.[0] || "Failed to change password.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Account Settings</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User Details Form */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2" /> Personal Details
                        </h2>
                        <form onSubmit={handleUpdateDetails} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Email (Read-only)</label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input type="email" value={userData.email} className="w-full pl-10 p-2 border rounded-md text-gray-900 " disabled />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Username</label>
                                <input type="text" name="username" value={userData.username} onChange={handleUserChange} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Name</label>
                                <input type="text" name="name" value={userData.name} onChange={handleUserChange} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </form>
                    </div>

                    {/* Change Password Form */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                            <Lock className="w-5 h-5 mr-2" /> Change Password
                        </h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Old Password</label>
                                <div className="relative mt-1">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input type="password" name="old_password" value={passwordData.old_password} onChange={handlePasswordChange} className="w-full pl-10 p-2 border rounded-md" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">New Password</label>
                                 <div className="relative mt-1">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} className="w-full pl-10 p-2 border rounded-md" required />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-800">Update Password</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;