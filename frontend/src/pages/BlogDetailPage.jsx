import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, ArrowLeft, Edit, Trash2, FileText, Download, ExternalLink, File } from 'lucide-react';
import CommentSection from '../components/CommentSection';
import { usePermission } from '../hooks/usePermission';

const BlogDetailPage = () => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const { isAdmin, user } = useAuth();
    const { can } = usePermission();
    const navigate = useNavigate();

    const isImageFile = (blog) => {
        // Check by mimeType if available
        if (blog.imageMimeType) {
            return blog.imageMimeType.startsWith('image/');
        }
        // Fallback to checking URL extension
        const url = blog.imageUrl;
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.jpg') || 
               lowerUrl.endsWith('.jpeg') || 
               lowerUrl.endsWith('.png') ||
               lowerUrl.endsWith('.gif') ||
               lowerUrl.endsWith('.webp') ||
               lowerUrl.endsWith('.svg') ||
               lowerUrl.endsWith('.bmp');
    };

    const isVideoFile = (blog) => {
        // Check by mimeType if available
        if (blog.imageMimeType) {
            return blog.imageMimeType.startsWith('video/');
        }
        // Fallback to checking URL extension
        const url = blog.imageUrl;
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
        const url = blog.imageUrl;
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
        const url = blog.imageUrl;
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
        const url = blog.imageUrl;
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

    useEffect(() => {
        fetchBlog();
    }, [id]);

    const fetchBlog = async () => {
        try {
            const response = await api.get(`/blogs/${id}`);
            setBlog(response.data);
        } catch (error) {
            console.error('Failed to fetch blog:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this blog?')) {
            return;
        }

        setDeleting(true);
        try {
            await api.delete(`/blogs/${id}`);
            navigate('/');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete blog');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
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

    if (!blog) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Blog not found</h2>
                    <Link to="/" className="btn-primary">
                        Back to Blogs
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Navigation */}
                <Link
                    to="/"
                    className="inline-flex items-center space-x-2 text-slate-600 hover:text-primary-600 mb-8 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back to all blogs</span>
                </Link>

                {/* Blog Content */}
                <article className="card">
                    {/* Banner Image or File Attachment */}
                    {blog.imageUrl && (
                        <div className="mb-8">
                            {isVideoFile(blog) ? (
                                // Video file - Display video player
                                <div className="rounded-xl overflow-hidden shadow-md">
                                    <video
                                        src={blog.imageUrl}
                                        controls
                                        className="w-full max-h-[600px]"
                                        onError={(e) => {
                                            // If video fails to load, hide it
                                            e.target.style.display = 'none';
                                        }}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            ) : isDocumentFile(blog) ? (
                                // Document files (PDF, DOCX, XLSX) - Enhanced card
                                (() => {
                                    const fileInfo = getFileIcon(blog);
                                    const IconComponent = fileInfo.icon;
                                    return (
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden shadow-md border-2 border-slate-200">
                                            {/* Header with gradient */}
                                            <div className={`bg-gradient-to-r ${fileInfo.gradient} p-4`}>
                                                <p className="text-white font-semibold text-center">File đính kèm</p>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="p-8">
                                                <div className="flex items-center justify-center gap-6 flex-wrap">
                                                    {/* Icon with gradient background */}
                                                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${fileInfo.gradient} shadow-lg`}>
                                                        <IconComponent className="w-10 h-10 text-white" strokeWidth={2} />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-[200px] text-center sm:text-left">
                                                        {/* File type badge */}
                                                        <div className="mb-3">
                                                            <div className={`inline-flex items-center px-3 py-1 rounded-full ${fileInfo.badgeBg} border-2 ${fileInfo.borderColor}`}>
                                                                <span className={`text-xs font-bold ${fileInfo.color} uppercase tracking-wider`}>{fileInfo.name}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* File name */}
                                                        <p className="text-lg font-semibold text-slate-800 mb-4">
                                                            {extractFileName(blog)}
                                                        </p>
                                                        
                                                        {/* Download/View button */}
                                                        <a
                                                            href={blog.imageUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${fileInfo.gradient} text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium`}
                                                        >
                                                            <Download className="w-5 h-5" />
                                                            Tải xuống / Xem file
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                // Image file - Display directly
                                <div className="rounded-xl overflow-hidden shadow-md">
                                    <img
                                        src={blog.imageUrl}
                                        alt={blog.title}
                                        className="w-full max-h-[600px] object-cover"
                                        onError={(e) => {
                                            // If image fails to load, hide it
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Header */}
                    <header className="mb-8">
                        <div className="text-xs font-semibold text-primary-600 mb-2 uppercase tracking-wider">
                            {blog.name} ({blog.code})
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 leading-tight">
                            {blog.title}
                        </h1>
                        {blog.description && (
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                {blog.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-slate-200">
                            <div className="flex items-center space-x-6 text-slate-600">
                                <div className="flex items-center space-x-2">
                                    <User className="h-5 w-5" />
                                    <span className="font-medium">{blog.authorUsername}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-5 w-5" />
                                    <span>{formatDate(blog.createdAt)}</span>
                                </div>
                            </div>

                            {blog.authorId && can.updateBlog(blog.authorId) && (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        to={`/admin/edit/${blog.id}`}
                                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span>Edit</span>
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Content */}
                    <div className="prose prose-lg max-w-none">
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {blog.content}
                        </div>
                    </div>

                    {/* Footer */}
                    {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                        <footer className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
                            Last updated: {formatDate(blog.updatedAt)}
                        </footer>
                    )}

                    {/* Comments */}
                    <CommentSection blogId={blog.id} />
                </article>
            </div>
        </div>
    );
};

export default BlogDetailPage;
