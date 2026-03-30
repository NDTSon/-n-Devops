import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI, categoryAPI } from '../services/api';
import { Calendar, User, ArrowRight, BookOpen, FileText, File, Download, ExternalLink, ChevronDown, Filter, Search, X } from 'lucide-react';
import FeaturedBanner from '../components/FeaturedBanner';

const BlogListPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [brokenMediaUrls, setBrokenMediaUrls] = useState(new Set());
    const dropdownRef = useRef(null);

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

        // Keep inline preview for image/video attachments served by file-service.
        const mimeType = (blog.imageMimeType || '').toLowerCase();
        if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) return true;

        const fileName = (blog.originalFileName || '').toLowerCase();
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|webm|ogg|mov|avi|mkv)$/.test(fileName);
    };

    useEffect(() => {
        fetchBlogs();
        fetchCategories();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getAll();
            setBlogs(response.data);
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
            const response = await categoryAPI.getActiveCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const truncateContent = (content, maxLength = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const isVideoFile = (blog) => {
        // Check by mimeType if available
        if (blog.imageMimeType) {
            return blog.imageMimeType.startsWith('video/');
        }
        // Fallback to checking URL extension
        const url = getMediaUrl(blog);
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.mp4') || 
               lowerUrl.endsWith('.webm') || 
               lowerUrl.endsWith('.ogg') ||
               lowerUrl.endsWith('.mov') ||
               lowerUrl.endsWith('.avi');
    };

    const isDocumentFile = (blog) => {
        // Check by mimeType if available
        if (blog.imageMimeType) {
            return blog.imageMimeType === 'application/pdf' ||
                   blog.imageMimeType.includes('word') ||
                   blog.imageMimeType.includes('document') ||
                   blog.imageMimeType.includes('spreadsheet') ||
                   blog.imageMimeType.includes('excel') ||
                   blog.imageMimeType.includes('powerpoint') ||
                   blog.imageMimeType.includes('presentation');
        }
        // Fallback to checking URL extension
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

    const getFileIcon = (blog) => {
        // Check by mimeType first if available
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
            // Check Excel BEFORE Word (because Excel mimetype contains 'document')
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
        // Fallback to URL extension check
        const url = getMediaUrl(blog);
        if (!url) return { 
            icon: File, 
            color: 'text-slate-600', 
            gradient: 'from-slate-400 to-slate-600',
            borderColor: 'border-slate-200',
            badgeBg: 'bg-slate-100',
            name: 'File' 
        };
        const lowerUrl = url.toLowerCase();
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
        // Check Excel extensions before Word
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
        // Use originalFileName from blog data if available
        if (blog.originalFileName) {
            return blog.originalFileName;
        }
        
        // If URL is from file service API (/api/files/download/{id}), generate name based on mimeType
        const url = getMediaUrl(blog);
        if (url && url.includes('/api/files/download/')) {
            if (blog.imageMimeType) {
                const mimeType = blog.imageMimeType.toLowerCase();
                if (mimeType === 'application/pdf') {
                    return 'Document.pdf';
                }
                if (mimeType.includes('word') || mimeType.includes('document')) {
                    return 'Document.docx';
                }
                if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
                    return 'Spreadsheet.xlsx';
                }
                if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
                    return 'Presentation.pptx';
                }
            }
            return 'File đính kèm';
        }
        
        // For other URLs, try to extract filename
        if (!url) return 'File đính kèm';
        try {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            // Only decode if it looks like a real filename (has extension)
            if (filename.includes('.')) {
                return decodeURIComponent(filename);
            }
            return 'File đính kèm';
        } catch (e) {
            return 'File đính kèm';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Skeleton FeaturedBanner */}
                    <div className="skeleton h-64 w-full mb-10 rounded-2xl" />

                    {/* Skeleton header */}
                    <div className="mb-8">
                        <div className="skeleton h-8 w-48 mb-2" />
                        <div className="skeleton h-4 w-72" />
                    </div>

                    {/* Skeleton grid — 6 cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-3">
                                <div className="skeleton h-48 w-full rounded-lg mb-2" />
                                <div className="skeleton h-3 w-20" />
                                <div className="skeleton h-6 w-full" />
                                <div className="skeleton h-4 w-full" />
                                <div className="skeleton h-4 w-4/5" />
                                <div className="flex justify-between mt-2">
                                    <div className="skeleton h-3 w-24" />
                                    <div className="skeleton h-3 w-24" />
                                </div>
                                <div className="skeleton h-4 w-24 mt-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Filter blogs by search query and category (client-side)
    const filteredBlogs = blogs.filter(blog => {
        // Filter by search query
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesName = blog.name?.toLowerCase().includes(query);
            const matchesTitle = blog.title?.toLowerCase().includes(query);
            const matchesContent = blog.content?.toLowerCase().includes(query);
            const matchesAuthor = blog.authorUsername?.toLowerCase().includes(query.replace('@', ''));
            
            if (!matchesName && !matchesTitle && !matchesContent && !matchesAuthor) {
                return false;
            }
        }
        
        // Filter by category
        if (selectedCategory && blog.categoryId !== selectedCategory) {
            return false;
        }
        
        return true;
    });

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Featured Banner */}
                <FeaturedBanner />

                {/* Section Header with Search and Filter */}
                <div className="mb-8">
                    <div className="flex flex-col gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">
                                Tất cả bài viết
                            </h2>
                            <p className="text-slate-600">
                                Khám phá các bài viết mới nhất từ cộng đồng
                            </p>
                        </div>
                        
                        {/* Search and Filter Row */}
                        <div className="flex flex-col md:flex-row gap-3">
                            {/* Search Bar */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm theo tên, tiêu đề, nội dung hoặc @username..."
                                        className="w-full pl-12 pr-10 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                            
                            {/* Category Filter Dropdown */}
                            {categories.length > 0 && (
                                <div className="relative md:w-auto" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-slate-700 font-medium hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md group"
                                >
                                    <Filter className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                                    <span className="text-sm">
                                        {selectedCategory 
                                            ? categories.find(c => c.id === selectedCategory)?.name 
                                            : 'Tất cả thể loại'
                                        }
                                    </span>
                                    <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full group-hover:bg-blue-100 group-hover:text-blue-700">
                                        {selectedCategory 
                                            ? blogs.filter(blog => blog.categoryId === selectedCategory).length
                                            : blogs.length
                                        }
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform group-hover:text-blue-600 ${
                                        showDropdown ? 'rotate-180' : ''
                                    }`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                                        <div className="py-2 max-h-80 overflow-y-auto">
                                            {/* All Categories Option */}
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory('');
                                                    setShowDropdown(false);
                                                }}
                                                className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                                    selectedCategory === '' ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <span className={`text-sm font-medium ${
                                                    selectedCategory === '' ? 'text-blue-600' : 'text-slate-700'
                                                }`}>
                                                    Tất cả thể loại
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                    selectedCategory === '' 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {blogs.length}
                                                </span>
                                            </button>

                                            {/* Divider */}
                                            <div className="h-px bg-slate-200 my-1"></div>

                                            {/* Category Options */}
                                            {categories.map((category) => {
                                                const count = blogs.filter(blog => blog.categoryId === category.id).length;
                                                return (
                                                    <button
                                                        key={category.id}
                                                        onClick={() => {
                                                            setSelectedCategory(category.id);
                                                            setShowDropdown(false);
                                                        }}
                                                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                                            selectedCategory === category.id ? 'bg-blue-50' : ''
                                                        }`}
                                                    >
                                                        <span className={`text-sm font-medium truncate mr-2 ${
                                                            selectedCategory === category.id ? 'text-blue-600' : 'text-slate-700'
                                                        }`}>
                                                            {category.name}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                                                            selectedCategory === category.id 
                                                                ? 'bg-blue-600 text-white' 
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                </div>

                {/* Blog Grid */}
                {filteredBlogs.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen className="h-24 w-24 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold text-slate-700 mb-2">No blogs yet</h3>
                        <p className="text-slate-600">Check back later for new content!</p>
                    </div>
                ) : (
                    <div key={`${searchQuery}-${blogs.length}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
                        {filteredBlogs.map((blog, index) => (
                            <article
                                key={blog.id}
                                className="card group hover:scale-105 transition-transform duration-300 flex flex-col h-full animate-fadeInUp"
                                style={{ animationDelay: `${Math.min(index, 5) * 0.07}s` }}
                            >
                                {/* Image/File section - Always render with fixed height */}
                                <div className="mb-4 h-48 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    {(() => {
                                        const mediaUrl = getMediaUrl(blog);
                                        const hasLoadableMedia = mediaUrl && !brokenMediaUrls.has(mediaUrl) && shouldAutoPreviewMedia(blog, mediaUrl);
                                        const fileInfo = getFileIcon(blog);
                                        const IconComponent = fileInfo.icon;
                                        return hasLoadableMedia ? (
                                        isVideoFile(blog) ? (
                                            // Video file - Display video player
                                            <video
                                                src={mediaUrl}
                                                className="w-full h-full object-cover"
                                                muted
                                                loop
                                                playsInline
                                                onMouseEnter={(e) => e.target.play()}
                                                onMouseLeave={(e) => e.target.pause()}
                                                onError={() => markMediaBroken(mediaUrl)}
                                            />
                                        ) : isDocumentFile(blog) ? (
                                            // Document files (PDF, DOCX, XLSX) - Enhanced Design
                                            (() => {
                                                const fileInfo = getFileIcon(blog);
                                                const IconComponent = fileInfo.icon;
                                                return (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
                                                        {/* Decorative background circles */}
                                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${fileInfo.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                                                        <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${fileInfo.gradient} opacity-5 rounded-full translate-y-1/2 -translate-x-1/2`}></div>
                                                        
                                                        {/* Main content card */}
                                                        <div className={`relative bg-white rounded-xl border-2 ${fileInfo.borderColor} p-5 shadow-sm group-hover:shadow-lg transition-all duration-300 w-full`}>
                                                            {/* Icon with gradient background */}
                                                            <div className="flex justify-center mb-3">
                                                                <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${fileInfo.gradient} shadow-md`}>
                                                                    <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* File type badge */}
                                                            <div className="flex justify-center mb-3">
                                                                <div className={`inline-flex items-center px-3 py-1 rounded-full ${fileInfo.badgeBg} border ${fileInfo.borderColor}`}>
                                                                    <span className={`text-xs font-bold ${fileInfo.color} uppercase tracking-wider`}>{fileInfo.name}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* File name */}
                                                            <p className="text-sm font-semibold text-slate-800 text-center line-clamp-2 px-2 mb-3">
                                                                {extractFileName(blog)}
                                                            </p>
                                                            
                                                            {/* Action hint with icon */}
                                                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                                <ExternalLink className="w-3 h-3" />
                                                                <span>Click để xem</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            // Try to load as image, fallback to file icon if error
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={mediaUrl}
                                                    alt={blog.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        markMediaBroken(mediaUrl);
                                                        // If image fails to load, show file icon
                                                        const parent = e.target.parentElement;
                                                        e.target.style.display = 'none';
                                                        if (!parent.querySelector('.file-fallback')) {
                                                            const fileIcon = document.createElement('div');
                                                            fileIcon.className = 'file-fallback w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6';
                                                            fileIcon.innerHTML = `
                                                                <svg class="w-16 h-16 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                                                </svg>
                                                                <div class="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-300 mb-2">
                                                                    <span class="text-xs font-bold text-slate-600">File</span>
                                                                </div>
                                                                <p class="text-sm font-medium text-slate-600 text-center">File đính kèm</p>
                                                                <p class="text-xs text-slate-500 mt-2">Click để xem chi tiết</p>
                                                            `;
                                                            parent.appendChild(fileIcon);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )
                                    ) : mediaUrl ? (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${fileInfo.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                                            <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${fileInfo.gradient} opacity-5 rounded-full translate-y-1/2 -translate-x-1/2`}></div>
                                            <div className={`relative bg-white rounded-xl border-2 ${fileInfo.borderColor} p-5 shadow-sm w-full`}>
                                                <div className="flex justify-center mb-3">
                                                    <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${fileInfo.gradient} shadow-md`}>
                                                        <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
                                                    </div>
                                                </div>
                                                <div className="flex justify-center mb-3">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full ${fileInfo.badgeBg} border ${fileInfo.borderColor}`}>
                                                        <span className={`text-xs font-bold ${fileInfo.color} uppercase tracking-wider`}>{fileInfo.name}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800 text-center line-clamp-2 px-2 mb-3">
                                                    {extractFileName(blog)}
                                                </p>
                                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>Mở trong chi tiết</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // No image/file - Show gradient placeholder
                                        <div className="w-full h-full bg-gradient-to-br from-primary-100 via-primary-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
                                            {/* Decorative circles */}
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-300 opacity-20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-200 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                                            
                                            {/* Icon */}
                                            <BookOpen className="w-16 h-16 text-primary-300" strokeWidth={1.5} />
                                        </div>
                                    );
                                    })()}
                                </div>

                                {/* Content section */}
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

                                    <Link
                                        to={`/blogs/${blog.id}`}
                                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium group-hover:gap-3 transition-all duration-200"
                                    >
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

export default BlogListPage;
