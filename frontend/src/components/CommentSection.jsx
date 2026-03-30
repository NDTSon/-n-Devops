import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { commentAPI, blogAPI } from '../services/api';
import { MessageCircle, Send, Edit2, Trash2, AlertCircle, Reply } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';
import ConfirmModal from './ConfirmModal';

const CommentSection = ({ blogId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // { parentId, replyId, username }
    const [replyTags, setReplyTags] = useState(''); // Ô tag người
    const [replyContent, setReplyContent] = useState(''); // Ô nội dung
    const [expandedReplies, setExpandedReplies] = useState({}); // Track which comment's replies are expanded
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState({ open: false, commentId: null });
    const { user, isAuthenticated } = useAuth();
    const { can } = usePermission();

    useEffect(() => {
        fetchComments();
    }, [blogId]);

    const fetchComments = async () => {
        try {
            const response = await commentAPI.getByBlog(blogId);
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const content = newComment.trim();
        if (!content) return;

        setLoading(true);
        setError('');

        // --- Optimistic update ---
        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticComment = {
            id: optimisticId,
            blogId,
            content,
            authorId: user.id,
            authorUsername: user.username,
            createdAt: new Date().toISOString(),
            replies: [],
            _pending: true,
        };
        setComments(prev => [optimisticComment, ...prev]);
        setNewComment('');
        // -------------------------

        try {
            await commentAPI.create({ blogId, content });
            // Thay thế optimistic comment bằng dữ liệu thật từ server
            fetchComments();
        } catch (error) {
            // Rollback nếu API lỗi
            setComments(prev => prev.filter(c => c.id !== optimisticId));
            setNewComment(content);
            setError(error.response?.data?.error || 'Failed to post comment');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (commentId) => {
        if (!editContent.trim()) return;

        try {
            await commentAPI.update(commentId, { content: editContent });
            setEditingId(null);
            setEditContent('');
            fetchComments();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to update comment');
        }
    };

    const handleDelete = (commentId) => {
        setDeleteModal({ open: true, commentId });
    };

    const confirmDelete = async () => {
        const commentId = deleteModal.commentId;
        try {
            await commentAPI.delete(commentId);
            fetchComments();
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.error || 'Lỗi khi xóa bình luận');
        } finally {
            setDeleteModal({ open: false, commentId: null });
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim() || !replyingTo) return;

        setLoading(true);
        setError('');

        try {
            // Kết hợp tag và nội dung
            const fullContent = replyTags.trim() 
                ? `${replyTags.trim()} ${replyContent.trim()}`
                : replyContent.trim();
            
            await commentAPI.create({ blogId, content: fullContent, parentId: replyingTo.parentId });
            setReplyTags('');
            setReplyContent('');
            setReplyingTo(null);
            fetchComments();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to post reply');
        } finally {
            setLoading(false);
        }
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const INITIAL_REPLIES_SHOW = 2; // Show only 2 replies initially

    const countTotalComments = () => {
        let total = comments.length;
        comments.forEach(comment => {
            if (comment.replies) {
                total += comment.replies.length;
            }
        });
        return total;
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
                    Bình luận ({countTotalComments()})
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
                        <div key={comment.id} className={`space-y-3 transition-opacity duration-300 ${comment._pending ? 'opacity-60' : 'opacity-100'}`}>
                            {/* Parent Comment */}
                            <div className="p-4 bg-slate-50 rounded-lg">
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
                                    <>
                                        <p className="text-slate-700 whitespace-pre-wrap mt-2">
                                            {comment.content.split(/(@\w+)/g).map((part, i) => 
                                                part.startsWith('@') ? (
                                                    <span key={i} className="text-primary-600 font-semibold">{part}</span>
                                                ) : (
                                                    <span key={i}>{part}</span>
                                                )
                                            )}
                                        </p>
                                        {/* Reply Button */}
                                        {isAuthenticated && (
                                            <button
                                                onClick={() => {
                                                    setReplyingTo({ 
                                                        parentId: comment.id, 
                                                        replyId: null, 
                                                        username: comment.authorUsername 
                                                    });
                                                    setReplyTags(`@${comment.authorUsername}`);
                                                    setReplyContent('');
                                                }}
                                                className="mt-3 text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                                            >
                                                <Reply className="h-4 w-4" />
                                                <span>Trả lời</span>
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                                        {comment.replies.length}
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Reply Form */}
                            {replyingTo?.parentId === comment.id && replyingTo?.replyId === null && (
                                <div className="ml-8 p-4 bg-blue-50 border-l-4 border-primary-600 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-3">
                                        Đang trả lời <span className="font-semibold">{replyingTo.username}</span>
                                    </p>
                                    {/* Ô tag người */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Tag người (có thể thêm nhiều người)
                                        </label>
                                        <input
                                            type="text"
                                            value={replyTags}
                                            onChange={(e) => setReplyTags(e.target.value)}
                                            placeholder="@username @user2..."
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    {/* Ô nội dung */}
                                    <div className="mb-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Nội dung câu trả lời
                                        </label>
                                        <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Viết câu trả lời..."
                                            className="input-field min-h-[80px] resize-y"
                                            maxLength={1000}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">
                                        {(replyTags + ' ' + replyContent).length}/1000 ký tự
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handleReply}
                                            disabled={loading || !replyContent.trim()}
                                            className="btn-primary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-1"
                                        >
                                            <Send className="h-3 w-3" />
                                            <span>{loading ? 'Đang gửi...' : 'Gửi'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReplyingTo(null);
                                                setReplyTags('');
                                                setReplyContent('');
                                            }}
                                            className="text-sm px-3 py-1 text-slate-600 hover:text-slate-800"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Replies (Nested Comments) */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-8 space-y-3">
                                    {/* Show/Hide Toggle Button */}
                                    {comment.replies.length > INITIAL_REPLIES_SHOW && (
                                        <button
                                            onClick={() => toggleReplies(comment.id)}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                                        >
                                            <Reply className="h-3 w-3" />
                                            <span>
                                                {expandedReplies[comment.id] 
                                                    ? `Ẩn bớt câu trả lời` 
                                                    : `Xem ${comment.replies.length - INITIAL_REPLIES_SHOW} câu trả lời khác`
                                                }
                                            </span>
                                        </button>
                                    )}

                                    {/* Display replies */}
                                    {(expandedReplies[comment.id] 
                                        ? comment.replies 
                                        : comment.replies.slice(0, INITIAL_REPLIES_SHOW)
                                    ).map((reply) => (
                                        <div key={reply.id}>
                                            <div className="p-4 bg-white border border-slate-200 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 flex items-center space-x-2">
                                                            <Reply className="h-3 w-3 text-primary-600" />
                                                            <span>{reply.authorUsername}</span>
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {formatDate(reply.createdAt)}
                                                        </p>
                                                    </div>

                                                    {user && (
                                                        <div className="flex items-center space-x-2">
                                                            {can.updateComment(reply.authorId) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingId(reply.id);
                                                                        setEditContent(reply.content);
                                                                    }}
                                                                    className="text-primary-600 hover:text-primary-700 p-1"
                                                                    title="Sửa trả lời"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {can.deleteComment() && (
                                                                <button
                                                                    onClick={() => handleDelete(reply.id)}
                                                                    className="text-red-600 hover:text-red-700 p-1"
                                                                    title="Xóa trả lời"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {editingId === reply.id ? (
                                                    <div className="mt-3">
                                                        <textarea
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="input-field min-h-[80px] mb-2"
                                                            maxLength={1000}
                                                        />
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleEdit(reply.id)}
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
                                                    <>
                                                        <p className="text-slate-700 whitespace-pre-wrap mt-2">
                                                            {reply.content.split(/(@\w+)/g).map((part, i) => 
                                                                part.startsWith('@') ? (
                                                                    <span key={i} className="text-primary-600 font-semibold">{part}</span>
                                                                ) : (
                                                                    <span key={i}>{part}</span>
                                                                )
                                                            )}
                                                        </p>
                                                        {/* Reply Button for nested reply */}
                                                        {isAuthenticated && (
                                                            <button
                                                                onClick={() => {
                                                                    setReplyingTo({ 
                                                                        parentId: comment.id, 
                                                                        replyId: reply.id, 
                                                                        username: reply.authorUsername 
                                                                    });
                                                                    setReplyTags(`@${reply.authorUsername}`);
                                                                    setReplyContent('');
                                                                }}
                                                                className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                                                            >
                                                                <Reply className="h-3 w-3" />
                                                                <span>Trả lời</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Reply Form under this specific reply */}
                                            {replyingTo?.parentId === comment.id && replyingTo?.replyId === reply.id && (
                                                <div className="ml-6 mt-2 p-3 bg-blue-50 border-l-4 border-primary-600 rounded-lg">
                                                    <p className="text-xs text-slate-600 mb-2">
                                                        Đang trả lời <span className="font-semibold">{replyingTo.username}</span>
                                                    </p>
                                                    {/* Ô tag người */}
                                                    <div className="mb-2">
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                                            Tag người
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={replyTags}
                                                            onChange={(e) => setReplyTags(e.target.value)}
                                                            placeholder="@username @user2..."
                                                            className="input-field text-xs"
                                                        />
                                                    </div>
                                                    {/* Ô nội dung */}
                                                    <div className="mb-2">
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                                            Nội dung
                                                        </label>
                                                        <textarea
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            placeholder="Viết câu trả lời..."
                                                            className="input-field min-h-[60px] resize-y text-sm"
                                                            maxLength={1000}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-2">
                                                        {(replyTags + ' ' + replyContent).length}/1000 ký tự
                                                    </p>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={handleReply}
                                                            disabled={loading || !replyContent.trim()}
                                                            className="btn-primary text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-1"
                                                        >
                                                            <Send className="h-3 w-3" />
                                                            <span>{loading ? 'Đang gửi...' : 'Gửi'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(null);
                                                                setReplyTags('');
                                                                setReplyContent('');
                                                            }}
                                                            className="text-xs px-3 py-1 text-slate-600 hover:text-slate-800"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, commentId: null })}
                onConfirm={confirmDelete}
                title="Xóa bình luận"
                message="Bình luận này sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?"
                confirmText="Xóa"
                variant="danger"
            />
        </div>
    );
};

export default CommentSection;
