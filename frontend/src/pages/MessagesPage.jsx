import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import { Send, MessageCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-600',
];

function getAvatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    let h = 0;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const MessagesPage = () => {
    const { userId: paramUserId } = useParams();
    const { user } = useAuth();
    const showToast = useToast();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(paramUserId || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        fetchConversations();
        
        // Poll for new messages every 5 seconds
        pollIntervalRef.current = setInterval(() => {
            fetchConversations();
            if (selectedUserId) {
                fetchMessages(selectedUserId);
            }
        }, 5000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [user, navigate]);

    useEffect(() => {
        if (selectedUserId) {
            fetchMessages(selectedUserId);
            markMessagesAsRead(selectedUserId);
        }
    }, [selectedUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    };

    const fetchConversations = async () => {
        try {
            const response = await messageAPI.getConversations();
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const response = await messageAPI.getMessages(userId);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            showToast(error.response?.data?.error || 'Không thể tải tin nhắn', 'error');
        }
    };

    const markMessagesAsRead = async (senderId) => {
        try {
            await messageAPI.markAllAsReadFromSender(senderId);
            // Refresh conversations to update unread count
            fetchConversations();
        } catch (error) {
            console.error('Failed to mark messages as read:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserId) return;

        setSending(true);
        try {
            await messageAPI.sendMessage(selectedUserId, newMessage);
            setNewMessage('');
            await fetchMessages(selectedUserId);
            await fetchConversations();
        } catch (error) {
            console.error('Failed to send message:', error);
            showToast(error.response?.data?.error || 'Không thể gửi tin nhắn. Hãy đảm bảo cả hai đều đang follow nhau.', 'error');
        } finally {
            setSending(false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => inputRef.current?.focus());
            });
        }
    };

    const formatMessageTime = (dateString) => {
        // Append Z if no timezone info so browser parses as UTC (not local time)
        const normalized = dateString && !dateString.endsWith('Z') && !dateString.includes('+') ? dateString + 'Z' : dateString;
        const date = new Date(normalized);
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

    const getSelectedConversation = () => {
        return conversations.find(c => String(c.userId) === String(selectedUserId));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner variant="orbit" size="lg" label="Đang tải tin nhắn..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center space-x-2 text-slate-600 hover:text-primary-600 mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Quay lại</span>
                    </button>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center space-x-3">
                        <MessageCircle className="h-8 w-8 text-primary-600" />
                        <span>Tin nhắn</span>
                    </h1>
                </div>

                {/* Messages Container */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
                    <div className="flex h-full">
                        {/* Conversations Sidebar */}
                        <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h2 className="font-semibold text-slate-800">Cuộc trò chuyện</h2>
                            </div>
                            
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                    <p>Chưa có cuộc trò chuyện nào</p>
                                    <p className="text-sm mt-2">Theo dõi người dùng để bắt đầu nhắn tin!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {conversations.map((conv) => {
                                        const grad = getAvatarColor(conv.username);
                                        const isUnread = conv.unreadCount > 0;
                                        return (
                                        <button
                                            key={conv.userId}
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setSelectedUserId(conv.userId.toString()); }}
                                            className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                                                selectedUserId == conv.userId ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-base`}>
                                                        {conv.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {!conv.isMutualFollow && (
                                                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center" title="Người lạ">
                                                            <AlertCircle className="h-3 w-3 text-white" />
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className={`font-medium truncate ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                                                            {conv.username}
                                                        </span>
                                                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                                            {formatMessageTime(conv.lastMessageTime)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm truncate ${isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                                            {conv.lastMessage}
                                                        </p>
                                                        {isUnread && (
                                                            <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
                                                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col">
                            {selectedUserId ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const conv = getSelectedConversation();
                                                const grad = getAvatarColor(conv?.username);
                                                return (
                                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                        {conv?.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                );
                                            })()}
                                            <span className="font-semibold text-slate-800">
                                                {getSelectedConversation()?.username || 'User'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                        {messages.length === 0 ? (
                                            <div className="text-center text-slate-500 mt-8">
                                                <p>Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${String(msg.senderId) === String(user.id) ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                                            String(msg.senderId) === String(user.id)
                                                                ? 'bg-primary-600 text-white'
                                                                : 'bg-white text-slate-800 border border-slate-200'
                                                        }`}
                                                    >
                                                        <p className="break-words">{msg.content}</p>
                                                        <p
                                                            className={`text-xs mt-1 ${
                                                                String(msg.senderId) === String(user.id)
                                                                    ? 'text-primary-100'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {formatMessageTime(msg.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-slate-200 bg-white">
                                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Nhập tin nhắn..."
                                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                            <button
                                                type="submit"
                                                disabled={sending || !newMessage.trim()}
                                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                                            >
                                                <Send className="h-4 w-4" />
                                                <span>{sending ? 'Đang gửi...' : 'Gửi'}</span>
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-slate-50">
                                    <div className="text-center text-slate-500">
                                        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                        <p className="text-lg">Chọn cuộc trò chuyện để bắt đầu nhắn tin</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
