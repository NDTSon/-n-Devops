import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Bell, MessageCircle, FileText, UserPlus, Mail, Check, CheckCheck, Trash2, ArrowLeft } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Spinner from '../components/Spinner';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread'
    const [confirmModal, setConfirmModal] = useState({ open: false });
    const { user } = useAuth();
    const navigate = useNavigate();
    const showToast = useToast();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchNotifications();
    }, [user, navigate]);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getAllNotifications();
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            showToast('Đã đánh dấu tất cả là đã đọc', 'success');
        } catch (error) {
            showToast('Không thể đánh dấu tất cả đã đọc', 'error');
        }
    };

    const handleDeleteRead = () => {
        setConfirmModal({
            open: true,
            title: 'Xóa thông báo đã đọc',
            message: 'Toàn bộ thông báo đã đọc sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?',
            onConfirm: async () => {
                try {
                    await notificationAPI.deleteReadNotifications();
                    setNotifications(prev => prev.filter(n => !n.isRead));
                    showToast('Đã xóa thông báo đã đọc', 'success');
                } catch (error) {
                    showToast('Không thể xóa thông báo đã đọc', 'error');
                } finally {
                    setConfirmModal({ open: false });
                }
            },
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_POST':
                return <FileText className="h-5 w-5 text-blue-600" />;
            case 'COMMENT_ON_POST': // Added for comment notifications
            case 'COMMENT_REPLY':
                return <MessageCircle className="h-5 w-5 text-green-600" />;
            case 'NEW_FOLLOWER':
                return <UserPlus className="h-5 w-5 text-purple-600" />;
            case 'NEW_MESSAGE':
                return <Mail className="h-5 w-5 text-pink-600" />;
            case 'POST_PINNED': // Added for pinned posts
                return <Bell className="h-5 w-5 text-orange-600" />;
            case 'POST_EDITED': // Added for edits
            case 'POST_DELETED': // Added for deletes
                return <FileText className="h-5 w-5 text-gray-600" />;
            default:
                return <Bell className="h-5 w-5 text-slate-600" />;
        }
    };

    const getNotificationLink = (notification) => {
        switch (notification.type) {
            case 'NEW_POST':
            case 'COMMENT_ON_POST':
            case 'COMMENT_REPLY':
            case 'POST_EDITED':
            case 'POST_PINNED':
                return `/blogs/${notification.relatedId}`;
            case 'NEW_FOLLOWER':
                return `/profile/${notification.actorId}`;
            case 'NEW_MESSAGE':
                return `/messages/${notification.actorId}`;
            case 'POST_DELETED':
                return '#'; // Deleted posts don't have a page
            default:
                return '#';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        return date.toLocaleDateString('vi-VN');
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner variant="dots" size="lg" label="Đang tải thông báo..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center space-x-2 text-slate-600 hover:text-primary-600 mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Quay lại</span>
                    </button>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-3">
                            <Bell className="h-8 w-8 text-primary-600" />
                            <h1 className="text-3xl font-bold text-slate-800">Thông báo</h1>
                        </div>

                        {notifications.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:text-primary-600 border border-slate-300 hover:border-primary-600 rounded-lg transition-all font-medium"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    <span>Đánh dấu tất cả đã đọc</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteRead}
                                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 border border-slate-300 hover:border-red-600 rounded-lg transition-all font-medium"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Xóa đã đọc</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex space-x-2 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                            filter === 'all'
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Tất cả ({notifications.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('unread')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                            filter === 'unread'
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Chưa đọc ({unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                            <Bell className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                            <h2 className="text-xl font-bold text-slate-800 mb-2">
                                {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo'}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {filter === 'unread'
                                    ? 'Bạn đã đọc hết tất cả!'
                                    : 'Các thông báo sẽ xuất hiện tại đây.'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${
                                    !notification.isRead
                                        ? 'border-l-4 border-primary-500'
                                        : 'border-slate-200'
                                }`}
                            >
                                <div className="flex items-start gap-3 p-4">
                                    {/* Unread dot */}
                                    {!notification.isRead && (
                                        <span className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-primary-500" />
                                    )}

                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={getNotificationLink(notification)}
                                            onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                            className="block hover:text-primary-600 transition-colors"
                                        >
                                            <p className={`text-sm mb-0.5 ${!notification.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                {notification.content}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatTime(notification.createdAt)}
                                            </p>
                                        </Link>
                                    </div>

                                    {/* Mark as Read Button */}
                                    {!notification.isRead && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                                            title="Đánh dấu đã đọc"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {filteredNotifications.length >= 20 && (
                    <div className="mt-8 text-center">
                        <button type="button" className="px-6 py-3 text-slate-600 hover:text-primary-600 border-2 border-slate-300 hover:border-primary-600 rounded-lg transition-all font-medium">
                            Tải thêm
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Xóa"
                variant="danger"
            />
        </div>
    );
};

export default NotificationsPage;
