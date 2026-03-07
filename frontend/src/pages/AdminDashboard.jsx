import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Edit, Trash2, Calendar, Eye, Users, Pin, PinOff } from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const AdminDashboard = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await api.get('/blogs?includeInactive=true');
            setBlogs(response.data);
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setBlogToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!blogToDelete) return;

        setDeleting(true);
        try {
            await api.delete(`/blogs/${blogToDelete}`);
            setBlogs(blogs.filter((blog) => blog.id !== blogToDelete));
            setShowDeleteModal(false);
            setBlogToDelete(null);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete blog');
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setBlogToDelete(null);
    };

    const handleTogglePin = async (blog) => {
        try {
            if (blog.pinned) {
                await api.put(`/blogs/${blog.id}/unpin`);
            } else {
                await api.put(`/blogs/${blog.id}/pin`);
            }
            // Refresh blogs
            fetchBlogs();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update pin status');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800">Admin Dashboard</h1>
                        <p className="text-slate-600 mt-2">Manage your blog posts</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            to="/admin/users"
                            className="btn-secondary inline-flex items-center space-x-2"
                        >
                            <Users className="h-5 w-5" />
                            <span>User Management</span>
                        </Link>
                        <Link
                            to="/admin/create"
                            className="btn-primary inline-flex items-center space-x-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Create New Blog</span>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                        <h3 className="text-lg font-semibold mb-2">Total Blogs</h3>
                        <p className="text-4xl font-bold">{blogs.length}</p>
                    </div>
                </div>

                {/* Blog Table */}
                <div className="card overflow-hidden">
                    {blogs.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No blogs yet</h3>
                            <p className="text-slate-600 mb-6">Create your first blog post to get started</p>
                            <Link to="/admin/create" className="btn-primary inline-flex items-center space-x-2">
                                <Plus className="h-5 w-5" />
                                <span>Create Blog</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Title
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Author
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {blogs.map((blog) => (
                                        <tr key={blog.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start">
                                                    <div>
                                                        <p className="font-medium text-slate-800 line-clamp-1">
                                                            {blog.title}
                                                        </p>
                                                        <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                                                            {blog.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-700">
                                                    {blog.authorUsername}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2 text-sm text-slate-600">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(blog.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleTogglePin(blog)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            blog.pinned
                                                                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                                                : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                                                        }`}
                                                        title={blog.pinned ? 'Unpin' : 'Pin to top'}
                                                    >
                                                        {blog.pinned ? (
                                                            <Pin className="h-5 w-5 fill-current" />
                                                        ) : (
                                                            <PinOff className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                    <Link
                                                        to={`/blogs/${blog.id}`}
                                                        className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/edit/${blog.id}`}
                                                        className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(blog.id)}
                                                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Xóa blog này?"
                message="Blog sẽ bị xóa vĩnh viễn khỏi hệ thống. Tất cả nội dung, hình ảnh và bình luận liên quan sẽ bị mất."
                loading={deleting}
            />
        </div>
    );
};

export default AdminDashboard;
