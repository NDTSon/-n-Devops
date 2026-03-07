import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, Shield, AlertCircle, CheckCircle, X } from 'lucide-react';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            return;
        }

        setUpdating(userId);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.put(`/users/${userId}/role`, { role: newRole });

            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? response.data : user
            ));

            setSuccessMessage(`Role updated successfully to ${newRole}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-700 border-red-300';
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
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
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No users found</p>
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
                                            Change Role
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {users.map((user) => (
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
                                                {user.role === 'ADMIN' ? (
                                                    <span className="text-sm text-slate-400">Cannot modify</span>
                                                ) : (
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        disabled={updating === user.id}
                                                        className="input-field text-sm py-1 px-2"
                                                    >
                                                        <option value="USER">User</option>
                                                        <option value="EDITOR">Editor</option>
                                                    </select>
                                                )}
                                                {updating === user.id && (
                                                    <div className="inline-block ml-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;
