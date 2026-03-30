import React, { useState } from 'react';
import { Headphones, X, Send, Sparkles, Ticket, Loader2 } from 'lucide-react';
import { supportAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function SupportContactWidget() {
    const showToast = useToast();

    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState('ai'); // ai | ticket

    const [aiQuestion, setAiQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState('');
    const [askingAi, setAskingAi] = useState(false);

    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [creatingTicket, setCreatingTicket] = useState(false);

    const handleAskAi = async () => {
        if (!aiQuestion.trim() || askingAi) return;
        setAskingAi(true);
        try {
            const res = await supportAPI.askAiAssistant({ question: aiQuestion.trim() });
            setAiAnswer(res.data?.answer || 'AI chua co phan hoi.');
            setAiQuestion('');
        } catch (error) {
            const msg = error.response?.data?.error || 'AI hien chua phan hoi duoc';
            setAiAnswer(msg);
            showToast(msg, 'error');
        } finally {
            setAskingAi(false);
        }
    };

    const handleAiInputKeyDown = (e) => {
        // Allow IME composition and avoid sending while user is composing Vietnamese text.
        if (e.nativeEvent?.isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAskAi();
        }
    };

    const handleCreateTicket = async () => {
        if (!ticketSubject.trim() || !ticketDescription.trim() || creatingTicket) return;
        setCreatingTicket(true);
        try {
            await supportAPI.createTicket({
                subject: ticketSubject.trim(),
                description: ticketDescription.trim()
            });
            setTicketSubject('');
            setTicketDescription('');
            showToast('Da gui ticket ho tro', 'success');
        } catch (error) {
            showToast(error.response?.data?.error || 'Khong gui duoc ticket', 'error');
        } finally {
            setCreatingTicket(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-5 z-[9998] flex flex-col items-end gap-3">
            {isOpen && (
                <div
                    className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                    style={{ height: 'min(78vh, 620px)' }}
                >
                    <div className="bg-primary-600 px-4 py-3 flex items-center gap-3 text-white flex-shrink-0">
                        <div className="flex-1">
                            <span className="font-bold text-base">Lien he ho tro</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-3 pt-3 pb-2 bg-slate-50 border-b border-slate-200">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setTab('ai')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                                    tab === 'ai'
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                            >
                                <span className="inline-flex items-center gap-1">
                                    <Sparkles className="h-4 w-4" />
                                    Nhan AI
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('ticket')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                                    tab === 'ticket'
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                            >
                                <span className="inline-flex items-center gap-1">
                                    <Ticket className="h-4 w-4" />
                                    Gui ticket
                                </span>
                            </button>
                        </div>
                    </div>

                    {tab === 'ai' && (
                        <div className="flex-1 flex flex-col p-3 bg-slate-50">
                            <p className="text-xs text-slate-500 mb-2">Hoi nhanh AI support ma khong can tao ticket.</p>
                            <div className="flex-1 overflow-y-auto p-3 rounded-lg bg-white border text-sm text-slate-700 whitespace-pre-wrap mb-2">
                                {aiAnswer || 'Nhap cau hoi de bat dau tro chuyen voi AI ho tro.'}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={aiQuestion}
                                    onChange={(e) => setAiQuestion(e.target.value)}
                                    onKeyDown={handleAiInputKeyDown}
                                    placeholder="Mo ta van de cua ban..."
                                    className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleAskAi}
                                    disabled={askingAi || !aiQuestion.trim()}
                                    className="p-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg"
                                >
                                    {askingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'ticket' && (
                        <div className="flex-1 p-3 bg-slate-50 flex flex-col gap-2">
                            <p className="text-xs text-slate-500">Gui ticket de doi support xu ly theo luong chinh thuc.</p>
                            <input
                                value={ticketSubject}
                                onChange={(e) => setTicketSubject(e.target.value)}
                                placeholder="Tieu de"
                                className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                            <textarea
                                value={ticketDescription}
                                onChange={(e) => setTicketDescription(e.target.value)}
                                placeholder="Mo ta chi tiet van de..."
                                className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none min-h-[140px]"
                            />
                            <button
                                type="button"
                                onClick={handleCreateTicket}
                                disabled={creatingTicket || !ticketSubject.trim() || !ticketDescription.trim()}
                                className="btn-primary py-2"
                            >
                                {creatingTicket ? 'Dang gui...' : 'Gui ticket'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={() => setIsOpen((v) => !v)}
                className="w-14 h-14 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                title="Lien he ho tro"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
            </button>
        </div>
    );
}
