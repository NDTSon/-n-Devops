import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import FollowButton from '../components/FollowButton';
import { Search, Users, ShieldCheck, Edit3, User } from 'lucide-react';
import Spinner from '../components/Spinner';

const ROLE_COLORS = {
    ADMIN: 'bg-red-100 text-red-700 border-red-200',
    EDITOR: 'bg-blue-100 text-blue-700 border-blue-200',
    USER: 'bg-slate-100 text-slate-500 border-slate-200',
};

const AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-600',
];

function getAvatarColor(username) {
    if (!username) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash += username.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let result = users;
        if (search.trim()) {
            result = result.filter(u =>
                u.username.toLowerCase().includes(search.toLowerCase()) ||
                (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
            );
        }
        if (roleFilter !== 'ALL') {
            result = result.filter(u => u.role === roleFilter);
        }
        setFiltered(result);
    }, [search, roleFilter, users]);

    const fetchUsers = async () => {
        try {
            const res = await userAPI.getAllUsers();
            const all = res.data || [];
            const others = currentUser ? all.filter(u => u.id !== currentUser.id) : all;
            setUsers(others);
            setFiltered(others);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const roleIcon = (role) => {
        if (role === 'ADMIN') return <ShieldCheck className="h-3 w-3 mr-1 inline" />;
        if (role === 'EDITOR') return <Edit3 className="h-3 w-3 mr-1 inline" />;
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner variant="bars" size="lg" label="Đang tải thành viên..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen">

            {/* ===== MAIN CONTENT ===== */}
            <main className="py-8 px-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <Users className="h-7 w-7 text-primary-600" />
                        <h1 className="text-2xl font-bold text-slate-800">Khám phá thành viên</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Tìm kiếm và kết nối với những người viết blog thú vị</p>
                </div>

                {/* Search + Filter */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 mb-5 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {['ALL', 'USER', 'EDITOR', 'ADMIN'].map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                    roleFilter === role
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400'
                                }`}
                            >
                                {role === 'ALL' ? 'Tất cả' : role}
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                    Hiển thị {filtered.length} / {users.length} thành viên
                </p>

                {filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                        <User className="h-14 w-14 mx-auto mb-3 text-slate-300" />
                        <h3 className="text-lg font-bold text-slate-700 mb-1">Không tìm thấy thành viên</h3>
                        <p className="text-slate-400 text-sm">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filtered.map(u => {
                            const gradient = getAvatarColor(u.username);
                            return (
                                <div
                                    key={u.id}
                                    className="bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all overflow-hidden"
                                >
                                    <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Link to={`/profile/${u.id}`}>
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold flex-shrink-0 hover:opacity-90 transition-opacity`}>
                                                    {u.username?.charAt(0).toUpperCase()}
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link to={`/profile/${u.id}`}>
                                                    <h3 className="font-bold text-slate-800 hover:text-primary-600 transition-colors truncate text-sm">
                                                        {u.username}
                                                    </h3>
                                                </Link>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] || ROLE_COLORS.USER} inline-block mt-0.5`}>
                                                {roleIcon(u.role)}{u.role}
                                            </span>
                                        </div>
                                        </div>
                                        <div className="flex gap-2 items-center flex-wrap mt-2">
                                            {currentUser && (
                                                <FollowButton userId={u.id} username={u.username} />
                                            )}
                                            <Link
                                                to={`/profile/${u.id}`}
                                                className="text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-all whitespace-nowrap flex-shrink-0"
                                            >
                                                Xem trang
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UsersPage;
