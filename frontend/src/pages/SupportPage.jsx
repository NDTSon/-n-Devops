import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Loader2, Plus, Send, Sparkles, Ticket, Wrench, LifeBuoy } from 'lucide-react';
import { supportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const STATUS_COLORS = {
    OPEN: {
        chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        activeBtn: 'bg-emerald-600 text-white border-emerald-600',
        inactiveBtn: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
    },
    IN_PROGRESS: {
        chip: 'border-amber-200 bg-amber-50 text-amber-700',
        activeBtn: 'bg-amber-600 text-white border-amber-600',
        inactiveBtn: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
    },
    RESOLVED: {
        chip: 'border-sky-200 bg-sky-50 text-sky-700',
        activeBtn: 'bg-sky-600 text-white border-sky-600',
        inactiveBtn: 'bg-white text-sky-700 border-sky-300 hover:bg-sky-50'
    },
    CLOSED: {
        chip: 'border-rose-200 bg-rose-50 text-rose-700',
        activeBtn: 'bg-rose-600 text-white border-rose-600',
        inactiveBtn: 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
    }
};

function getStatusColor(status) {
    return STATUS_COLORS[status] || {
        chip: 'border-slate-200 bg-slate-50 text-slate-700',
        activeBtn: 'bg-slate-700 text-white border-slate-700',
        inactiveBtn: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
    };
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const normalized =
        dateStr && !dateStr.endsWith('Z') && !dateStr.includes('+') ? `${dateStr}Z` : dateStr;
    const d = new Date(normalized);
    return d.toLocaleString('vi-VN');
}

export default function SupportPage() {
    const { user } = useAuth();
    const showToast = useToast();
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [askingAi, setAskingAi] = useState(false);
    const [creatingTicket, setCreatingTicket] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        priority: 'NORMAL'
    });

    const [messageInput, setMessageInput] = useState('');
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState('');

    const isStaff = useMemo(() => {
        const role = (user?.role || '').toUpperCase();
        return role === 'ADMIN' || role === 'SUPPORT' || role === 'MODERATOR';
    }, [user]);

    const canSetPriority = useMemo(() => {
        const role = (user?.role || '').toUpperCase();
        return role === 'ADMIN' || role === 'SUPPORT';
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchTickets();
    }, [user, isStaff, statusFilter]);

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const response = isStaff
                ? await supportAPI.getAllTickets(statusFilter ? { status: statusFilter } : undefined)
                : await supportAPI.getMyTickets();
            setTickets(response.data || []);

            const currentSelectedId = selectedTicket?.id;
            if (currentSelectedId) {
                const exists = (response.data || []).find((t) => t.id === currentSelectedId);
                if (exists) {
                    await fetchTicketDetail(currentSelectedId);
                } else {
                    setSelectedTicket(null);
                    setAiAnswer('');
                }
            }
        } catch (error) {
            showToast(error.response?.data?.error || 'Không tải được danh sách ticket', 'error');
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchTicketDetail = async (ticketId) => {
        setLoadingDetail(true);
        try {
            const response = await supportAPI.getTicketDetail(ticketId);
            setSelectedTicket(response.data);
        } catch (error) {
            showToast(error.response?.data?.error || 'Không tải được chi tiết ticket', 'error');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicket.subject.trim() || !newTicket.description.trim()) {
            showToast('Vui lòng nhập tiêu đề và mô tả ticket', 'warning');
            return;
        }

        setCreatingTicket(true);
        try {
            const payload = canSetPriority
                ? newTicket
                : {
                    subject: newTicket.subject,
                    description: newTicket.description
                };

            const response = await supportAPI.createTicket(payload);
            showToast('Tạo ticket thành công', 'success');
            setNewTicket({ subject: '', description: '', priority: 'NORMAL' });
            await fetchTickets();
            if (response?.data?.id) {
                await fetchTicketDetail(response.data.id);
            }
        } catch (error) {
            showToast(error.response?.data?.error || 'Tạo ticket thất bại', 'error');
        } finally {
            setCreatingTicket(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedTicket?.id || !messageInput.trim()) return;

        setSendingMessage(true);
        try {
            await supportAPI.addTicketMessage(selectedTicket.id, messageInput.trim());
            setMessageInput('');
            await fetchTicketDetail(selectedTicket.id);
        } catch (error) {
            showToast(error.response?.data?.error || 'Gửi phản hồi thất bại', 'error');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleAskAi = async (e) => {
        e.preventDefault();
        if (askingAi || !aiQuestion.trim()) return;

        setAskingAi(true);
        setAiAnswer('');
        try {
            const payload = {
                question: aiQuestion.trim()
            };

            if (selectedTicket?.id) {
                payload.ticketId = selectedTicket.id;
            }

            const response = await supportAPI.askAiAssistant(payload);
            setAiAnswer(response.data?.answer || 'Không có phản hồi từ AI');
            setAiQuestion('');
        } catch (error) {
            const status = error.response?.status;
            const serverError = error.response?.data?.error || '';

            if (status === 503 || /not configured|AI_API_KEY/i.test(serverError)) {
                setAiAnswer('AI chưa được cấu hình ở môi trường backend (thiếu AI_API_KEY).');
                showToast('AI chưa được cấu hình trên server', 'warning');
            } else if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(serverError)) {
                setAiAnswer('AI đã vượt quota hoặc rate limit. Vui lòng thử lại sau, hoặc cập nhật API key/gói dịch vụ AI.');
                showToast('AI đang vượt giới hạn quota/rate limit', 'warning');
            } else if (status === 502 || status === 504) {
                setAiAnswer('AI provider đang lỗi hoặc timeout. Vui lòng thử lại sau ít phút.');
                showToast('AI provider tạm thời không khả dụng', 'error');
            } else {
                showToast(serverError || 'AI hiện chưa phản hồi được', 'error');
            }
        } finally {
            setAskingAi(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedTicket?.id) return;
        try {
            await supportAPI.updateTicketStatus(selectedTicket.id, status);
            showToast('Cập nhật trạng thái thành công', 'success');
            await fetchTickets();
            await fetchTicketDetail(selectedTicket.id);
        } catch (error) {
            showToast(error.response?.data?.error || 'Không cập nhật được trạng thái', 'error');
        }
    };

    const handleUpdatePriority = async (priority) => {
        if (!selectedTicket?.id) return;
        try {
            await supportAPI.updateTicketPriority(selectedTicket.id, priority);
            showToast('Cập nhật mức độ ưu tiên thành công', 'success');
            await fetchTickets();
            await fetchTicketDetail(selectedTicket.id);
        } catch (error) {
            showToast(error.response?.data?.error || 'Không cập nhật được mức độ ưu tiên', 'error');
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <LifeBuoy className="h-8 w-8 text-primary-600" />
                        Hỗ trợ khách hàng
                    </h1>
                    {isStaff && (
                        <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-600">Chế độ xử lý ticket</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <section className="xl:col-span-4 space-y-6">
                        <div className="card">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Tạo ticket mới
                            </h2>
                            <form onSubmit={handleCreateTicket} className="space-y-3">
                                <input
                                    className="input-field"
                                    placeholder="Tiêu đề vấn đề"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket((p) => ({ ...p, subject: e.target.value }))}
                                />
                                <textarea
                                    className="input-field min-h-28"
                                    placeholder="Mô tả chi tiết bạn đang gặp lỗi gì..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket((p) => ({ ...p, description: e.target.value }))}
                                />
                                <div className="text-xs text-slate-500 px-1">
                                    Mức độ ưu tiên khi tạo ticket: NORMAL. Support/Admin có thể cập nhật sau trong màn xử lý.
                                </div>
                                <button className="btn-primary w-full" disabled={creatingTicket} type="submit">
                                    {creatingTicket ? 'Đang tạo...' : 'Gửi ticket'}
                                </button>
                            </form>
                        </div>

                        <div className="card">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Ticket className="h-4 w-4" />
                                    Danh sách ticket
                                </h2>
                                {isStaff && (
                                    <select
                                        className="px-2 py-1 text-sm border rounded"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả</option>
                                        {STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {loadingTickets ? (
                                <div className="text-slate-500 text-sm">Đang tải...</div>
                            ) : tickets.length === 0 ? (
                                <div className="text-slate-500 text-sm">Chưa có ticket nào.</div>
                            ) : (
                                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                    {tickets.map((ticket) => (
                                        <button
                                            type="button"
                                            key={ticket.id}
                                            onClick={() => fetchTicketDetail(ticket.id)}
                                            className={`w-full text-left p-3 rounded-lg border transition ${
                                                selectedTicket?.id === ticket.id
                                                    ? 'border-primary-400 bg-primary-50'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <p className="font-medium text-slate-800 truncate">{ticket.subject}</p>
                                            <p className="text-xs text-slate-500 mt-1">Người gửi: {ticket.username || 'Ẩn danh'}</p>
                                            <div className="text-xs mt-2 flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${getStatusColor(ticket.status).chip}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-slate-500">{ticket.priority}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="xl:col-span-8">
                        <div className="card min-h-[620px] flex flex-col">
                            {!selectedTicket ? (
                                <div className="text-slate-500 text-center py-20">
                                    Chọn ticket để xem chi tiết và trao đổi
                                </div>
                            ) : loadingDetail ? (
                                <div className="text-slate-500 text-center py-20">Đang tải chi tiết...</div>
                            ) : (
                                <>
                                    <div className="border-b pb-4 mb-4">
                                        <h3 className="text-xl font-bold text-slate-800">{selectedTicket.subject}</h3>
                                        <p className="text-slate-600 mt-2">{selectedTicket.description}</p>
                                        <div className="text-sm text-slate-500 mt-2 flex flex-wrap gap-3">
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${getStatusColor(selectedTicket.status).chip}`}>
                                                Trạng thái: {selectedTicket.status}
                                            </span>
                                            <span>Người gửi: {selectedTicket.username || 'Ẩn danh'}</span>
                                            <span>Ưu tiên: {selectedTicket.priority}</span>
                                            <span>Tạo lúc: {formatTime(selectedTicket.createdAt)}</span>
                                        </div>

                                        {isStaff && (
                                            <div className="mt-3 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {STATUSES.map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => handleUpdateStatus(s)}
                                                            className={`px-3 py-1.5 rounded-md text-sm border ${
                                                                selectedTicket.status === s
                                                                    ? getStatusColor(s).activeBtn
                                                                    : getStatusColor(s).inactiveBtn
                                                            }`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-600">Mức độ:</span>
                                                    <select
                                                        className="input-field max-w-[180px]"
                                                        value={selectedTicket.priority || 'NORMAL'}
                                                        onChange={(e) => handleUpdatePriority(e.target.value)}
                                                    >
                                                        {PRIORITIES.map((p) => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                                        <div className="border rounded-xl p-3 flex flex-col min-h-[360px]">
                                            <h4 className="font-semibold text-slate-800 mb-3">Trao đổi ticket</h4>
                                            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
                                                {(selectedTicket.messages || []).length === 0 ? (
                                                    <p className="text-sm text-slate-500">Chưa có trao đổi.</p>
                                                ) : (
                                                    selectedTicket.messages.map((m) => (
                                                        <div key={m.id} className="p-2 rounded bg-slate-50 border">
                                                            <p className="text-sm text-slate-800">{m.message}</p>
                                                            <p className="text-[11px] text-slate-500 mt-1">
                                                                Người gửi: {m.senderUsername} ({m.senderRole}) • {formatTime(m.createdAt)}
                                                            </p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                                <input
                                                    className="input-field"
                                                    placeholder="Nhập phản hồi..."
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={sendingMessage || !messageInput.trim()}
                                                    className="btn-primary px-4 py-2"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            </form>
                                        </div>

                                        <div className="border rounded-xl p-3 flex flex-col min-h-[360px]">
                                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                AI Assistant
                                            </h4>
                                            <p className="text-xs text-slate-500 mb-2">
                                                {selectedTicket?.id
                                                    ? 'Đang dùng ngữ cảnh ticket đã chọn để tư vấn chi tiết hơn.'
                                                    : 'Bạn có thể hỏi AI trực tiếp mà không cần tạo ticket trước.'}
                                            </p>
                                            <form onSubmit={handleAskAi} className="flex gap-2 mb-3">
                                                <input
                                                    className="input-field"
                                                    placeholder="Hỏi AI bất kỳ vấn đề nào bạn đang gặp..."
                                                    value={aiQuestion}
                                                    onChange={(e) => setAiQuestion(e.target.value)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={askingAi || !aiQuestion.trim()}
                                                    className="btn-primary px-4 py-2"
                                                >
                                                    {askingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                                                </button>
                                            </form>

                                            <div className="flex-1 overflow-y-auto p-3 rounded-lg bg-slate-50 border text-sm text-slate-700 whitespace-pre-wrap">
                                                {aiAnswer || 'AI chưa có câu trả lời. Hãy nhập câu hỏi để bắt đầu.'}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
