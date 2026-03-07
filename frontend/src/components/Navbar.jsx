import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User, Settings, ChevronDown, Lock } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <BookOpen className="h-8 w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                            BlogHub
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="text-slate-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium"
                        >
                            Blogs
                        </Link>

                        {user ? (
                            <>
                                {(isAdmin() || user?.role === 'EDITOR') && (
                                    <>
                                        <Link
                                            to="/admin"
                                            className="flex items-center space-x-2 text-slate-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span>{isAdmin() ? 'Dashboard' : 'My Blogs'}</span>
                                        </Link>
                                        {isAdmin() && (
                                            <Link
                                                to="/admin/users"
                                                className="flex items-center space-x-2 text-slate-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium"
                                            >
                                                <User className="h-4 w-4" />
                                                <span>Users</span>
                                            </Link>
                                        )}
                                    </>
                                )}

                                <div className="relative pl-4 border-l border-slate-200" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all duration-200"
                                    >
                                        <User className="h-4 w-4 text-primary-600" />
                                        <span className="text-sm font-medium text-slate-700">
                                            {user.username}
                                        </span>
                                        {isAdmin() && (
                                            <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full">
                                                Admin
                                            </span>
                                        )}
                                        {user?.role === 'EDITOR' && (
                                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                                Editor
                                            </span>
                                        )}
                                        <ChevronDown className={`h-4 w-4 text-slate-600 transition-transform ${
                                            showDropdown ? 'rotate-180' : ''
                                        }`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                                            <button
                                                onClick={() => {
                                                    setShowChangePasswordModal(true);
                                                    setShowDropdown(false);
                                                }}
                                                className="flex items-center space-x-3 w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                <Lock className="h-4 w-4" />
                                                <span className="text-sm font-medium">Đổi mật khẩu</span>
                                            </button>
                                            <div className="border-t border-slate-100 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center space-x-3 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span className="text-sm font-medium">Đăng xuất</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-slate-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
            />
        </nav>
    );
};

export default Navbar;
