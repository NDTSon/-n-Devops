import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, followAPI, blogAPI } from '../services/api';
import FollowButton from '../components/FollowButton';
import { useToast } from '../context/ToastContext';
import {
    User, Calendar, BookOpen, Users, ArrowLeft,
    ShieldCheck, Mail, MessageCircle, ArrowRight,
    FileText, File, ExternalLink, Eye, EyeOff
} from 'lucide-react';

// â”€â”€ Helper giá»‘ng BlogListPage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const isVideoFile = (blog) => {
    if (blog.imageMimeType) return blog.imageMimeType.startsWith('video/');
    const url = blog.imageUrl || (blog.imageFileId ? `/api/files/download/${blog.imageFileId}` : ''); if (!url) return false;
    const l = url.toLowerCase();
    return l.endsWith('.mp4') || l.endsWith('.webm') || l.endsWith('.ogg') || l.endsWith('.mov') || l.endsWith('.avi');
};
const isDocumentFile = (blog) => {
    if (blog.imageMimeType) return blog.imageMimeType === 'application/pdf' || blog.imageMimeType.includes('word') || blog.imageMimeType.includes('document') || blog.imageMimeType.includes('spreadsheet') || blog.imageMimeType.includes('excel') || blog.imageMimeType.includes('powerpoint') || blog.imageMimeType.includes('presentation');
    const url = blog.imageUrl || (blog.imageFileId ? `/api/files/download/${blog.imageFileId}` : ''); if (!url) return false; const l = url.toLowerCase();
    return l.endsWith('.pdf') || l.endsWith('.docx') || l.endsWith('.doc') || l.endsWith('.xlsx') || l.endsWith('.xls') || l.endsWith('.ppt') || l.endsWith('.pptx');
};
const getFileIcon = (blog) => {
    if (blog.imageMimeType) {
        const m = blog.imageMimeType.toLowerCase();
        if (m === 'application/pdf') return { icon: FileText, color: 'text-red-600', gradient: 'from-red-500 to-rose-600', borderColor: 'border-red-200', badgeBg: 'bg-red-100', name: 'PDF' };
        if (m.includes('excel') || m.includes('spreadsheet')) return { icon: FileText, color: 'text-green-600', gradient: 'from-green-500 to-emerald-600', borderColor: 'border-green-200', badgeBg: 'bg-green-100', name: 'Excel' };
        if (m.includes('word') || m.includes('document')) return { icon: FileText, color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600', borderColor: 'border-blue-200', badgeBg: 'bg-blue-100', name: 'Word' };
        if (m.includes('powerpoint') || m.includes('presentation')) return { icon: FileText, color: 'text-orange-600', gradient: 'from-orange-500 to-amber-600', borderColor: 'border-orange-200', badgeBg: 'bg-orange-100', name: 'PowerPoint' };
    }
    const url = blog.imageUrl || (blog.imageFileId ? `/api/files/download/${blog.imageFileId}` : '');
    if (!url) return { icon: File, color: 'text-slate-600', gradient: 'from-slate-400 to-slate-600', borderColor: 'border-slate-200', badgeBg: 'bg-slate-100', name: 'File' };
    const l = url.toLowerCase();
    if (l.endsWith('.pdf')) return { icon: FileText, color: 'text-red-600', gradient: 'from-red-500 to-rose-600', borderColor: 'border-red-200', badgeBg: 'bg-red-100', name: 'PDF' };
    if (l.endsWith('.xlsx') || l.endsWith('.xls')) return { icon: FileText, color: 'text-green-600', gradient: 'from-green-500 to-emerald-600', borderColor: 'border-green-200', badgeBg: 'bg-green-100', name: 'Excel' };
    if (l.endsWith('.docx') || l.endsWith('.doc')) return { icon: FileText, color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600', borderColor: 'border-blue-200', badgeBg: 'bg-blue-100', name: 'Word' };
    return { icon: File, color: 'text-slate-600', gradient: 'from-slate-400 to-slate-600', borderColor: 'border-slate-200', badgeBg: 'bg-slate-100', name: 'File' };
};
const extractFileName = (blog) => {
    if (blog.originalFileName) return blog.originalFileName;
    const url = blog.imageUrl || (blog.imageFileId ? `/api/files/download/${blog.imageFileId}` : '');
    if (url && url.includes('/api/files/download/')) {
        if (blog.imageMimeType) {
            const m = blog.imageMimeType.toLowerCase();
            if (m === 'application/pdf') return 'Document.pdf';
            if (m.includes('word') || m.includes('document')) return 'Document.docx';
            if (m.includes('excel') || m.includes('spreadsheet')) return 'Spreadsheet.xlsx';
            if (m.includes('powerpoint') || m.includes('presentation')) return 'Presentation.pptx';
        }
        return 'File đính kèm';
    }
    if (!url) return 'File đính kèm';
    try { const parts = url.split('/'); const f = parts[parts.length - 1]; if (f.includes('.')) return decodeURIComponent(f); return 'File đính kèm'; } catch { return 'File đính kèm'; }
};
const truncateContent = (content, maxLength = 150) => { if (!content) return ''; if (content.length <= maxLength) return content; return content.substring(0, maxLength) + '...'; };
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ROLE_COLORS = {
    ADMIN: 'bg-red-100 text-red-700 border-red-200',
    EDITOR: 'bg-blue-100 text-blue-700 border-blue-200',
    USER: 'bg-slate-100 text-slate-600 border-slate-200',
};

const AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-600',
];

function getAvatarColor(username) {
    if (!username) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash += username.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const UserProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [profile, setProfile] = useState(null);
    const [blogs, setBlogs] = useState([]);
    const [stats, setStats] = useState({ followerCount: 0, followingCount: 0 });
    const [followers, setFollowers] = useState([]);
    const [followersLoading, setFollowersLoading] = useState(true);
    const [following, setFollowing] = useState([]);
    const [followingLoading, setFollowingLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [blogsLoading, setBlogsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'followers' | 'following'
    const [showEmailPublic, setShowEmailPublic] = useState(false); // own profile: current showEmail pref
    const [togglingEmail, setTogglingEmail] = useState(false);
    const [brokenMediaUrls, setBrokenMediaUrls] = useState(new Set());

    const getMediaUrl = (blog) => {
        if (!blog) return '';
        if (blog.imageFileId) return `/api/files/download/${blog.imageFileId}`;
        return blog.imageUrl || '';
    };

    const markMediaBroken = (url) => {
        if (!url) return;
        setBrokenMediaUrls((prev) => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
        });
    };

    const shouldAutoPreviewMedia = (blog, url) => {
        if (!url) return false;
        if (!url.includes('/api/files/download/')) return true;

        const mimeType = (blog.imageMimeType || '').toLowerCase();
        if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) return true;

        const fileName = (blog.originalFileName || '').toLowerCase();
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|webm|ogg|mov|avi|mkv)$/.test(fileName);
    };

    const isOwnProfile = currentUser && String(currentUser.id) === String(userId);

    useEffect(() => {
        if (!userId) return;
        fetchProfile();
        fetchStats();
        fetchBlogs();
        if (isOwnProfile) {
            fetchFollowers();
            fetchFollowing();
        }
    }, [userId, isOwnProfile]);

    const fetchProfile = async () => {
        try {
            let res;
            if (isOwnProfile) {
                res = await userAPI.getMyProfile();
                setShowEmailPublic(res.data.showEmail ?? false);
            } else {
                res = await userAPI.getUserById(userId);
            }
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleShowEmail = async () => {
        if (togglingEmail) return;
        setTogglingEmail(true);
        const newValue = !showEmailPublic;
        try {
            await userAPI.updateShowEmail(newValue);
            setShowEmailPublic(newValue);
            showToast(newValue ? 'Email hiện với người khác' : 'Email đã ẩn với người khác', 'success');
        } catch (err) {
            showToast('Không thể cập nhật cài đặt email', 'error');
        } finally {
            setTogglingEmail(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await followAPI.getFollowStats(userId);
            setStats(res.data);
        } catch {/* ignore */}
    };

    const fetchBlogs = async () => {
        setBlogsLoading(true);
        try {
            const res = await blogAPI.getBlogsByAuthor(userId);
            setBlogs(res.data || []);
        } catch {/* ignore */} finally {
            setBlogsLoading(false);
        }
    };

    const fetchFollowers = async () => {
        setFollowersLoading(true);
        try {
            const res = await followAPI.getFollowers(userId);
            setFollowers(res.data || []);
        } catch (e) {
            console.error('Failed to fetch followers:', e);
        } finally {
            setFollowersLoading(false);
        }
    };

    const fetchFollowing = async () => {
        setFollowingLoading(true);
        try {
            const res = await followAPI.getFollowing(userId);
            setFollowing(res.data || []);
        } catch (e) {
            console.error('Failed to fetch following:', e);
        } finally {
            setFollowingLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <User className="h-20 w-20 text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700 mb-2">User not found</h2>
                <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline">Go back</button>
            </div>
        );
    }

    const avatarGradient = getAvatarColor(profile.username);
    const publishedBlogs = blogs.filter(b => b.status !== false);

    return (
        <div className="min-h-screen py-8 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Quay lại */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-slate-600 hover:text-primary-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium text-sm">Quay lại</span>
                </button>

                {/* â”€â”€ Avatar + ThĂ´ng tin â”€â”€ */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-4xl font-bold shadow-md flex-shrink-0`}>
                            {profile.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-slate-800">{profile.username}</h1>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_COLORS[profile.role] || ROLE_COLORS.USER}`}>
                                    {profile.role === 'ADMIN' && <ShieldCheck className="inline h-3 w-3 mr-1" />}
                                    {profile.role}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                                <Mail className="h-4 w-4" />
                                {isOwnProfile ? (
                                    <>
                                        <span>{profile.email}</span>
                                        <button
                                            type="button"
                                            onClick={toggleShowEmail}
                                            disabled={togglingEmail}
                                            title={showEmailPublic ? 'Ẩn email với người khác' : 'Hiện email với người khác'}
                                            className="ml-1 text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                                        >
                                            {showEmailPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                        <span className="text-xs text-slate-400">
                                            ({showEmailPublic ? 'Đang hiện với người khác' : 'Đang ẩn với người khác'})
                                        </span>
                                    </>
                                ) : (
                                    <span>{profile.email || 'Ẩn email'}</span>
                                )}
                            </div>
                            {profile.createdAt && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span>Tham gia {formatDate(profile.createdAt)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            {currentUser && !isOwnProfile && (
                                <>
                                    <FollowButton userId={userId} />
                                    <button
                                        type="button"
                                        onClick={() => window.__openChat?.({ id: userId, username: profile.username })}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        Nhắn tin
                                    </button>
                                </>
                            )}
                            {isOwnProfile && (
                                <span className="text-sm text-slate-400 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 font-medium">
                                    Đây là trang của bạn
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                            <div className="text-2xl font-bold text-slate-800">{publishedBlogs.length}</div>
                            <div className="text-sm text-slate-500 flex items-center justify-center gap-1"><BookOpen className="h-4 w-4" /> Bài viết</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                            <div className="text-2xl font-bold text-slate-800">{stats.followerCount}</div>
                            <div className="text-sm text-slate-500 flex items-center justify-center gap-1"><Users className="h-4 w-4" /> Người theo dõi</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                            <div className="text-2xl font-bold text-slate-800">{stats.followingCount}</div>
                            <div className="text-sm text-slate-500 flex items-center justify-center gap-1"><Users className="h-4 w-4" /> Đang theo dõi</div>
                        </div>
                    </div>
                </div>

                {/* Tab switcher - own profile only */}
                {isOwnProfile && (
                    <div className="flex gap-2 mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-1.5 w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTab('posts')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'posts'
                                    ? 'bg-primary-600 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <BookOpen className="h-4 w-4" />
                            {`Bài viết (${publishedBlogs.length})`}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('followers')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'followers'
                                    ? 'bg-primary-600 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            {`Người theo dõi (${stats.followerCount})`}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('following')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'following'
                                    ? 'bg-primary-600 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            {`Đang theo dõi (${stats.followingCount})`}
                        </button>
                    </div>
                )}

                {/* Bai viet section */}
                {(!isOwnProfile || activeTab === 'posts') && (
                <div className="mb-10">
                    {!isOwnProfile && (
                        <div className="flex items-center gap-3 mb-6">
                            <BookOpen className="h-6 w-6 text-primary-600" />
                            <h2 className="text-xl font-bold text-slate-800">{`Bài viết (${publishedBlogs.length})`}</h2>
                        </div>
                    )}
                    {blogsLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
                    ) : publishedBlogs.length === 0 ? (
                        <div className="text-center py-14 bg-white rounded-2xl shadow-sm border border-slate-200">
                            <BookOpen className="h-14 w-14 mx-auto mb-3 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có bài viết nào</h3>
                            <p className="text-slate-500 text-sm">Người dùng này chưa đăng bài viết nào.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {publishedBlogs.map((blog, index) => (
                                <article
                                    key={blog.id}
                                    className="card group hover:scale-105 transition-transform duration-300 flex flex-col h-full"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="mb-4 h-48 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        {(() => {
                                            const mediaUrl = getMediaUrl(blog);
                                            const hasLoadableMedia = mediaUrl && !brokenMediaUrls.has(mediaUrl) && shouldAutoPreviewMedia(blog, mediaUrl);
                                            const fi = getFileIcon(blog);
                                            const Icon = fi.icon;
                                            return hasLoadableMedia ? (
                                            isVideoFile(blog) ? (
                                                <video src={mediaUrl} className="w-full h-full object-cover" muted loop playsInline
                                                    onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()}
                                                    onError={() => markMediaBroken(mediaUrl)} />
                                            ) : isDocumentFile(blog) ? (
                                                (() => {
                                                    const fi = getFileIcon(blog); const Icon = fi.icon;
                                                    return (
                                                        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
                                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${fi.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
                                                            <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${fi.gradient} opacity-5 rounded-full translate-y-1/2 -translate-x-1/2`} />
                                                            <div className={`relative bg-white rounded-xl border-2 ${fi.borderColor} p-4 shadow-sm group-hover:shadow-lg transition-all duration-300 w-full`}>
                                                                <div className="flex justify-center mb-2">
                                                                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${fi.gradient} shadow-md`}>
                                                                        <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-center mb-2">
                                                                    <div className={`inline-flex items-center px-3 py-0.5 rounded-full ${fi.badgeBg} border ${fi.borderColor}`}>
                                                                        <span className={`text-xs font-bold ${fi.color} uppercase tracking-wider`}>{fi.name}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm font-semibold text-slate-800 text-center line-clamp-2 px-2 mb-2">{extractFileName(blog)}</p>
                                                                <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                                                                    <ExternalLink className="w-3 h-3" /><span>Click để xem</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className="relative w-full h-full">
                                                    <img src={getMediaUrl(blog)} alt={blog.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        onError={e => {
                                                            markMediaBroken(getMediaUrl(blog));
                                                            e.target.style.display = 'none';
                                                        }} />
                                                </div>
                                            )
                                        ) : mediaUrl ? (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${fi.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
                                                <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${fi.gradient} opacity-5 rounded-full translate-y-1/2 -translate-x-1/2`} />
                                                <div className={`relative bg-white rounded-xl border-2 ${fi.borderColor} p-4 shadow-sm w-full`}>
                                                    <div className="flex justify-center mb-2">
                                                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${fi.gradient} shadow-md`}>
                                                            <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-center mb-2">
                                                        <div className={`inline-flex items-center px-3 py-0.5 rounded-full ${fi.badgeBg} border ${fi.borderColor}`}>
                                                            <span className={`text-xs font-bold ${fi.color} uppercase tracking-wider`}>{fi.name}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-800 text-center line-clamp-2 px-2 mb-2">{extractFileName(blog)}</p>
                                                    <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                                                        <ExternalLink className="w-3 h-3" /><span>Mở trong chi tiết</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-100 via-primary-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-300 opacity-20 rounded-full -translate-y-1/2 translate-x-1/2" />
                                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-200 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2" />
                                                <BookOpen className="w-16 h-16 text-primary-300" strokeWidth={1.5} />
                                            </div>
                                            );
                                            })()}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="text-xs font-semibold text-primary-600 mb-2 uppercase tracking-wider">
                                            {blog.categoryName || 'Chưa phân loại'}
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                                            {blog.title}
                                        </h2>
                                        <p className="text-slate-600 line-clamp-3 mb-4 flex-1">
                                            {blog.description || truncateContent(blog.content)}
                                        </p>
                                        <div className="flex items-center justify-between text-sm text-slate-500 mb-4 pb-4 border-b border-slate-200">
                                            <div className="flex items-center space-x-2">
                                                <User className="h-4 w-4" />
                                                <span className="font-medium">{blog.authorUsername}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(blog.createdAt)}</span>
                                            </div>
                                        </div>
                                        <Link to={`/blogs/${blog.id}`}
                                            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium group-hover:gap-3 transition-all duration-200">
                                            <span>Đọc thêm</span><ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
                )}

                {/* Đang theo dõi - own profile, following tab only */}
                {isOwnProfile && activeTab === 'following' && (
                <div>
                    {followingLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
                    ) : following.length === 0 ? (
                        <div className="text-center py-14 bg-white rounded-2xl shadow-sm border border-slate-200">
                            <Users className="h-14 w-14 mx-auto mb-3 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa theo dõi ai</h3>
                            <p className="text-slate-500 text-sm">Bạn chưa theo dõi người dùng nào.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {following.map(f => {
                                const grad = getAvatarColor(f.username);
                                const fId = f.userId || f.id;
                                return (
                                    <Link key={fId} to={`/profile/${fId}`}
                                        className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-300 transition-all p-4 flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                                            {f.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">{f.username}</p>
                                            {f.followedAt && (
                                                <p className="text-xs text-slate-400 mt-0.5">Theo dõi từ {formatDate(f.followedAt)}</p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}

                {/* Nguoi theo doi - own profile, followers tab only */}
                {isOwnProfile && activeTab === 'followers' && (
                <div>
                    {followersLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
                    ) : followers.length === 0 ? (
                        <div className="text-center py-14 bg-white rounded-2xl shadow-sm border border-slate-200">
                            <Users className="h-14 w-14 mx-auto mb-3 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có người theo dõi</h3>
                            <p className="text-slate-500 text-sm">Chưa có ai theo dõi bạn.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {followers.map(follower => {
                                const grad = getAvatarColor(follower.username);
                                const fId = follower.userId || follower.id;
                                return (
                                    <Link key={fId} to={`/profile/${fId}`}
                                        className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-300 transition-all p-4 flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                                            {follower.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">{follower.username}</p>
                                            {follower.followedAt && (
                                                <p className="text-xs text-slate-400 mt-0.5">Theo dõi từ {formatDate(follower.followedAt)}</p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}

            </div>
        </div>
    );
};

export default UserProfilePage;
