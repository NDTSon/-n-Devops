import React, { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Loader2, RefreshCw, Search, Ticket, UserRound, Wrench } from 'lucide-react';
import { supportAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

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

function fmt(dateStr) {
    if (!dateStr) return '';
    const normalized = !dateStr.endsWith('Z') && !dateStr.includes('+') ? `${dateStr}Z` : dateStr;
    return new Date(normalized).toLocaleString('vi-VN');
}

export default function AdminSupportPage() {
    const showToast = useToast();
    const [tickets, setTickets] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [replying, setReplying] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');
    const [replyText, setReplyText] = useState('');
    const [aiModels, setAiModels] = useState([]);
    const [currentModel, setCurrentModel] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [loadingModels, setLoadingModels] = useState(false);
    const [savingModel, setSavingModel] = useState(false);
    const [modelStats, setModelStats] = useState([]);
    const [loadingModelStats, setLoadingModelStats] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [filterStatus]);

    useEffect(() => {
        fetchAiModels();
        fetchAiModelStats();
    }, []);

    function toPercent(used, limit) {
        if (!limit || limit <= 0) return 0;
        return Math.min(100, Math.round((used / limit) * 100));
    }

    function compactNumber(n) {
        if (n >= 1000) {
            const value = (n / 1000).toFixed(1);
            return `${value.endsWith('.0') ? value.slice(0, -2) : value}K`;
        }
        return String(n);
    }

    const filteredTickets = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tickets;
        return tickets.filter((t) =>
            (t.subject || '').toLowerCase().includes(q) ||
            (t.username || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }, [tickets, search]);

    const stats = useMemo(() => {
        const open = tickets.filter((t) => t.status === 'OPEN').length;
        const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
        const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
        return {
            total: tickets.length,
            open,
            inProgress,
            resolved
        };
    }, [tickets]);

    async function fetchTickets() {
        setLoading(true);
        try {
            const res = await supportAPI.getAllTickets(filterStatus ? { status: filterStatus } : undefined);
            setTickets(res.data || []);

            if (selected?.id) {
                const exists = (res.data || []).find((t) => t.id === selected.id);
                if (exists) {
                    await fetchDetail(selected.id);
                } else {
                    setSelected(null);
                }
            }
        } catch (e) {
            showToast(e.response?.data?.error || 'Không tải được ticket', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function fetchAiModels() {
        setLoadingModels(true);
        try {
            const res = await supportAPI.getAiModels();
            const models = res.data?.models || [];
            const current = res.data?.currentModel || '';

            setAiModels(models);
            setCurrentModel(current);
            setSelectedModel(current || models[0] || '');
        } catch (e) {
            showToast(e.response?.data?.error || 'Không tải được danh sách model AI', 'error');
        } finally {
            setLoadingModels(false);
        }
    }

    async function fetchAiModelStats() {
        setLoadingModelStats(true);
        try {
            const res = await supportAPI.getAiModelStats();
            setModelStats(res.data?.stats || []);
        } catch (e) {
            showToast(e.response?.data?.error || 'Không tải được thống kê token model', 'error');
        } finally {
            setLoadingModelStats(false);
        }
    }

    async function saveAiModel() {
        if (!selectedModel) return;
        setSavingModel(true);
        try {
            const res = await supportAPI.updateAiModel(selectedModel);
            const next = res.data?.currentModel || selectedModel;
            setCurrentModel(next);
            setSelectedModel(next);
            await fetchAiModelStats();
            showToast('Đổi model AI thành công', 'success');
        } catch (e) {
            showToast(e.response?.data?.error || 'Không đổi được model AI', 'error');
        } finally {
            setSavingModel(false);
        }
    }

    async function fetchDetail(ticketId) {
        try {
            const res = await supportAPI.getTicketDetail(ticketId);
            setSelected(res.data);
        } catch (e) {
            showToast(e.response?.data?.error || 'Không tải được chi tiết ticket', 'error');
        }
    }

    async function updateStatus(status) {
        if (!selected?.id) return;
        setUpdating(true);
        try {
            await supportAPI.updateTicketStatus(selected.id, status);
            showToast('Cập nhật trạng thái thành công', 'success');
            await fetchTickets();
            await fetchDetail(selected.id);
        } catch (e) {
            showToast(e.response?.data?.error || 'Không cập nhật được trạng thái', 'error');
        } finally {
            setUpdating(false);
        }
    }

    async function sendReply(e) {
        e.preventDefault();
        if (!selected?.id || !replyText.trim()) return;
        setReplying(true);
        try {
            await supportAPI.addTicketMessage(selected.id, replyText.trim());
            setReplyText('');
            await fetchDetail(selected.id);
            await fetchTickets();
            showToast('Đã gửi phản hồi', 'success');
        } catch (e2) {
            showToast(e2.response?.data?.error || 'Gửi phản hồi thất bại', 'error');
        } finally {
            setReplying(false);
        }
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-primary-600" />
                        Admin Support Desk
                    </h1>
                    <button
                        type="button"
                        onClick={fetchTickets}
                        className="btn-secondary inline-flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                <div className="card mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700 mb-1">AI model đang dùng</p>
                            <p className="text-sm text-slate-500 mb-2">Hiện tại: <span className="font-semibold text-slate-700">{currentModel || 'Chưa có'}</span></p>
                            <select
                                className="input-field"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={loadingModels || savingModel || aiModels.length === 0}
                            >
                                {aiModels.length === 0 ? (
                                    <option value="">Không có model khả dụng</option>
                                ) : (
                                    aiModels.map((model) => (
                                        <option key={model} value={model}>{model}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    await fetchAiModels();
                                    await fetchAiModelStats();
                                }}
                                className="btn-secondary inline-flex items-center gap-2"
                                disabled={loadingModels || loadingModelStats}
                            >
                                <RefreshCw className={`h-4 w-4 ${(loadingModels || loadingModelStats) ? 'animate-spin' : ''}`} />
                                Tải model
                            </button>
                            <button
                                type="button"
                                onClick={saveAiModel}
                                className="btn-primary inline-flex items-center gap-2"
                                disabled={savingModel || loadingModels || !selectedModel || selectedModel === currentModel}
                            >
                                {savingModel ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Áp dụng model
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-3 gap-2">
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">Token usage theo model</h2>
                            <p className="text-xs text-slate-500 mt-1">Peak usage per model trong 28 ngày gần nhất</p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchAiModelStats}
                            className="btn-secondary inline-flex items-center gap-2"
                            disabled={loadingModelStats}
                        >
                            <RefreshCw className={`h-4 w-4 ${loadingModelStats ? 'animate-spin' : ''}`} />
                            Cập nhật usage
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b">
                                    <th className="py-2 pr-4">Model</th>
                                    <th className="py-2 pr-4">Category</th>
                                    <th className="py-2 pr-4">RPM</th>
                                    <th className="py-2 pr-4">TPM</th>
                                    <th className="py-2">RPD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingModelStats ? (
                                    <tr>
                                        <td className="py-4 text-slate-500" colSpan={5}>Đang tải thống kê...</td>
                                    </tr>
                                ) : modelStats.length === 0 ? (
                                    <tr>
                                        <td className="py-4 text-slate-500" colSpan={5}>Chưa có dữ liệu usage.</td>
                                    </tr>
                                ) : (
                                    modelStats.map((row) => (
                                        <tr key={row.model} className="border-b border-slate-100 last:border-b-0">
                                            <td className="py-3 pr-4 font-medium text-slate-800">{row.model}</td>
                                            <td className="py-3 pr-4 text-slate-600">{row.category}</td>
                                            <td className="py-3 pr-4">
                                                <div className="w-36 h-2 rounded bg-slate-200 overflow-hidden mb-1">
                                                    <div className="h-full bg-sky-500" style={{ width: `${toPercent(row.rpmUsed, row.rpmLimit)}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-600">{row.rpmUsed} / {row.rpmLimit}</span>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="w-36 h-2 rounded bg-slate-200 overflow-hidden mb-1">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${toPercent(row.tpmUsed, row.tpmLimit)}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-600">{compactNumber(row.tpmUsed)} / {compactNumber(row.tpmLimit)}</span>
                                            </td>
                                            <td className="py-3">
                                                <div className="w-36 h-2 rounded bg-slate-200 overflow-hidden mb-1">
                                                    <div className="h-full bg-amber-500" style={{ width: `${toPercent(row.rpdUsed, row.rpdLimit)}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-600">{compactNumber(row.rpdUsed)} / {compactNumber(row.rpdLimit)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                        <p className="text-sm opacity-80">Tổng ticket</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-rose-500 to-red-600 text-white">
                        <p className="text-sm opacity-90">OPEN</p>
                        <p className="text-3xl font-bold mt-1">{stats.open}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <p className="text-sm opacity-90">IN_PROGRESS</p>
                        <p className="text-3xl font-bold mt-1">{stats.inProgress}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <p className="text-sm opacity-90">RESOLVED</p>
                        <p className="text-3xl font-bold mt-1">{stats.resolved}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <section className="xl:col-span-5 card">
                        <div className="flex gap-2 mb-3">
                            <div className="relative flex-1">
                                <Search className="h-4 w-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
                                <input
                                    className="input-field pl-9"
                                    placeholder="Tìm theo user, subject, mô tả"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="input-field max-w-[180px]"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1">
                            {loading ? (
                                <p className="text-sm text-slate-500">Đang tải ticket...</p>
                            ) : filteredTickets.length === 0 ? (
                                <p className="text-sm text-slate-500">Không có ticket phù hợp.</p>
                            ) : (
                                filteredTickets.map((t) => (
                                    <button
                                        type="button"
                                        key={t.id}
                                        onClick={() => fetchDetail(t.id)}
                                        className={`w-full text-left border rounded-xl p-3 transition ${
                                            selected?.id === t.id
                                                ? 'bg-primary-50 border-primary-400'
                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <p className="font-semibold text-slate-800 line-clamp-1">{t.subject}</p>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.description}</p>
                                        <div className="text-xs mt-2 flex flex-wrap gap-2 text-slate-600">
                                            <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{t.username}</span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${getStatusColor(t.status).chip}`}>
                                                {t.status}
                                            </span>
                                            <span>{t.priority}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="xl:col-span-7 card min-h-[640px] flex flex-col">
                        {!selected ? (
                            <div className="flex-1 flex items-center justify-center text-slate-500">
                                <div className="text-center">
                                    <Ticket className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                    Chọn ticket để xử lý
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="border-b pb-3 mb-3">
                                    <h2 className="text-xl font-bold text-slate-800">{selected.subject}</h2>
                                    <p className="text-slate-600 mt-1">{selected.description}</p>
                                    <div className="text-sm text-slate-500 mt-2 flex flex-wrap gap-3">
                                        <span>Người gửi: {selected.username}</span>
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${getStatusColor(selected.status).chip}`}>
                                            Trạng thái: {selected.status}
                                        </span>
                                        <span>Ưu tiên: {selected.priority}</span>
                                        <span>Tạo: {fmt(selected.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="mb-3 flex gap-2 flex-wrap">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => updateStatus(s)}
                                            disabled={updating}
                                            className={`px-3 py-1.5 rounded-md border text-sm ${
                                                selected.status === s
                                                    ? getStatusColor(s).activeBtn
                                                    : getStatusColor(s).inactiveBtn
                                            }`}
                                        >
                                            {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : s}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 border rounded-xl p-3 bg-slate-50 overflow-y-auto space-y-2 mb-3">
                                    {(selected.messages || []).length === 0 ? (
                                        <p className="text-sm text-slate-500">Chưa có trao đổi trong ticket này.</p>
                                    ) : (
                                        selected.messages.map((m) => (
                                            <div key={m.id} className="bg-white border rounded p-2">
                                                <p className="text-sm text-slate-800">{m.message}</p>
                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    Người gửi: {m.senderUsername} ({m.senderRole}) • {fmt(m.createdAt)}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <form onSubmit={sendReply} className="flex gap-2">
                                    <input
                                        className="input-field"
                                        placeholder="Nhập phản hồi cho khách hàng..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <button className="btn-primary px-4 py-2" disabled={replying || !replyText.trim()} type="submit">
                                        {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
                                    </button>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
