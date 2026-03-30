import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogAPI, followAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, ArrowRight, BookOpen, FileText, File, ExternalLink, Users } from 'lucide-react';
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
    let h = 0; for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const FollowingFeedPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [brokenMediaUrls, setBrokenMediaUrls] = useState(new Set());
    const { user } = useAuth();
    const navigate = useNavigate();

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

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchFollowingFeed();
        fetchFollowing();
    }, [user, navigate]);

    const fetchFollowing = async () => {
        try {
            const res = await followAPI.getFollowing(user.id);
            setFollowing(res.data || []);
        } catch {/* ignore */}
    };

    const fetchFollowingFeed = async () => {
        try {
            const response = await blogAPI.getFollowingFeed();
            setBlogs(response.data || []);
        } catch (error) {
            console.error('Failed to fetch following feed:', error);
            if (error.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const truncateContent = (content, maxLength = 150) => {
        if (!content || content.length <= maxLength) return content || '';
        return content.substring(0, maxLength) + '...';
    };

    const isVideoFile = (blog) => {
        if (blog.imageMimeType) return blog.imageMimeType.startsWith('video/');
        const url = getMediaUrl(blog); if (!url) return false;
        const u = url.toLowerCase();
        return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.ogg') || u.endsWith('.mov') || u.endsWith('.avi');
    };

    const isDocumentFile = (blog) => {
        if (blog.imageMimeType) {
            const m = blog.imageMimeType;
            return m === 'application/pdf' || m.includes('word') || m.includes('document') ||
                   m.includes('spreadsheet') || m.includes('excel') || m.includes('powerpoint') || m.includes('presentation');
        }
        const url = getMediaUrl(blog); if (!url) return false;
        const u = url.toLowerCase();
        return u.endsWith('.pdf') || u.endsWith('.docx') || u.endsWith('.doc') ||
               u.endsWith('.xlsx') || u.endsWith('.xls') || u.endsWith('.ppt') || u.endsWith('.pptx');
    };

    const getFileIcon = (blog) => {
        const m = blog.imageMimeType?.toLowerCase() || '';
        const url = getMediaUrl(blog).toLowerCase();
        if (m === 'application/pdf' || url.endsWith('.pdf'))
            return { icon: FileText, color: 'text-red-600', gradient: 'from-red-500 to-rose-600', borderColor: 'border-red-200', badgeBg: 'bg-red-100', name: 'PDF' };
        if (m.includes('excel') || m.includes('spreadsheet') || url.endsWith('.xlsx') || url.endsWith('.xls'))
            return { icon: FileText, color: 'text-green-600', gradient: 'from-green-500 to-emerald-600', borderColor: 'border-green-200', badgeBg: 'bg-green-100', name: 'Excel' };
        if (m.includes('word') || m.includes('document') || url.endsWith('.docx') || url.endsWith('.doc'))
            return { icon: FileText, color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600', borderColor: 'border-blue-200', badgeBg: 'bg-blue-100', name: 'Word' };
        if (m.includes('powerpoint') || m.includes('presentation') || url.endsWith('.ppt') || url.endsWith('.pptx'))
            return { icon: FileText, color: 'text-orange-600', gradient: 'from-orange-500 to-amber-600', borderColor: 'border-orange-200', badgeBg: 'bg-orange-100', name: 'PowerPoint' };
        return { icon: File, color: 'text-slate-600', gradient: 'from-slate-400 to-slate-600', borderColor: 'border-slate-200', badgeBg: 'bg-slate-100', name: 'File' };
    };

    const extractFileName = (blog) => {
        if (blog.originalFileName) return blog.originalFileName;
        const url = getMediaUrl(blog);
        if (url && url.includes('/api/files/download/')) {
            const m = blog.imageMimeType?.toLowerCase() || '';
            if (m === 'application/pdf') return 'Document.pdf';
            if (m.includes('word') || m.includes('document')) return 'Document.docx';
            if (m.includes('excel') || m.includes('spreadsheet')) return 'Spreadsheet.xlsx';
            if (m.includes('powerpoint') || m.includes('presentation')) return 'Presentation.pptx';
            return 'File đính kèm';
        }
        if (!url) return 'File đính kèm';
        try {
            const parts = url.split('/'); const fn = parts[parts.length - 1];
            return fn.includes('.') ? decodeURIComponent(fn) : 'File đính kèm';
        } catch { return 'File đính kèm'; }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner variant="orbit" size="lg" label="Đang tải feed..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <Users className="h-7 w-7 text-primary-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Bài viết từ người bạn theo dõi</h1>
                        <p className="text-slate-500 text-sm">{blogs.length} bài viết</p>
                    </div>
                </div>

                {/* Horizontal Following Users Row */}
                {following.length > 0 && (
                    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Kênh đăng ký</p>
                        <div className="flex gap-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                            {following.map(f => {
                                const fId = f.userId || f.id;
                                const grad = getAvatarColor(f.username);
                                return (
                                    <Link
                                        key={fId}
                                        to={`/profile/${fId}`}
                                        className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                                    >
                                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-bold shadow-sm group-hover:shadow-md transition-shadow ring-2 ring-white group-hover:ring-primary-200`}>
                                            {f.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium text-center max-w-[60px] truncate group-hover:text-primary-600 transition-colors">{f.username}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="h-24 w-24 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold text-slate-700 mb-2">Chưa có bài viết nào</h3>
                        <p className="text-slate-600 mb-6">Theo dõi thêm người dùng để xem bài viết của họ tại đây.</p>
                        <Link to="/users" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                            <Users className="h-4 w-4" />
                            Khám phá thành viên
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog, index) => (
                            <article
                                key={blog.id}
                                className="card group hover:scale-105 transition-transform duration-300 flex flex-col h-full"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Image / File */}
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
                                        ) : isDocumentFile(blog) ? (() => {
                                            const fi = getFileIcon(blog); const Icon = fi.icon;
                                            return (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
                                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${fi.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
                                                    <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${fi.gradient} opacity-5 rounded-full translate-y-1/2 -translate-x-1/2`} />
                                                    <div className={`relative bg-white rounded-xl border-2 ${fi.borderColor} p-5 shadow-sm group-hover:shadow-lg transition-all w-full`}>
                                                        <div className="flex justify-center mb-3">
                                                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${fi.gradient} shadow-md`}>
                                                                <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-center mb-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${fi.color} ${fi.badgeBg} border ${fi.borderColor} uppercase tracking-wider`}>{fi.name}</span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-800 text-center line-clamp-2 px-2 mb-3">{extractFileName(blog)}</p>
                                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                            <ExternalLink className="w-3 h-3" /><span>Click để xem</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div className="relative w-full h-full">
                                                <img src={mediaUrl} alt={blog.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={e => {
                                                        markMediaBroken(mediaUrl);
                                                        const p = e.target.parentElement; e.target.style.display = 'none';
                                                        if (!p.querySelector('.file-fallback')) {
                                                            const d = document.createElement('div');
                                                            d.className = 'file-fallback w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6';
                                                            d.innerHTML = `<svg class="w-16 h-16 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><div class="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-300 mb-2"><span class="text-xs font-bold text-slate-600">File</span></div><p class="text-sm font-medium text-slate-600 text-center">File đính kèm</p><p class="text-xs text-slate-500 mt-2">Click để xem chi tiết</p>`;
                                                            p.appendChild(d);
                                                        }
                                                    }} />
                                            </div>
                                        )
                                    ) : mediaUrl ? (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${fi.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
                                            <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${fi.gradient} opacity-5 rounded-full translate-y-1/2 -translate-x-1/2`} />
                                            <div className={`relative bg-white rounded-xl border-2 ${fi.borderColor} p-5 shadow-sm w-full`}>
                                                <div className="flex justify-center mb-3">
                                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${fi.gradient} shadow-md`}>
                                                        <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                                                    </div>
                                                </div>
                                                <div className="flex justify-center mb-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${fi.color} ${fi.badgeBg} border ${fi.borderColor} uppercase tracking-wider`}>{fi.name}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800 text-center line-clamp-2 px-2 mb-3">{extractFileName(blog)}</p>
                                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
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

                                {/* Content */}
                                <div className="flex-1 flex flex-col">
                                    <div className="text-xs font-semibold text-primary-600 mb-2 uppercase tracking-wider">
                                        {blog.categoryName || 'Chưa phân loại'}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
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
                                        <span>Read More</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FollowingFeedPage;
