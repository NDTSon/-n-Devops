import React from 'react';
import { X, AlertTriangle, Trash2, Shield } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-scaleIn overflow-hidden">
                {/* Header with gradient and glow effect */}
                <div className="relative p-6 bg-gradient-to-br from-red-500 to-red-600 overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                                <AlertTriangle className="w-7 h-7 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Xác nhận xóa</h2>
                                <p className="text-red-100 text-sm mt-0.5">Hành động quan trọng</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
                            disabled={loading}
                        >
                            <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                    </div>
                </div>

                {/* Body with improved spacing */}
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                            {title || 'Bạn có chắc chắn muốn xóa?'}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                            {message || 'Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.'}
                        </p>
                    </div>

                    {/* Enhanced warning box with gradient border */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl blur opacity-20"></div>
                        <div className="relative p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Shield className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-900 mb-1">⚠️ Cảnh báo quan trọng</p>
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        Sau khi xóa, bạn sẽ <span className="font-semibold">không thể khôi phục</span> lại dữ liệu này. Vui lòng kiểm tra kỹ trước khi tiếp tục.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with better buttons */}
                <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-semibold shadow-sm hover:shadow"
                        disabled={loading}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Đang xóa...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                <span>Xác nhận xóa</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
