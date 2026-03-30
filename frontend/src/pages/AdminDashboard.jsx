import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI, categoryAPI } from '../services/api';
import { Plus, Edit, Trash2, Calendar, Eye, Users, Pin, PinOff, FolderOpen, Search, X, LifeBuoy } from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const AdminDashboard = () => {
    const { user } = useAuth();
    const showToast = useToast();
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchBlogs();
        fetchCategories();
    }, []);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getAll({ includeInactive: true });
            // Sort: pinned blogs first
            const sortedBlogs = response.data.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return 0;
            });
            setBlogs(sortedBlogs);
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAllCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
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
            await blogAPI.delete(blogToDelete);
            setBlogs(blogs.filter((blog) => blog.id !== blogToDelete));
            setShowDeleteModal(false);
            setBlogToDelete(null);
        } catch (error) {
            showToast(error.response?.data?.error || 'Không thể xóa bài viết', 'error');
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
                await blogAPI.unpin(blog.id);
            } else {
                await blogAPI.togglePin(blog.id);
            }
            // Refresh blogs
            fetchBlogs();
        } catch (error) {
            showToast(error.response?.data?.error || 'Không thể cập nhật trạng thái ghim', 'error');
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
                <Spinner variant="bars" size="lg" label="Đang tải dữ liệu..." />
            </div>
        );
    }

    // Filter blogs by search query (client-side)
    const filteredBlogs = blogs.filter(blog => {
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesName = blog.name?.toLowerCase().includes(query);
            const matchesTitle = blog.title?.toLowerCase().includes(query);
            const matchesContent = blog.content?.toLowerCase().includes(query);
            const matchesAuthor = blog.authorUsername?.toLowerCase().includes(query.replace('@', ''));
            
            return matchesName || matchesTitle || matchesContent || matchesAuthor;
        }
        return true;
    });

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800">Admin Dashboard</h1>
                        <p className="text-slate-600 mt-2">Manage your blog posts</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {user?.role === 'ADMIN' && (
                            <Link
                                to="/admin/users"
                                className="btn-secondary inline-flex items-center space-x-2"
                            >
                                <Users className="h-5 w-5" />
                                <span>User Management</span>
                            </Link>
                        )}
                        <Link
                            to="/admin/categories"
                            className="btn-secondary inline-flex items-center space-x-2"
                        >
                            <span>Category Management</span>
                        </Link>
                        <Link
                            to="/admin/support"
                            className="btn-secondary inline-flex items-center space-x-2"
                        >
                            <LifeBuoy className="h-5 w-5" />
                            <span>Support Desk</span>
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
                    <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                        <h3 className="text-lg font-semibold mb-2">Pinned Blogs</h3>
                        <p className="text-4xl font-bold">{blogs.filter(b => b.pinned).length}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
                            <FolderOpen className="h-5 w-5" />
                            <span>Categories</span>
                        </h3>
                        <p className="text-4xl font-bold">{categories.length}</p>
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
                            placeholder="Tìm kiếm theo tên, tiêu đề, nội dung hoặc @username..."
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

                {/* Blog Table */}
                <div className="card overflow-hidden">
                    {filteredBlogs.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">{searchQuery ? 'Không tìm thấy kết quả' : 'No blogs yet'}</h3>
                            <p className="text-slate-600 mb-6">{searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Create your first blog post to get started'}</p>
                            {!searchQuery && (
                                <Link to="/admin/create" className="btn-primary inline-flex items-center space-x-2">
                                    <Plus className="h-5 w-5" />
                                    <span>Create Blog</span>
                                </Link>
                            )}
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
                                    {filteredBlogs.map((blog, index) => (
                                        <tr 
                                            key={`${blog.id}-${searchQuery}`} 
                                            className="hover:bg-slate-50 transition-colors animate-fadeIn"
                                            style={{ animationDelay: `${index * 0.03}s` }}
                                        >
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
