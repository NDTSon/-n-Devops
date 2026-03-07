import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MessageCircle, Send, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';

const CommentSection = ({ blogId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, isAuthenticated } = useAuth();
    const { can } = usePermission();

    useEffect(() => {
        fetchComments();
    }, [blogId]);

    const fetchComments = async () => {
        try {
            const response = await api.get(`/blogs/${blogId}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        setError('');

        try {
            await api.post(`/blogs/${blogId}/comments`, { content: newComment });
            setNewComment('');
            fetchComments();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to post comment');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (commentId) => {
        if (!editContent.trim()) return;

        try {
            await api.put(`/comments/${commentId}`, { content: editContent });
            setEditingId(null);
            setEditContent('');
            fetchComments();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to update comment');
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

        try {
            await api.delete(`/comments/${commentId}`);
            fetchComments(); // Refresh list after delete
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.error || 'Lỗi khi xóa bình luận');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        // FIX: Đảm bảo xử lý đúng giờ UTC bằng cách thêm 'Z' nếu thiếu
        const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
        const now = new Date();
        const diffInSeconds = (now - date) / 1000;

        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="mt-12 border-t border-slate-200 pt-8">
            <div className="flex items-center space-x-2 mb-6">
                <MessageCircle className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-slate-800">
                    Bình luận ({comments.length})
                </h2>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Form Bình luận */}
            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="mb-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Viết bình luận của bạn..."
                            className="input-field min-h-[100px] resize-y"
                            maxLength={1000}
                            required
                        />
                        <p className="mt-1 text-sm text-slate-500">
                            {newComment.length}/1000 ký tự
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !newComment.trim()}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                    >
                        <Send className="h-4 w-4" />
                        <span>{loading ? 'Đang gửi...' : 'Gửi bình luận'}</span>
                    </button>
                </form>
            ) : (
                <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="text-slate-600 mb-4">
                        Bạn cần đăng nhập để bình luận
                    </p>
                    <Link to="/login" className="btn-primary inline-block">
                        Đăng nhập
                    </Link>
                </div>
            )}

            {/* Danh sách bình luận */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {comment.authorUsername}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {formatDate(comment.createdAt)}
                                    </p>
                                </div>

                                {user && (
                                    <div className="flex items-center space-x-2">
                                        {can.updateComment(comment.authorId) && (
                                            <button
                                                onClick={() => {
                                                    setEditingId(comment.id);
                                                    setEditContent(comment.content);
                                                }}
                                                className="text-primary-600 hover:text-primary-700 p-1"
                                                title="Sửa bình luận"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        )}
                                        {can.deleteComment() && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="text-red-600 hover:text-red-700 p-1"
                                                title="Xóa bình luận"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {editingId === comment.id ? (
                                <div className="mt-3">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="input-field min-h-[80px] mb-2"
                                        maxLength={1000}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleEdit(comment.id)}
                                            className="btn-primary text-sm px-3 py-1"
                                        >
                                            Lưu
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditContent('');
                                            }}
                                            className="text-sm px-3 py-1 text-slate-600 hover:text-slate-800"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-700 whitespace-pre-wrap mt-2">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;
