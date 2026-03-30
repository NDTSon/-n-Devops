import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useRef as useAudioRef, useEffect as useAudioEffect } from 'react';
import {
    BookOpen,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Lock,
    Users,
    MessageCircle,
    Palette,
    LifeBuoy,
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
        const { theme, setTheme, volumeMap, setVolume } = useTheme();
        // Audio player logic (inline, không dùng component ngoài)
        const audioRef = useAudioRef();
        // Map theme key to audio file name in public/sounds/ (tự động nhận mp3/mp4)
        const THEME_SOUNDS = {
            tet: ['tet.mp3', 'tet.mp4'],
            trungthu: ['trungthu.mp3', 'trungthu.mp4', 'trung-thu.mp4'],
            giangsinh: ['giangsinh.mp3', 'giangsinh.mp4', 'giang-sinh.mp4'],
        };
        let audioSrc;
        if (THEME_SOUNDS[theme]) {
            for (const fname of THEME_SOUNDS[theme]) {
                audioSrc = `/sounds/${fname}`;
                break;
            }
        }
        useAudioEffect(() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (!THEME_SOUNDS[theme]) {
                audio.pause();
                audio.currentTime = 0;
                return;
            }
            audio.volume = volumeMap?.[theme] ?? 0.22;
            if (audio.src && !audio.paused) return;
            audio.play().catch(() => {});
            return () => {
                audio.pause();
                audio.currentTime = 0;
            };
        }, [theme, volumeMap]);
        const handleVolume = (e) => {
            const v = Number(e.target.value);
            setVolume(theme, v);
            if (audioRef.current) audioRef.current.volume = v;
        };
    const navigate = useNavigate();

    const [showDropdown, setShowDropdown] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                setShowThemePanel(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowDropdown(false);
    };

    const navItems = [
        { to: '/', label: 'Trang chủ', icon: BookOpen, show: true },
        { to: '/following', label: 'Following', icon: Users, show: !!user },
        { to: '/users', label: 'Mọi người', icon: Users, show: !!user },
        { to: '/messages', label: 'Tin nhắn', icon: MessageCircle, show: !!user },
        { to: '/support', label: 'Hỗ trợ', icon: LifeBuoy, show: !!user },
        { to: '/admin', label: isAdmin() ? 'Dashboard' : 'My Blogs', icon: Settings, show: !!user && (isAdmin() || user?.role === 'EDITOR') },
        { to: '/admin/users', label: 'Users', icon: User, show: !!user && (isAdmin() || user?.role === 'SUPPORT') },
        { to: '/admin/support', label: 'Admin Support', icon: LifeBuoy, show: !!user && isAdmin() },
    ].filter((item) => item.show);

    const roleBadge = isAdmin()
        ? { text: 'Admin', className: 'bg-primary-600 text-white' }
        : user?.role === 'SUPPORT'
            ? { text: 'Support', className: 'bg-violet-600 text-white' }
            : user?.role === 'EDITOR'
                ? { text: 'Editor', className: 'bg-blue-600 text-white' }
                : null;

    return (
        <>
            <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
                <div className="w-full px-3 lg:px-6">
                    <div className="h-16 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                        <Link to="/" className="flex items-center gap-2 min-w-0 select-none ml-8" style={{ textDecoration: 'none' }}>
                            <BookOpen className="h-6 w-6 text-cyan-400 group-hover:text-cyan-300 transition-colors flex-shrink-0" />
                            <span
                                className="text-4xl font-extrabold text-cyan-400 leading-none"
                                style={{
                                    letterSpacing: '0.02em',
                                    display: 'inline-block',
                                }}
                            >
                                BlogHub
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center justify-center gap-1 overflow-x-auto px-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className="shrink-0 flex flex-col items-center justify-center min-w-[86px] h-14 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                                        title={item.label}
                                    >
                                        <Icon className="h-5 w-5 mb-1" />
                                        <span className="text-[11px] font-medium leading-none">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 justify-end" ref={dropdownRef}>
                            {user ? (
                                <>
                                    <NotificationBell />

                                    <button
                                        onClick={() => setShowDropdown((v) => !v)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center text-sm font-semibold">
                                            {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="hidden lg:block text-left min-w-0">
                                            <p className="text-sm font-semibold truncate max-w-[130px] account-name">{user.username}</p>
                                            {roleBadge && <span className={`text-[10px] px-2 py-0.5 rounded-full account-role ${roleBadge.className}`}>{roleBadge.text}</span>}
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-3 top-14 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2">
                                            <Link
                                                to={`/profile/${user.id}`}
                                                onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-slate-100 hover:bg-slate-800"
                                            >
                                                <User className="h-4 w-4" />
                                                <span className="text-sm font-medium">Trang cá nhân</span>
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setShowChangePasswordModal(true);
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-100 hover:bg-slate-800"
                                            >
                                                <Lock className="h-4 w-4" />
                                                <span className="text-sm font-medium">Đổi mật khẩu</span>
                                            </button>

                                            <button
                                                onClick={() => setShowThemePanel((v) => !v)}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-100 hover:bg-slate-800"
                                            >
                                                <Palette className="h-4 w-4" />
                                                <span className="text-sm font-medium flex-1">Cài đặt giao diện</span>
                                                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showThemePanel ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showThemePanel && (
                                                <div className="px-3 pt-1 pb-2">
                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                        {Object.keys(THEMES).map((key) => {
                                                            const info = THEMES[key];
                                                            const active = theme === key;
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => setTheme(key)}
                                                                    className={`rounded-lg border px-2 py-2 text-xs font-semibold flex items-center gap-1 ${active ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700'}`}
                                                                >
                                                                    <span>{info.icon}</span>
                                                                    {info.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Thanh điều chỉnh âm lượng nhạc nền */}
                                                                                                        {audioSrc && (
                                                                                                            <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 8, minWidth: 180 }}>
                                                                                                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#222' }}>Nhạc nền</div>
                                                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                                                    <audio ref={audioRef} src={audioSrc} loop autoPlay style={{ display: 'none' }} />
                                                                                                                    <input type="range" min={0} max={1} step={0.01} value={volumeMap?.[theme] ?? 0.22} onChange={handleVolume} style={{ width: 100 }} />
                                                                                                                    <span style={{ minWidth: 28, textAlign: 'right' }}>{Math.round((volumeMap?.[theme] ?? 0.22) * 100)}%</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}
                                                </div>
                                            )}

                                            <div className="border-t border-slate-700 my-1" />

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-300 hover:bg-red-950/40"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span className="text-sm font-medium">Đăng xuất</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-slate-200 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 font-medium">
                                        Login
                                    </Link>
                                    <Link to="/register" className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="md:hidden border-t border-slate-800 px-2 py-1 flex items-center gap-1 overflow-x-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <ChangePasswordModal
                isOpen={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
            />
        </>
    );
};

export default Navbar;
