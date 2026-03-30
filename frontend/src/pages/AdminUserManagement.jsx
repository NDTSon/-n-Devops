import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, blogAPI } from '../services/api';
import { Users, Shield, AlertCircle, CheckCircle, X, Search, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';

const AdminUserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);
    const [passwordUpdating, setPasswordUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmModal, setConfirmModal] = useState({ open: false });
    const [passwordModal, setPasswordModal] = useState({ open: false, userId: null, username: '' });
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const showToast = useToast();

    const currentRole = currentUser?.role;
    const isAdmin = currentRole === 'ADMIN';
    const isSupport = currentRole === 'SUPPORT';

    useEffect(() => {
        fetchUsers();
        fetchBlogs();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getAllUsers();
            setUsers(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchBlogs = async () => {
        try {
            const response = await blogAPI.getAll({ includeInactive: true });
            setBlogs(response.data);
        } catch (err) {
            console.error('Failed to load blogs:', err);
        }
    };

    const getBlogCountForUser = (userId) => {
        return blogs.filter(blog => blog.authorId === userId).length;
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleRoleChange = (userId, newRole, currentUsername) => {
        setConfirmModal({
            open: true,
            title: 'Thay đổi quyền',
            message: `Thay đổi quyền của ${currentUsername || 'người dùng'} thành ${newRole}?`,
            variant: 'warning',
            onConfirm: async () => {
                setUpdating(userId);
                setError('');
                try {
                    const response = await userAPI.updateRole(userId, newRole);
                    setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
                    showToast(`Đã cập nhật quyền thành ${newRole}`, 'success');
                } catch (err) {
                    showToast(err.response?.data?.error || 'Không thể cập nhật quyền', 'error');
                } finally {
                    setUpdating(null);
                    setConfirmModal({ open: false });
                }
            },
        });
    };

    const canSupportManage = (targetRole) => {
        if (!isSupport) return false;
        return targetRole === 'USER' || targetRole === 'EDITOR';
    };

    const canManageTargetUser = (targetRole) => {
        if (isAdmin) return targetRole !== 'ADMIN';
        if (isSupport) return canSupportManage(targetRole);
        return false;
    };

    const getAssignableRolesForCurrentUser = () => {
        if (isAdmin) {
            return ['USER', 'EDITOR', 'SUPPORT'];
        }
        if (isSupport) {
            return ['USER', 'EDITOR'];
        }
        return [];
    };

    const openPasswordModal = (userId, username) => {
        setPasswordModal({ open: true, userId, username: username || '' });
        setNewPassword('');
        setConfirmPassword('');
    };

    const closePasswordModal = () => {
        setPasswordModal({ open: false, userId: null, username: '' });
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleUpdateUserPassword = async () => {
        if (!passwordModal.userId) return;
        if (newPassword.trim().length < 6) {
            showToast('Mat khau moi phai tu 6 ky tu', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Xac nhan mat khau khong khop', 'error');
            return;
        }

        setPasswordUpdating(true);
        try {
            await userAPI.updateUserPassword(passwordModal.userId, newPassword);
            showToast(`Da doi mat khau cho ${passwordModal.username || 'nguoi dung'}`, 'success');
            closePasswordModal();
        } catch (err) {
            showToast(err.response?.data?.error || 'Khong the doi mat khau', 'error');
        } finally {
            setPasswordUpdating(false);
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'SUPPORT':
                return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'EDITOR':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'USER':
                return 'bg-green-100 text-green-700 border-green-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Filter users by search query (client-side)
    const filteredUsers = users.filter(user => {
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesUsername = user.username?.toLowerCase().includes(query);
            const matchesEmail = user.email?.toLowerCase().includes(query);
            
            return matchesUsername || matchesEmail;
        }
        return true;
    });

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <Users className="h-8 w-8 text-primary-600" />
                        <h1 className="text-4xl font-bold text-slate-800">User Management</h1>
                    </div>
                    <p className="text-slate-600">Manage user roles and permissions</p>
                    <Link to="/admin" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                        <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                        <p className="text-4xl font-bold">{users.length}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <h3 className="text-lg font-semibold mb-2">Editors</h3>
                        <p className="text-4xl font-bold">
                            {users.filter(u => u.role === 'EDITOR').length}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <h3 className="text-lg font-semibold mb-2">Regular Users</h3>
                        <p className="text-4xl font-bold">
                            {users.filter(u => u.role === 'USER').length}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                        <h3 className="text-lg font-semibold mb-2">Support Staff</h3>
                        <p className="text-4xl font-bold">
                            {users.filter(u => u.role === 'SUPPORT').length}
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên user hoặc email..."
                            className="w-full pl-12 pr-10 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Xóa tìm kiếm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto">
                            <X className="h-5 w-5 text-red-600" />
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                )}

                {/* User Table */}
                <div className="card overflow-hidden">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">{searchQuery ? 'Không tìm thấy user nào' : 'No users found'}</p>
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    Xóa tìm kiếm
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Username
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Current Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Posts
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Change Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Password</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-slate-800">
                                                        {user.username}
                                                    </span>
                                                    {user.role === 'ADMIN' && (
                                                        <Shield className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">{user.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.enabled ? (
                                                    <span className="text-green-600 text-sm">✓ Active</span>
                                                ) : (
                                                    <span className="text-orange-600 text-sm">⊗ Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">
                                                    {getBlogCountForUser(user.id)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {!canManageTargetUser(user.role) ? (
                                                    <span className="text-sm text-slate-400">Cannot modify</span>
                                                ) : (
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value, user.username)}
                                                        disabled={updating === user.id}
                                                        className="input-field text-sm py-1 px-2"
                                                    >
                                                        {getAssignableRolesForCurrentUser().map((roleOption) => (
                                                            <option key={roleOption} value={roleOption}>
                                                                {roleOption.charAt(0) + roleOption.slice(1).toLowerCase()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {updating === user.id && (
                                                    <div className="inline-block ml-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {!canManageTargetUser(user.role) ? (
                                                    <span className="text-sm text-slate-400">Not allowed</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPasswordModal(user.id, user.username)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                                                    >
                                                        <Lock className="w-3.5 h-3.5" />
                                                        Đổi mật khẩu
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Xác nhận"
                variant={confirmModal.variant || 'warning'}
            />

            {passwordModal.open && (
                <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">Đổi mật khẩu người dùng</h3>
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                className="p-1 rounded hover:bg-slate-100"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="px-5 py-4 space-y-3">
                            <p className="text-sm text-slate-600">
                                Tài khoản: <span className="font-semibold text-slate-800">{passwordModal.username}</span>
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nhap mat khau moi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nhap lai mat khau moi"
                                />
                            </div>
                        </div>

                        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                disabled={passwordUpdating}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateUserPassword}
                                disabled={passwordUpdating}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                            >
                                {passwordUpdating ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
