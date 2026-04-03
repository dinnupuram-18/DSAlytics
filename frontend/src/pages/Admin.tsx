import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import {
    Clock,
    ShieldAlert,
    Search,
    Trash2,
    Megaphone,
    BarChart3,
    Trophy,
    Filter,
    Activity,
    Settings,
    Lock,
    UserPlus,
    Mail,
    Shield,
    Users,
    Download,
    ShieldCheck,
    Zap,
    Globe,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Bell,
    Eye,
    RefreshCw,
    Database,
    AlertTriangle,
    Terminal,
    Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    AreaChart,
    Area
} from 'recharts';

type Tab = 'overview' | 'users' | 'competitions' | 'notifications' | 'system' | 'security' | 'platform-settings' | 'profile';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function Admin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [requests, setRequests] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [stats, setStats] = useState({ totalUsers: 0, activeToday: 24, storage: '1.2 GB', nodeStatus: 'Operational', dbStatus: 'Connected' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [newComp, setNewComp] = useState({ title: '', startDate: '', endDate: '' });

    const fetchRequests = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/admin/requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (error) { console.error(error); }
    }, []);

    const fetchUsers = useCallback(async (query = '') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/admin/users?search=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setStats(prev => ({ ...prev, totalUsers: data.total }));
            }
        } catch (error) { console.error(error); }
    }, []);

    const fetchCompetitions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/competitions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCompetitions(await res.json());
        } catch (error) { console.error(error); }
    }, []);

    const fetchAnalytics = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/admin/analytics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setAnalytics(await res.json());
        } catch (error) { console.error(error); }
    }, []);

    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        if (path === '/admin') setActiveTab('overview');
        else if (path === '/admin/users') setActiveTab('users');
        else if (path === '/admin/competitions') setActiveTab('competitions');
        else if (path === '/admin/notifications') setActiveTab('notifications');
        else if (path === '/admin/system') setActiveTab('system');
        else if (path === '/admin/security') setActiveTab('security');
        else if (path === '/admin/platform-settings') setActiveTab('platform-settings');
        else if (path === '/admin/profile') setActiveTab('profile');
    }, [location.pathname]);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                // Only the designated admin (24J41A05HK) can access this panel
                if (user && user.collegeId === '24J41A05HK') {
                    setIsAdmin(true);
                    await Promise.all([fetchRequests(), fetchUsers(), fetchCompetitions(), fetchAnalytics()]);
                }
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        checkAdmin();
    }, [fetchRequests, fetchUsers, fetchCompetitions, fetchAnalytics]);

    const handleCreateCompetition = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/competitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newComp)
            });
            if (res.ok) { fetchCompetitions(); setNewComp({ title: '', startDate: '', endDate: '' }); }
        } catch (error) { console.error(error); }
    };

    const toggleCompetition = async (id: string, isActive: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/competitions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isActive })
            });
            if (res.ok) fetchCompetitions();
        } catch (error) { console.error(error); }
    };

    const handleDeleteCompetition = async (id: string) => {
        if (!window.confirm('Delete this competition?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/competitions/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchCompetitions();
        } catch (error) { console.error(error); }
    };

    const handleProfileRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/admin/handle-request', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ requestId, status })
            });
            if (res.ok) fetchRequests();
        } catch (err) { console.error(err); }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        const message = (e.target as any).message.value;
        if (!message) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/notifications/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message })
            });
            if (res.ok) { alert('Broadcast sent!'); (e.target as any).reset(); }
        } catch (error) { console.error(error); }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchUsers(searchTerm);
        } catch (error) { console.error(error); }
    };

    if (loading) return (
        <DashboardLayout isAdminView={true}>
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Initializing Secure Protocol</p>
                </div>
            </div>
        </DashboardLayout>
    );

    if (!isAdmin) {
        return (
            <DashboardLayout isAdminView={true}>
                <div className="flex items-center justify-center min-h-[80vh]">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-12 text-center max-w-md bg-red-500/5 border border-red-500/20 rounded-3xl backdrop-blur-xl">
                        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert size={40} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Access Denied</h2>
                        <p className="text-slate-400 text-sm font-medium mb-8">Administrator credentials required.</p>
                        <button onClick={() => navigate('/')} className="px-8 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                            Return to Dashboard
                        </button>
                    </motion.div>
                </div>
            </DashboardLayout>
        );
    }

    const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <DashboardLayout isAdminView={true}>
            <div className="min-h-screen pb-16 space-y-8">

                {/* ── Page Header ── */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">System Online</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Admin Control Center</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">DSAlytics Enterprise Dashboard · Level 4 Access</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-bold text-slate-400">
                            <Shield size={14} className="text-indigo-400" />
                            <span>{adminUser.name || 'Admin'}</span>
                        </div>
                        <button
                            onClick={() => setMaintenanceMode(m => !m)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${maintenanceMode
                                ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                                : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-red-500/30 hover:text-red-400'}`}
                        >
                            <Zap size={13} />
                            {maintenanceMode ? 'Maintenance ON' : 'Maintenance'}
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div key="overview" variants={stagger} initial="hidden" animate="show" className="space-y-6">

                            {/* Stat Cards */}
                            <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'indigo', bg: 'from-indigo-500/10 to-indigo-500/5', border: 'border-indigo-500/15', iconColor: 'text-indigo-400', sub: 'Registered identities' },
                                    { label: 'Active Events', value: competitions.filter(c => c.isActive).length, icon: Trophy, color: 'emerald', bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/15', iconColor: 'text-emerald-400', sub: 'Live competitions' },
                                    { label: 'Pending Auth', value: requests.length, icon: Clock, color: 'amber', bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/15', iconColor: 'text-amber-400', sub: 'Awaiting approval' },
                                    { label: 'System Status', value: stats.nodeStatus, icon: Cpu, color: 'cyan', bg: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/15', iconColor: 'text-cyan-400', sub: 'All systems nominal' },
                                ].map((card) => (
                                    <motion.div key={card.label} variants={fadeUp}
                                        className={`glass-card hover-lift p-5 rounded-2xl bg-gradient-to-br ${card.bg} border-0 group cursor-default`} style={{ padding: '1.25rem' }}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.06] ${card.iconColor}`}>
                                                <card.icon size={18} />
                                            </div>
                                            <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
                                        </div>
                                        <div className="text-2xl font-black tracking-tight mb-0.5">{card.value}</div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{card.label}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{card.sub}</div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                {/* Quick Protocols — Premium Card Grid */}
                                <motion.div variants={fadeUp} className="glass-card lg:col-span-2 rounded-2xl" style={{ padding: '1.5rem' }}>
                                    <div className="mb-5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Terminal size={13} className="text-slate-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Quick Protocols</span>
                                        </div>
                                        <p className="text-[10px] text-slate-600 font-medium ml-5">High-priority administrative controls</p>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent mb-5" />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            {
                                                icon: Trophy,
                                                label: 'Create Competition',
                                                sub: 'Initialize new coding event',
                                                badge: 'High Priority',
                                                accent: '#10b981',
                                                bg: 'from-emerald-500/[0.12] to-emerald-500/[0.03]',
                                                border: 'border-emerald-500/[0.18]',
                                                hoverBorder: 'hover:border-emerald-500/50',
                                                hoverShadow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]',
                                                iconBg: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
                                                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                                arrowColor: 'text-emerald-500/40 group-hover:text-emerald-400',
                                                onClick: () => setActiveTab('competitions'),
                                            },
                                            {
                                                icon: Users,
                                                label: 'Manage Users',
                                                sub: 'View registered identities',
                                                badge: 'Access Control',
                                                accent: '#6366f1',
                                                bg: 'from-indigo-500/[0.12] to-indigo-500/[0.03]',
                                                border: 'border-indigo-500/[0.18]',
                                                hoverBorder: 'hover:border-indigo-500/50',
                                                hoverShadow: 'hover:shadow-[0_0_24px_rgba(99,102,241,0.15)]',
                                                iconBg: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400',
                                                badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                                arrowColor: 'text-indigo-500/40 group-hover:text-indigo-400',
                                                onClick: () => setActiveTab('users'),
                                            },
                                            {
                                                icon: Bell,
                                                label: 'Broadcast Alert',
                                                sub: 'Send global notification',
                                                badge: 'Transmit',
                                                accent: '#f59e0b',
                                                bg: 'from-amber-500/[0.12] to-amber-500/[0.03]',
                                                border: 'border-amber-500/[0.18]',
                                                hoverBorder: 'hover:border-amber-500/50',
                                                hoverShadow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.15)]',
                                                iconBg: 'bg-amber-500/15 border-amber-500/25 text-amber-400',
                                                badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                                arrowColor: 'text-amber-500/40 group-hover:text-amber-400',
                                                onClick: () => setActiveTab('notifications'),
                                            },
                                            {
                                                icon: Download,
                                                label: 'Export Data',
                                                sub: 'Download master records',
                                                badge: 'Secure',
                                                accent: '#a855f7',
                                                bg: 'from-purple-500/[0.12] to-purple-500/[0.03]',
                                                border: 'border-purple-500/[0.18]',
                                                hoverBorder: 'hover:border-purple-500/50',
                                                hoverShadow: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.15)]',
                                                iconBg: 'bg-purple-500/15 border-purple-500/25 text-purple-400',
                                                badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                                                arrowColor: 'text-purple-500/40 group-hover:text-purple-400',
                                                onClick: () => { },
                                            },
                                        ].map((action) => (
                                            <motion.button
                                                key={action.label}
                                                onClick={action.onClick}
                                                whileHover={{ scale: 1.02, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                                className={`group relative text-left p-4 rounded-xl bg-gradient-to-br ${action.bg} border ${action.border} ${action.hoverBorder} ${action.hoverShadow} transition-all duration-200 overflow-hidden cursor-pointer`}
                                            >
                                                {/* Subtle animated background blob */}
                                                <div
                                                    className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                                                    style={{ background: action.accent }}
                                                />

                                                {/* Top row: icon + badge */}
                                                <div className="relative flex items-start justify-between mb-3">
                                                    <div className={`p-2.5 rounded-xl border ${action.iconBg} flex-shrink-0`}>
                                                        <action.icon size={17} />
                                                    </div>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${action.badgeColor}`}>
                                                        {action.badge}
                                                    </span>
                                                </div>

                                                {/* Text */}
                                                <div className="relative">
                                                    <div className="text-[11px] font-black text-white/90 group-hover:text-white mb-0.5 tracking-tight transition-colors">
                                                        {action.label}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 font-medium leading-tight mb-3">
                                                        {action.sub}
                                                    </div>
                                                </div>

                                                {/* Arrow row */}
                                                <div className="relative flex items-center justify-end">
                                                    <motion.div
                                                        className={`${action.arrowColor} transition-colors`}
                                                        animate={{ x: 0 }}
                                                        whileHover={{ x: 4 }}
                                                    >
                                                        <ChevronRight size={14} />
                                                    </motion.div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Live Monitor */}
                                <motion.div variants={fadeUp} className="glass-card lg:col-span-3 rounded-2xl" style={{ padding: '1.5rem' }}>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5 flex items-center gap-2">
                                        <Activity size={14} />Node Activity Grid
                                    </h3>
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={analytics?.userClusters || [
                                                { name: 'Mon', count: 12 }, { name: 'Tue', count: 28 },
                                                { name: 'Wed', count: 19 }, { name: 'Thu', count: 35 },
                                                { name: 'Fri', count: 42 }, { name: 'Sat', count: 31 },
                                                { name: 'Sun', count: 22 }
                                            ]}>
                                                <defs>
                                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        {[
                                            { label: 'Nodes Online', val: stats.activeToday, status: 'online' },
                                            { label: 'Memory Load', val: '42%', status: 'warning' },
                                            { label: 'DB Status', val: stats.dbStatus, status: 'online' },
                                        ].map((m) => (
                                            <div key={m.label} className="glass-card p-3 rounded-xl text-center" style={{ padding: '0.75rem' }}>
                                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{m.label}</span>
                                                </div>
                                                <div className="text-sm font-black">{m.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>{/* end lg:grid-cols-5 */}
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div key="users" variants={stagger} initial="hidden" animate="show" className="space-y-5">
                            <motion.div variants={fadeUp} className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Identity Management</h2>
                                    <p className="text-slate-500 text-sm font-medium">{stats.totalUsers} registered identities in system</p>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-72">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search identities..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); fetchUsers(e.target.value); }}
                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-white/[0.05] transition-all text-xs font-bold">
                                        <Filter size={14} />
                                    </button>
                                    <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                                        <UserPlus size={14} />
                                        <span className="hidden sm:inline">Add</span>
                                    </button>
                                </div>
                            </motion.div>

                            {/* Pending requests banner */}
                            {requests.length > 0 && (
                                <motion.div variants={fadeUp} className="glass-card p-5 rounded-2xl flex items-start gap-4" style={{ padding: '1.25rem', background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.2)' }}>
                                    <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3">{requests.length} Pending Authorization Request{requests.length !== 1 && 's'}</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {requests.map((req) => (
                                                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                                    <div className="flex items-center gap-3">
                                                        <img src={req.user.avatarUrl ? `http://127.0.0.1:5000${req.user.avatarUrl}` : `https://ui-avatars.com/api/?name=${req.user.name}&background=random&size=64`} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                        <div>
                                                            <div className="text-xs font-bold">{req.user.name}</div>
                                                            <div className="text-[9px] text-slate-500 uppercase tracking-wider">{req.type}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleProfileRequest(req.id, 'APPROVED')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                                                            <CheckCircle2 size={13} />
                                                        </button>
                                                        <button onClick={() => handleProfileRequest(req.id, 'REJECTED')} className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                                            <XCircle size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Users Table */}
                            <motion.div variants={fadeUp} className="glass-card rounded-2xl" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="grid grid-cols-[auto_1fr_120px_100px_80px] gap-0 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 px-6 py-3 border-b border-white/[0.04]">
                                    <div className="w-10 mr-4">#</div>
                                    <div>Entity</div>
                                    <div>Role</div>
                                    <div>Status</div>
                                    <div className="text-right">Actions</div>
                                </div>
                                <div className="divide-y divide-white/[0.03]">
                                    {users.length === 0 ? (
                                        <div className="py-16 text-center">
                                            <Users size={32} className="text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm font-medium">No identities found</p>
                                        </div>
                                    ) : users.map((user, idx) => (
                                        <motion.div layout key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="grid grid-cols-[auto_1fr_120px_100px_80px] gap-0 items-center px-6 py-4 hover:bg-white/[0.02] transition-all group">
                                            <div className="w-10 mr-4 text-[10px] font-black text-slate-600">{idx + 1}</div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.05] border border-white/[0.06]">
                                                    <img src={user.avatarUrl ? `http://127.0.0.1:5000${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold truncate">{user.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium truncate">{user.email}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${user.isAdmin ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'}`}>
                                                    {user.isAdmin ? 'Admin' : 'User'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-slate-500 hover:text-white hover:border-white/[0.15] opacity-0 group-hover:opacity-100 transition-all">
                                                    <Eye size={13} />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-slate-500 hover:text-red-400 hover:border-red-500/20 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'competitions' && (
                        <motion.div key="competitions" variants={stagger} initial="hidden" animate="show" className="space-y-5">
                            <motion.div variants={fadeUp} className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Competition Protocols</h2>
                                    <p className="text-slate-500 text-sm font-medium">Deploy and manage coding events</p>
                                </div>
                                <button onClick={handleCreateCompetition as any} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                                    <Trophy size={14} />Deploy Event
                                </button>
                            </motion.div>

                            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {competitions.length === 0 ? (
                                    <motion.div variants={fadeUp} className="glass-card col-span-full py-20 text-center rounded-2xl border-dashed">
                                        <Trophy size={40} className="text-slate-500 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No competitions initialized</p>
                                    </motion.div>
                                ) : competitions.map((comp) => (
                                    <motion.div key={comp.id} variants={fadeUp}
                                        className="glass-card hover-lift p-5 rounded-2xl group" style={{ padding: '1.25rem' }}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl border ${comp.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.04] text-slate-500 border-white/[0.06]'}`}>
                                                <Trophy size={18} />
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDeleteCompetition(comp.id)} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-slate-600 hover:text-red-400 hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={13} />
                                                </button>
                                                <button className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-slate-600 hover:text-white hover:border-white/[0.15] transition-all opacity-0 group-hover:opacity-100">
                                                    <Settings size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-sm mb-1.5">{comp.title}</h4>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${comp.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'}`}>
                                                {comp.isActive ? '● Live' : '○ Offline'}
                                            </span>
                                            <span className="text-[9px] text-slate-600 font-medium">{new Date(comp.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleCompetition(comp.id, !comp.isActive)}
                                            className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${comp.isActive
                                                ? 'bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500'
                                                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}>
                                            {comp.isActive ? 'Terminate Protocol' : 'Deploy Protocol'}
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div key="notifications" variants={stagger} initial="hidden" animate="show" className="max-w-2xl space-y-5">
                            <motion.div variants={fadeUp}>
                                <h2 className="text-xl font-black tracking-tight">Global Transmission</h2>
                                <p className="text-slate-500 text-sm font-medium">Broadcast priority alerts to all registered identities</p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="glass-card rounded-2xl" style={{ padding: '1.75rem' }}>
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.06]">
                                    <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                                        <Megaphone size={22} />
                                    </div>
                                    <div>
                                        <div className="font-black text-base tracking-tight">System Broadcast</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Immediate · All Verified Users</div>
                                    </div>
                                </div>
                                <form onSubmit={handleBroadcast} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Message Content</label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={5}
                                            placeholder="Type your transmission here..."
                                            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.04] transition-all resize-none placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                            <div className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Priority</div>
                                            <div className="text-xs font-black text-violet-400">Immediate</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                            <div className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Target</div>
                                            <div className="text-xs font-black">All Entities</div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-4 rounded-xl bg-violet-500 text-white text-xs font-black uppercase tracking-[0.25em] hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-3">
                                        <Megaphone size={16} />Deploy Transmission
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'system' && (
                        <motion.div key="system" variants={stagger} initial="hidden" animate="show" className="space-y-5">
                            <motion.div variants={fadeUp}>
                                <h2 className="text-xl font-black tracking-tight">System Health Monitor</h2>
                                <p className="text-slate-500 text-sm font-medium">Real-time infrastructure status and logs</p>
                            </motion.div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <motion.div variants={fadeUp} className="glass-card rounded-2xl" style={{ padding: '1.5rem' }}>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5 flex items-center gap-2">
                                        <BarChart3 size={13} />Node Active Grid
                                    </h3>
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics?.userClusters || [
                                                { name: 'CS', count: 45 }, { name: 'ECE', count: 32 },
                                                { name: 'EEE', count: 28 }, { name: 'ME', count: 19 },
                                                { name: 'CE', count: 25 }, { name: 'IT', count: 38 }
                                            ]}>
                                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                                                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                <motion.div variants={fadeUp} className="glass-card rounded-2xl" style={{ padding: '1.5rem' }}>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5 flex items-center gap-2">
                                        <Terminal size={13} />System Metrics
                                    </h3>
                                    <div className="space-y-3 mb-6">
                                        {[
                                            { label: 'CPU Usage', val: 38, color: '#6366f1' },
                                            { label: 'Memory', val: 62, color: '#10b981' },
                                            { label: 'Disk I/O', val: 24, color: '#f59e0b' },
                                            { label: 'Network', val: 71, color: '#ec4899' },
                                        ].map((m) => (
                                            <div key={m.label} className="space-y-1.5">
                                                <div className="flex justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
                                                    <span className="text-[10px] font-black" style={{ color: m.color }}>{m.val}%</span>
                                                </div>
                                                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.val}%` }} transition={{ duration: 1.2, ease: 'circOut' }}
                                                        className="h-full rounded-full" style={{ background: m.color }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3 flex items-center gap-2">
                                        <Database size={13} />Transaction Logs
                                    </h3>
                                    <div className="space-y-2 max-h-[130px] overflow-y-auto custom-scrollbar">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-medium text-slate-400">Auth Request 0X24F{i} — Processed</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-600">{i}m ago</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div key="security" variants={stagger} initial="hidden" animate="show" className="space-y-5">
                            <motion.div variants={fadeUp}>
                                <h2 className="text-xl font-black tracking-tight">Security & Governance</h2>
                                <p className="text-slate-500 text-sm font-medium">Role-based access control and permissions</p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="glass-card rounded-2xl" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="grid grid-cols-[1fr_100px_100px_100px] text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 px-6 py-3.5 border-b border-white/[0.04]">
                                    <div>Permission Domain</div>
                                    <div className="text-center">Super Admin</div>
                                    <div className="text-center">Moderator</div>
                                    <div className="text-center">Manager</div>
                                </div>
                                <div className="divide-y divide-white/[0.04]">
                                    {[
                                        { label: 'User Access Management', sa: true, mod: true, mgr: false },
                                        { label: 'Competition Deployment', sa: true, mod: false, mgr: true },
                                        { label: 'Global Broadcast', sa: true, mod: true, mgr: false },
                                        { label: 'System Maintenance', sa: true, mod: false, mgr: false },
                                        { label: 'Data Export', sa: true, mod: false, mgr: false },
                                        { label: 'Security Config', sa: true, mod: false, mgr: false },
                                    ].map((row) => (
                                        <div key={row.label} className="grid grid-cols-[1fr_100px_100px_100px] items-center px-6 py-4 hover:bg-white/[0.02] transition-all">
                                            <div className="text-sm font-medium text-slate-300">{row.label}</div>
                                            {[row.sa, row.mod, row.mgr].map((val, i) => (
                                                <div key={i} className="flex justify-center">
                                                    {val
                                                        ? <CheckCircle2 size={16} className="text-indigo-400" />
                                                        : <div className="w-4 h-4 rounded-full border border-white/[0.08] bg-white/[0.02]" />}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'platform-settings' && (
                        <motion.div key="platform-settings" variants={stagger} initial="hidden" animate="show" className="max-w-3xl space-y-5">
                            <motion.div variants={fadeUp}>
                                <h2 className="text-xl font-black tracking-tight">Platform Configuration</h2>
                                <p className="text-slate-500 text-sm font-medium">Core system settings and behavior controls</p>
                            </motion.div>
                            {[
                                { section: 'General Settings', icon: Globe, fields: [{ label: 'Platform Name', val: 'DSAlytics', hint: 'Displayed across all interfaces' }, { label: 'Points Multiplier', val: '1.5x', hint: 'Score bonus for competitions' }] },
                                { section: 'Security', icon: Lock, fields: [{ label: 'Session Timeout', val: '24 Hours', hint: 'Auto-logout after inactivity' }, { label: 'Max Login Attempts', val: '5', hint: 'Before account lockout' }] },
                                { section: 'Integrations', icon: Activity, fields: [{ label: 'Webhook URL', val: '', hint: 'Receives system events' }, { label: 'API Rate Limit', val: '1000/hr', hint: 'Per-user request ceiling' }] },
                            ].map((s) => (
                                <motion.div key={s.section} variants={fadeUp} className="glass-card rounded-2xl" style={{ padding: '1.5rem' }}>
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.05]">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                            <s.icon size={15} />
                                        </div>
                                        <div className="font-black text-sm tracking-tight">{s.section}</div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {s.fields.map((f) => (
                                            <div key={f.label} className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{f.label}</label>
                                                <input type="text" defaultValue={f.val} placeholder={f.hint}
                                                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-600" />
                                                <p className="text-[9px] text-slate-600 font-medium">{f.hint}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                            <motion.div variants={fadeUp} className="flex justify-end gap-3">
                                <button className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 text-xs font-black uppercase tracking-wider hover:bg-white/[0.05] transition-all">
                                    Reset
                                </button>
                                <button className="px-8 py-3 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                                    Save Configuration
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div key="profile" variants={stagger} initial="hidden" animate="show" className="max-w-4xl space-y-5">
                            {/* Profile Hero */}
                            <motion.div variants={fadeUp} className="glass-card relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0.6) 100%)' }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/30">
                                            <img src={adminUser.avatarUrl ? `http://127.0.0.1:5000${adminUser.avatarUrl}` : 'https://github.com/shadcn.png'} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-1.5 -right-1.5 p-2 bg-indigo-500 rounded-xl border-2 border-black">
                                            <Shield size={12} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-2">
                                            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400">Level 4 Clearance</span>
                                            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">Active Session</span>
                                        </div>
                                        <h2 className="text-2xl font-black tracking-tight mb-1">{adminUser.name || 'System Administrator'}</h2>
                                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-sm font-medium">
                                            <Mail size={13} className="text-indigo-400" />
                                            {adminUser.email}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <motion.div variants={fadeUp} className="glass-card md:col-span-2 rounded-2xl space-y-6" style={{ padding: '1.5rem' }}>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Authorization Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Role', val: 'Super Admin' },
                                            { label: 'Node ID', val: 'DSA-MASTER-01' },
                                            { label: 'Region', val: 'Global' },
                                            { label: 'Since', val: 'Feb 2026' },
                                        ].map((d) => (
                                            <div key={d.label} className="glass-card p-4 rounded-xl" style={{ padding: '1rem' }}>
                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{d.label}</div>
                                                <div className="text-sm font-bold">{d.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">System Privileges</div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Database Access', 'User Termination', 'Broadcast Control', 'Security Management', 'API Master Key'].map((p) => (
                                                <span key={p} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-slate-400">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div variants={fadeUp} className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 space-y-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Security Checkpoint</div>
                                        <button className="w-full py-3 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Change Access Key</button>
                                        <button className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/[0.15] transition-all">Two-Factor Auth</button>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/15 space-y-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-red-400">Extreme Protocols</div>
                                        <button className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Terminate All Sessions</button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout >
    );
}
