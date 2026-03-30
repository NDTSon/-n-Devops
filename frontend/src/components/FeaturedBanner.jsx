import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pin, Calendar, User, ArrowRight, FileText, File, Play, Pause } from 'lucide-react';
import { blogAPI } from '../services/api';

const FeaturedBanner = () => {
    const [pinnedBlogs, setPinnedBlogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
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

    useEffect(() => {
        fetchPinnedBlogs();
    }, []);

    // Auto-rotation effect
    useEffect(() => {
        if (!isPlaying || pinnedBlogs.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % pinnedBlogs.length);
        }, 3000); // 3 giây

        return () => clearInterval(interval);
    }, [isPlaying, pinnedBlogs.length]);

    const fetchPinnedBlogs = async () => {
        try {
            const response = await blogAPI.getPinned();
            setPinnedBlogs(response.data);
        } catch (error) {
            console.error('Failed to fetch pinned blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % pinnedBlogs.length);
        setIsPlaying(false); // Dừng tự động khi user thao tác thủ công
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + pinnedBlogs.length) % pinnedBlogs.length);
        setIsPlaying(false); // Dừng tự động khi user thao tác thủ công
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const isDocumentFile = (blog) => {
        if (blog.imageMimeType) {
            return blog.imageMimeType === 'application/pdf' ||
                   blog.imageMimeType.includes('word') ||
                   blog.imageMimeType.includes('document') ||
                   blog.imageMimeType.includes('spreadsheet') ||
                   blog.imageMimeType.includes('excel') ||
                   blog.imageMimeType.includes('powerpoint') ||
                   blog.imageMimeType.includes('presentation');
        }
        const url = getMediaUrl(blog);
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.pdf') || 
               lowerUrl.endsWith('.docx') || 
               lowerUrl.endsWith('.doc') ||
               lowerUrl.endsWith('.xlsx') || 
               lowerUrl.endsWith('.xls') ||
               lowerUrl.endsWith('.ppt') ||
               lowerUrl.endsWith('.pptx');
    };

    const isVideoFile = (blog) => {
        if (blog.imageMimeType) {
            return blog.imageMimeType.startsWith('video/');
        }
        const url = getMediaUrl(blog);
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.mp4') || 
               lowerUrl.endsWith('.webm') || 
               lowerUrl.endsWith('.ogg') ||
               lowerUrl.endsWith('.mov') ||
               lowerUrl.endsWith('.avi');
    };

    const getFileIcon = (blog) => {
        if (blog.imageMimeType) {
            const mimeType = blog.imageMimeType.toLowerCase();
            if (mimeType === 'application/pdf') {
                return { 
                    icon: FileText, 
                    color: 'text-red-600', 
                    gradient: 'from-red-500 to-rose-600',
                    borderColor: 'border-red-200',
                    badgeBg: 'bg-red-100',
                    name: 'PDF'
                };
            }
            if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
                return { 
                    icon: FileText, 
                    color: 'text-green-600', 
                    gradient: 'from-green-500 to-emerald-600',
                    borderColor: 'border-green-200',
                    badgeBg: 'bg-green-100',
                    name: 'Excel'
                };
            }
            if (mimeType.includes('word') || mimeType.includes('document')) {
                return { 
                    icon: FileText, 
                    color: 'text-blue-600', 
                    gradient: 'from-blue-500 to-indigo-600',
                    borderColor: 'border-blue-200',
                    badgeBg: 'bg-blue-100',
                    name: 'Word'
                };
            }
            if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
                return { 
                    icon: FileText, 
                    color: 'text-orange-600', 
                    gradient: 'from-orange-500 to-amber-600',
                    borderColor: 'border-orange-200',
                    badgeBg: 'bg-orange-100',
                    name: 'PowerPoint'
                };
            }
        }
        const url = getMediaUrl(blog);
        const lowerUrl = url ? url.toLowerCase() : '';
        if (lowerUrl.endsWith('.pdf')) {
            return { 
                icon: FileText, 
                color: 'text-red-600', 
                gradient: 'from-red-500 to-rose-600',
                borderColor: 'border-red-200',
                badgeBg: 'bg-red-100',
                name: 'PDF' 
            };
        }
        if (lowerUrl.endsWith('.xlsx') || lowerUrl.endsWith('.xls')) {
            return { 
                icon: FileText, 
                color: 'text-green-600', 
                gradient: 'from-green-500 to-emerald-600',
                borderColor: 'border-green-200',
                badgeBg: 'bg-green-100',
                name: 'Excel' 
            };
        }
        if (lowerUrl.endsWith('.docx') || lowerUrl.endsWith('.doc')) {
            return { 
                icon: FileText, 
                color: 'text-blue-600', 
                gradient: 'from-blue-500 to-indigo-600',
                borderColor: 'border-blue-200',
                badgeBg: 'bg-blue-100',
                name: 'Word' 
            };
        }
        return { 
            icon: File, 
            color: 'text-slate-600', 
            gradient: 'from-slate-400 to-slate-600',
            borderColor: 'border-slate-200',
            badgeBg: 'bg-slate-100',
            name: 'File' 
        };
    };

    const extractFileName = (blog) => {
        if (blog.originalFileName) {
            return blog.originalFileName;
        }
        const url = getMediaUrl(blog);
        if (url && url.includes('/api/files/download/')) {
            if (blog.imageMimeType) {
                const mimeType = blog.imageMimeType.toLowerCase();
                if (mimeType === 'application/pdf') return 'Document.pdf';
                if (mimeType.includes('word')) return 'Document.docx';
                if (mimeType.includes('excel')) return 'Spreadsheet.xlsx';
                if (mimeType.includes('powerpoint')) return 'Presentation.pptx';
            }
            return 'File đính kèm';
        }
        if (!url) return 'File đính kèm';
        try {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename.includes('.')) {
                return decodeURIComponent(filename);
            }
        } catch (e) {}
        return 'File đính kèm';
    };

    if (loading) {
        return (
            <div className="w-full h-96 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl animate-pulse"></div>
        );
    }

    if (pinnedBlogs.length === 0) {
        return null; // Don't show banner if no pinned blogs
    }

    const currentBlog = pinnedBlogs[currentIndex];

    return (
        <div className="relative w-full h-[500px] mb-12 overflow-hidden rounded-2xl shadow-2xl bg-black">
            {/* Render all slides with crossfade */}
            {pinnedBlogs.map((blog, index) => (
                <div
                    key={blog.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    {(() => {
                        const mediaUrl = getMediaUrl(blog);
                        const hasLoadableMedia = mediaUrl && !brokenMediaUrls.has(mediaUrl) && shouldAutoPreviewMedia(blog, mediaUrl);
                        return hasLoadableMedia ? (
                        isVideoFile(blog) ? (
                            // Video background
                            <>
                                <video
                                    src={mediaUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    onError={() => markMediaBroken(mediaUrl)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
                            </>
                        ) : isDocumentFile(blog) ? (
                            // File attachment background with card
                            (() => {
                                const fileInfo = getFileIcon(blog);
                                const IconComponent = fileInfo.icon;
                                return (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
                                        {/* Large file card on right side */}
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-80 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 p-8 shadow-2xl">
                                            {/* Icon with gradient */}
                                            <div className="flex justify-center mb-6">
                                                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${fileInfo.gradient} shadow-xl`}>
                                                    <IconComponent className="w-12 h-12 text-white" strokeWidth={2} />
                                                </div>
                                            </div>
                                            
                                            {/* File type badge */}
                                            <div className="flex justify-center mb-4">
                                                <div className={`inline-flex items-center px-4 py-2 rounded-full ${fileInfo.badgeBg} border-2 ${fileInfo.borderColor}`}>
                                                    <span className={`text-sm font-bold ${fileInfo.color} uppercase tracking-wider`}>{fileInfo.name}</span>
                                                </div>
                                            </div>
                                            
                                            {/* File name */}
                                            <p className="text-base font-semibold text-white text-center line-clamp-2 px-2">
                                                {extractFileName(blog)}
                                            </p>
                                        </div>
                                        
                                        {/* Dark gradient overlay for text readability */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                                    </div>
                                );
                            })()
                        ) : (
                            // Regular image background
                            <>
                                <img
                                    src={mediaUrl}
                                    alt={blog.title}
                                    className="w-full h-full object-cover"
                                    onError={() => markMediaBroken(mediaUrl)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
                            </>
                        )
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800"></div>
                    );
                    })()}
                </div>
            ))}

            {/* Content overlay */}
            <div className="relative h-full flex items-center px-8 lg:px-16 z-20">
                <div className="max-w-3xl text-white space-y-6">
                    {/* Pin badge */}
                    <div 
                        key={`badge-${currentIndex}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/90 backdrop-blur-sm rounded-full text-sm font-semibold animate-fadeIn"
                    >
                        <Pin className="w-4 h-4 fill-current" />
                        <span>Bài viết nổi bật</span>
                    </div>

                    {/* Title */}
                    <h1 
                        key={`title-${currentIndex}`}
                        className="text-4xl lg:text-6xl font-bold leading-tight animate-fadeIn"
                    >
                        {pinnedBlogs[currentIndex].title}
                    </h1>

                    {/* Description */}
                    {pinnedBlogs[currentIndex].description && (
                        <p 
                            key={`desc-${currentIndex}`}
                            className="text-lg lg:text-xl text-white/90 leading-relaxed line-clamp-3 animate-fadeIn"
                        >
                            {pinnedBlogs[currentIndex].description}
                        </p>
                    )}

                    {/* Meta info */}
                    <div 
                        key={`meta-${currentIndex}`}
                        className="flex items-center gap-6 text-white/80 text-sm animate-fadeIn"
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{pinnedBlogs[currentIndex].authorUsername}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(pinnedBlogs[currentIndex].createdAt)}</span>
                        </div>
                    </div>

                    {/* Read More Button */}
                    <Link
                        key={`button-${currentIndex}`}
                        to={`/blogs/${pinnedBlogs[currentIndex].id}`}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 animate-fadeIn"
                    >
                        <span>Đọc ngay</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Navigation arrows (only if multiple blogs) */}
            {pinnedBlogs.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all duration-200 group z-30"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all duration-200 group z-30"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Play/Pause button */}
                    <button
                        onClick={togglePlayPause}
                        className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all duration-200 group z-30"
                        aria-label={isPlaying ? 'Pause auto-rotation' : 'Play auto-rotation'}
                        title={isPlaying ? 'Dừng tự động chuyển' : 'Bật tự động chuyển'}
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                        ) : (
                            <Play className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                        )}
                    </button>

                    {/* Dots indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                        {pinnedBlogs.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setIsPlaying(false); // Dừng tự động khi user chọn slide thủ công
                                }}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'w-8 bg-white'
                                        : 'w-2 bg-white/50 hover:bg-white/70'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default FeaturedBanner;
