import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { blogAPI, categoryAPI } from '../services/api';
import { Save, X, AlertCircle, Image as ImageIcon, FileText, Eye } from 'lucide-react';

const BlogForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        categoryId: '',
        name: '',
        title: '',
        content: '',
        description: '',
        imageUrl: '',
        imageFileId: null,
        imageMimeType: '',
        originalFileName: '',
        status: true,
    });
    const [categories, setCategories] = useState([]);
    const [uploadedFile, setUploadedFile] = useState(null); // Track uploaded file info
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const isEditMode = !!id;

    useEffect(() => {
        fetchCategories();
        if (isEditMode) {
            fetchBlog();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getActiveCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setError('Không thể tải danh sách thể loại');
        }
    };

    const fetchBlog = async () => {
        try {
            const response = await blogAPI.getById(id);
            setFormData({
                categoryId: response.data.categoryId || '',
                name: response.data.name || '',
                title: response.data.title || '',
                content: response.data.content || '',
                description: response.data.description || '',
                imageUrl: response.data.imageUrl || '',
                imageFileId: response.data.imageFileId || null,
                imageMimeType: response.data.imageMimeType || '',
                originalFileName: response.data.originalFileName || '',
                status: response.data.status !== undefined ? response.data.status : true,
            });
            
            // Set uploadedFile if there's an existing file
            if (response.data.imageUrl) {
                setUploadedFile({
                    name: response.data.originalFileName || 'Existing file',
                    type: response.data.imageMimeType || 'application/octet-stream',
                    url: response.data.imageUrl,
                    size: 0, // Size not available for existing files,
                });
            }
        } catch (error) {
            setError('Failed to load blog');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            setLoading(true);
            const response = await blogAPI.uploadFile(uploadData);
            setFormData(prev => ({
                ...prev,
                imageUrl: response.data.url,
                imageFileId: response.data.fileId || null,
                imageMimeType: response.data.contentType || file.type,
                originalFileName: response.data.originalFileName || file.name,
            }));
            // Store file info for display
            setUploadedFile({
                name: response.data.originalFileName || file.name,
                type: response.data.contentType || file.type,
                url: response.data.url,
                size: response.data.fileSize || file.size,
            });
        } catch (error) {
            console.error(error);
            setError('Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEditMode) {
                await blogAPI.update(id, formData);
            } else {
                await blogAPI.create(formData);
            }
            navigate('/admin');
        } catch (error) {
            setError(error.response?.data?.error || error.response?.data?.message || 'Failed to save blog');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="card">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-800">
                            {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
                        </h1>
                        <p className="text-slate-600 mt-2">
                            {isEditMode ? 'Update your blog post' : 'Share your thoughts with the community'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* File Upload Section */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Ảnh đại diện, Video hoặc File đính kèm
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Hỗ trợ: Ảnh (JPG, PNG, GIF...), Video (MP4, WebM...), PDF, Word, Excel, Text
                            </p>
                            <input
                                type="file"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-primary-50 file:text-primary-700
                                  hover:file:bg-primary-100"
                                disabled={loading}
                            />
                            {formData.imageUrl && uploadedFile && (
                                <div className="mt-4 relative group">
                                    {uploadedFile.type?.startsWith('image/') ? (
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="h-64 w-full object-cover rounded-lg shadow-sm"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                console.error('Failed to load image:', formData.imageUrl);
                                            }}
                                        />
                                    ) : uploadedFile.type?.startsWith('video/') ? (
                                        <video
                                            src={formData.imageUrl}
                                            controls
                                            className="h-64 w-full rounded-lg shadow-sm"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                console.error('Failed to load video:', formData.imageUrl);
                                            }}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-300">
                                            <FileText className={`w-8 h-8 ${(() => {
                                                const type = uploadedFile.type?.toLowerCase() || '';
                                                if (type.includes('pdf')) return 'text-red-500';
                                                if (type.includes('excel') || type.includes('spreadsheet')) return 'text-green-500';
                                                if (type.includes('word') || type.includes('document')) return 'text-blue-500';
                                                if (type.includes('powerpoint') || type.includes('presentation')) return 'text-orange-500';
                                                return 'text-slate-500';
                                            })()}`} />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800">{uploadedFile.name}</p>
                                                <p className="text-sm text-slate-500">
                                                    {(() => {
                                                        const type = uploadedFile.type?.toLowerCase() || '';
                                                        if (type.includes('pdf')) return 'PDF';
                                                        if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
                                                        if (type.includes('word') || type.includes('document')) return 'Word';
                                                        if (type.includes('powerpoint') || type.includes('presentation')) return 'PowerPoint';
                                                        return uploadedFile.type || 'File';
                                                    })()}
                                                    {uploadedFile.size > 0 && ` • ${(uploadedFile.size / 1024).toFixed(2)} KB`}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const fileType = uploadedFile.type?.toLowerCase() || '';
                                                    if (fileType.includes('pdf') || fileType.startsWith('text/') || fileType.startsWith('image/')) {
                                                        setShowPdfViewer(true);
                                                    } else {
                                                        window.open(formData.imageUrl, '_blank');
                                                    }
                                                }}
                                                className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm flex items-center gap-1"
                                            >
                                                <Eye className="w-3 h-3" />
                                                Xem
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                imageUrl: '',
                                                imageFileId: null,
                                                imageMimeType: '',
                                                originalFileName: '',
                                            });
                                            setUploadedFile(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa file"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Thể loại *
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="input-field"
                                required
                            >
                                <option value="">-- Chọn thể loại --</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {categories.length === 0 && (
                                <p className="mt-1 text-sm text-amber-600">
                                    Chưa có thể loại. Vui lòng liên hệ admin để thêm thể loại.
                                </p>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tên blog *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Nhập tên blog (tối đa 200 ký tự)"
                                required
                                maxLength={200}
                            />
                            <p className="mt-1 text-sm text-slate-500">
                                {formData.name.length}/200 ký tự
                            </p>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tiêu đề *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Nhập tiêu đề blog (tối đa 500 ký tự)"
                                required
                                maxLength={500}
                            />
                            <p className="mt-1 text-sm text-slate-500">
                                {formData.title.length}/500 ký tự
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Mô tả ngắn
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="input-field min-h-[100px] resize-y"
                                placeholder="Mô tả ngắn gọn về nội dung blog..."
                                maxLength={500}
                            />
                            <p className="mt-1 text-sm text-slate-500">
                                {formData.description.length}/500 ký tự
                            </p>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nội dung *
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className="input-field min-h-[400px] resize-y"
                                placeholder="Viết nội dung blog của bạn tại đây..."
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="status"
                                name="status"
                                checked={formData.status}
                                onChange={handleChange}
                                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <label htmlFor="status" className="text-sm font-medium text-slate-700 cursor-pointer">
                                Trạng thái hoạt động (bỏ tick để ẩn blog)
                            </label>
                        </div>

                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => navigate('/admin')}
                                className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                                <X className="h-5 w-5" />
                                <span>Cancel</span>
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                            >
                                <Save className="h-5 w-5" />
                                <span>{loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Xuất bản'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* File Viewer Modal */}
            {showPdfViewer && formData.imageUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {uploadedFile?.name || 'Xem file'}
                            </h3>
                            <button
                                onClick={() => setShowPdfViewer(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                title="Đóng"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        
                        {/* File Viewer */}
                        <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-50">
                            {uploadedFile?.type?.startsWith('image/') ? (
                                <img
                                    src={formData.imageUrl}
                                    alt={uploadedFile?.name || 'File preview'}
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.innerHTML = '<div class="text-red-500">Không thể tải ảnh</div>';
                                    }}
                                />
                            ) : uploadedFile?.type?.startsWith('text/') ? (
                                <iframe
                                    src={formData.imageUrl}
                                    className="w-full h-full border-0 bg-white"
                                    title="Text Viewer"
                                />
                            ) : (
                                <iframe
                                    src={formData.imageUrl}
                                    className="w-full h-full border-0"
                                    title="PDF Viewer"
                                />
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                            <a
                                href={formData.imageUrl}
                                download
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                Tải xuống
                            </a>
                            <a
                                href={formData.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                            >
                                Mở tab mới
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogForm;
