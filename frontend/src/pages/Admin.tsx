import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout, getFullAvatarUrl } from '../components/DashboardLayout';
import { API_BASE_URL } from '../config';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { 
    Users, 
    Trophy, 
    Clock, 
    Activity, 
    Search, 
    Trash2, 
    CheckCircle2, 
    XCircle,
    Download,
    UserCheck,
    TrendingUp,
    Database,
    Eye,
    Edit,
    Shield,
    AlertTriangle,
    BarChart3,
    Mail,
    Calendar,
    Award,
    Zap,
    ArrowLeft,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'overview' | 'users' | 'requests' | 'analytics';

export default function Admin() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    
    // Data states
    const [stats, setStats] = useState({ totalUsers: 0, activeCompetitions: 0, pendingRequests: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Read tab from URL or default to overview
    const tabParam = searchParams.get('tab') as TabType;
    const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'overview');
    
    // User detail modal
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                
                console.log('=== ADMIN CHECK ===');
                console.log('User from localStorage:', user);
                console.log('College ID:', user?.collegeId);
                console.log('Expected Admin ID: 24J41A05HK');
                console.log('Is Match:', user?.collegeId === '24J41A05HK');
                console.log('===================');
                
                if (user && user.collegeId === '24J41A05HK') {
                    await fetchData();
                } else {
                    console.error('❌ ACCESS DENIED - Not admin!');
                    alert(`Access Denied!\n\nYour College ID: ${user?.collegeId || 'Unknown'}\nRequired: 24J41A05HK\n\nPlease login with admin account.`);
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error('Error:', error);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, [navigate]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        try {
            console.log('Fetching admin data...');
            const [usersRes, requestsRes] = await Promise.all([
                fetch(API_BASE_URL + '/api/admin/users?limit=100', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(API_BASE_URL + '/api/admin/requests', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            console.log('Users response status:', usersRes.status);
            console.log('Requests response status:', requestsRes.status);

            if (usersRes.ok) {
                const data = await usersRes.json();
                console.log('Users data received:', data);
                setUsers(data.users || []);
                setStats(prev => ({ ...prev, totalUsers: data.total || 0 }));
            } else {
                const errorText = await usersRes.text();
                console.error('Users fetch failed:', usersRes.status, errorText);
            }

            if (requestsRes.ok) {
                const data = await requestsRes.json();
                console.log('Requests data received:', data);
                setRequests(data || []);
                setStats(prev => ({ ...prev, pendingRequests: data.length || 0 }));
            } else {
                const errorText = await requestsRes.text();
                console.error('Requests fetch failed:', requestsRes.status, errorText);
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        }
    };

    const fetchUserDetails = async (userId: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setUserDetails(data);
                setShowUserModal(true);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchTerm(query);
        if (query.trim()) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/users?search=${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error('Search failed:', error);
            }
        } else {
            fetchData();
        }
    };

    const handleRequestAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(API_BASE_URL + '/api/admin/handle-request', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ requestId, status })
            });
            
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
                setStats(prev => ({ ...prev, pendingRequests: prev.pendingRequests - 1 }));
            }
        } catch (error) {
            console.error('Failed to handle request:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('⚠️ WARNING: This will permanently delete this user and all their data. Continue?')) return;
        
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
                alert('✅ User deleted successfully');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('❌ Failed to delete user');
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(API_BASE_URL + '/api/admin/export', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dsalytics-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                alert('✅ Data exported successfully!');
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('❌ Export failed');
        }
    };

    if (loading) {
        return (
            <DashboardLayout isAdminView={true}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm font-bold text-indigo-400 animate-pulse">Loading Admin Panel...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdminView={true}>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                
                {/* Header */}
                <PageHeader 
                    title="Admin Control Center"
                    description="Complete system management and user oversight"
                    icon={<Database size={28} />}
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-card p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                                <Users size={24} />
                            </div>
                            <TrendingUp size={20} className="text-indigo-400/50" />
                        </div>
                        <div className="text-3xl font-black mb-1">{stats.totalUsers}</div>
                        <div className="text-xs font-bold text-muted uppercase tracking-wider">Total Users</div>
                    </div>

                    <div className="glass-card p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                                <Clock size={24} />
                            </div>
                            <AlertTriangle size={20} className="text-amber-400/50" />
                        </div>
                        <div className="text-3xl font-black mb-1">{stats.pendingRequests}</div>
                        <div className="text-xs font-bold text-muted uppercase tracking-wider">Pending Requests</div>
                    </div>

                    <div className="glass-card p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                                <Activity size={24} />
                            </div>
                            <Zap size={20} className="text-emerald-400/50" />
                        </div>
                        <div className="text-3xl font-black mb-1">98%</div>
                        <div className="text-xs font-bold text-muted uppercase tracking-wider">System Health</div>
                    </div>

                    <button 
                        onClick={handleExport}
                        className="glass-card p-5 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 hover:scale-105 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 rounded-xl bg-violet-500/20 text-violet-400">
                                <Download size={24} />
                            </div>
                            <ArrowLeft size={20} className="text-violet-400/50 rotate-45" />
                        </div>
                        <div className="text-xl font-black mb-1">Export</div>
                        <div className="text-xs font-bold text-muted uppercase tracking-wider">Download Data</div>
                    </button>
                </div>

                {/* Tabs */}
                <div className="glass-card p-2 flex gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'users', label: `Users (${users.length})`, icon: Users },
                        { id: 'requests', label: 'Requests', icon: UserCheck, badge: stats.pendingRequests },
                        { id: 'analytics', label: 'Analytics', icon: Trophy }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 relative ${
                                activeTab === tab.id 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25' 
                                    : 'text-secondary hover:bg-elevated'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {tab.badge && tab.badge > 0 && (
                                <span className="absolute -top-1 -right-1 bg-warning text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Recent Users */}
                            <div className="glass-card p-6 bg-gradient-to-br from-slate-900/50 to-indigo-900/20">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-400">
                                    <Users size={24} />
                                    Recent Users
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {users.slice(0, 6).map((user) => (
                                        <div key={user.id} className="group p-4 rounded-xl bg-elevated/50 border border-border-color/30 hover:border-indigo-500/50 transition-all cursor-pointer"
                                             onClick={() => fetchUserDetails(user.id)}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-all">
                                                    <img 
                                                        src={user.avatarUrl ? (getFullAvatarUrl(user.avatarUrl) || '') : `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm truncate group-hover:text-indigo-400 transition-colors">{user.name}</div>
                                                    <div className="text-xs text-muted truncate">{user.collegeId}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted">{user.batch}</span>
                                                <span className="font-bold text-indigo-400">{user.totalPoints} pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pending Requests Preview */}
                            {requests.length > 0 && (
                                <div className="glass-card p-6 bg-gradient-to-br from-slate-900/50 to-amber-900/20">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black flex items-center gap-2 text-amber-400">
                                            <Clock size={24} />
                                            Pending Requests
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('requests')}
                                            className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all font-bold text-sm"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {requests.slice(0, 3).map((req) => (
                                            <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-elevated/50 border border-border-color/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface border border-border-color/30">
                                                        <img 
                                                            src={req.user.avatarUrl ? (getFullAvatarUrl(req.user.avatarUrl) || '') : `https://ui-avatars.com/api/?name=${req.user.name}&background=random`}
                                                            alt={req.user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{req.user.name}</div>
                                                        <div className="text-xs text-muted">{req.type}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'APPROVED')}
                                                        className="p-2 rounded-lg bg-success/10 text-success hover:bg-success hover:text-white transition-all"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'REJECTED')}
                                                        className="p-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-all"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <motion.div 
                            key="users"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search users by name, email, or college ID..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full glass-card pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>

                            {/* Users Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.length === 0 ? (
                                    <div className="col-span-full glass-card p-12 text-center text-muted">
                                        <Users size={64} className="mx-auto mb-4 opacity-30" />
                                        <p className="font-bold text-lg mb-2">No users found</p>
                                        <p className="text-sm">Try adjusting your search</p>
                                    </div>
                                ) : (
                                    users.map((user) => (
                                        <div key={user.id} className="glass-card p-5 hover:scale-105 transition-all cursor-pointer group"
                                             onClick={() => fetchUserDetails(user.id)}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-all">
                                                    <img 
                                                        src={user.avatarUrl ? (getFullAvatarUrl(user.avatarUrl) || '') : `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&size=128`}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteUser(user.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-error/10 text-muted hover:text-error transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <h4 className="font-black text-base mb-1 group-hover:text-indigo-400 transition-colors truncate">{user.name}</h4>
                                                <div className="text-xs text-muted space-y-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <Mail size={12} />
                                                        <span className="truncate">{user.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Shield size={12} />
                                                        <span>{user.collegeId}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2 rounded-lg bg-indigo-500/10">
                                                    <div className="text-muted mb-0.5">Points</div>
                                                    <div className="font-black text-indigo-400">{user.totalPoints}</div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-purple-500/10">
                                                    <div className="text-muted mb-0.5">Batch</div>
                                                    <div className="font-black text-purple-400">{user.batch}</div>
                                                </div>
                                            </div>

                                            <button className="w-full mt-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-bold text-xs flex items-center justify-center gap-2">
                                                <Eye size={14} />
                                                View Profile
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <motion.div 
                            key="requests"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {requests.length === 0 ? (
                                <div className="glass-card p-16 text-center">
                                    <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={40} className="text-success" />
                                    </div>
                                    <p className="font-black text-xl mb-2 text-success">All Caught Up!</p>
                                    <p className="text-sm text-muted">No pending profile change requests</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((req) => (
                                        <div key={req.id} className="glass-card p-6 bg-gradient-to-r from-slate-900/50 to-amber-900/10">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface border-2 border-amber-500/30">
                                                        <img 
                                                            src={req.user.avatarUrl ? (getFullAvatarUrl(req.user.avatarUrl) || '') : `https://ui-avatars.com/api/?name=${req.user.name}&background=random&size=128`}
                                                            alt={req.user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-black text-lg">{req.user.name}</h4>
                                                            <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold">{req.type}</span>
                                                        </div>
                                                        <div className="text-sm text-muted mb-3">{req.user.collegeId}</div>
                                                        
                                                        <div className="space-y-2">
                                                            <div className="p-3 rounded-lg bg-elevated/50">
                                                                <div className="text-xs text-muted mb-1">Current URL:</div>
                                                                <div className="text-xs font-mono break-all text-secondary">Not set</div>
                                                            </div>
                                                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                                                <div className="text-xs text-amber-400 mb-1 font-bold">Requested URL:</div>
                                                                <div className="text-xs font-mono break-all text-amber-300">{req.newUrl}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                                                            <Calendar size={12} />
                                                            {new Date(req.requestedAt).toLocaleDateString()} at {new Date(req.requestedAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'APPROVED')}
                                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-success to-emerald-600 text-white hover:shadow-lg hover:shadow-success/25 transition-all font-bold"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'REJECTED')}
                                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-error to-red-600 text-white hover:shadow-lg hover:shadow-error/25 transition-all font-bold"
                                                    >
                                                        <XCircle size={18} />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <motion.div 
                            key="analytics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-card p-6 text-center bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
                                    <Award size={48} className="mx-auto mb-3 text-indigo-400" />
                                    <div className="text-4xl font-black mb-2">{stats.totalUsers}</div>
                                    <div className="text-sm text-muted font-bold uppercase tracking-wider">Total Users</div>
                                </div>
                                <div className="glass-card p-6 text-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                                    <Trophy size={48} className="mx-auto mb-3 text-emerald-400" />
                                    <div className="text-4xl font-black mb-2">0</div>
                                    <div className="text-sm text-muted font-bold uppercase tracking-wider">Active Competitions</div>
                                </div>
                                <div className="glass-card p-6 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                                    <Zap size={48} className="mx-auto mb-3 text-amber-400" />
                                    <div className="text-4xl font-black mb-2">∞</div>
                                    <div className="text-sm text-muted font-bold uppercase tracking-wider">Total Submissions</div>
                                </div>
                            </div>

                            <div className="glass-card p-8 text-center">
                                <BarChart3 size={64} className="mx-auto mb-4 text-indigo-400/50" />
                                <h3 className="text-xl font-black mb-2">Advanced Analytics</h3>
                                <p className="text-muted mb-4">Detailed analytics and charts coming soon!</p>
                                <button className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all">
                                    Enable Analytics
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* User Detail Modal */}
                <AnimatePresence>
                    {showUserModal && userDetails && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowUserModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto styled-scrollbar"
                            >
                                {/* Modal Header */}
                                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-border-color/30 p-6 flex items-center justify-between z-10">
                                    <h2 className="text-2xl font-black flex items-center gap-2">
                                        <UserCheck size={28} className="text-indigo-400" />
                                        User Profile
                                    </h2>
                                    <button
                                        onClick={() => setShowUserModal(false)}
                                        className="p-2 rounded-xl hover:bg-error/10 text-muted hover:text-error transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 space-y-6">
                                    {/* User Info Card */}
                                    <div className="glass-card p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                        <div className="flex items-start gap-6">
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-indigo-500/30">
                                                <img 
                                                    src={userDetails.avatarUrl ? (getFullAvatarUrl(userDetails.avatarUrl) || '') : `https://ui-avatars.com/api/?name=${userDetails.name}&background=6366f1&color=fff&size=256`}
                                                    alt={userDetails.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-black mb-2">{userDetails.name}</h3>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={16} className="text-indigo-400" />
                                                        <span>{userDetails.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Shield size={16} className="text-purple-400" />
                                                        <span>{userDetails.collegeId}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-emerald-400" />
                                                        <span>Batch: {userDetails.batch}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Award size={16} className="text-amber-400" />
                                                        <span>{userDetails.department}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="glass-card p-4 text-center bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
                                            <div className="text-3xl font-black text-indigo-400 mb-1">{userDetails.totalPoints}</div>
                                            <div className="text-xs font-bold text-muted uppercase">Total Points</div>
                                        </div>
                                        <div className="glass-card p-4 text-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                                            <div className="text-3xl font-black text-emerald-400 mb-1">{userDetails.dailyStreak || 0}</div>
                                            <div className="text-xs font-bold text-muted uppercase">Day Streak</div>
                                        </div>
                                        <div className="glass-card p-4 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                                            <div className="text-3xl font-black text-amber-400 mb-1">{userDetails.submissions?.length || 0}</div>
                                            <div className="text-xs font-bold text-muted uppercase">Submissions</div>
                                        </div>
                                        <div className="glass-card p-4 text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                                            <div className="text-3xl font-black text-purple-400 mb-1">{userDetails.isAdmin ? 'Yes' : 'No'}</div>
                                            <div className="text-xs font-bold text-muted uppercase">Admin</div>
                                        </div>
                                    </div>

                                    {/* Recent Submissions */}
                                    {userDetails.submissions && userDetails.submissions.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-black mb-4 flex items-center gap-2 text-indigo-400">
                                                <Activity size={20} />
                                                Recent Submissions
                                            </h4>
                                            <div className="space-y-2">
                                                {userDetails.submissions.slice(0, 10).map((sub: any, idx: number) => (
                                                    <div key={idx} className="glass-card p-4 flex items-center justify-between">
                                                        <div>
                                                            <div className="font-bold text-sm mb-1">{sub.title || 'Unknown Problem'}</div>
                                                            <div className="text-xs text-muted">{sub.platform} • {sub.difficulty}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-success">{sub.statusDisplay}</div>
                                                            <div className="text-xs text-muted">{new Date(sub.dateSolved).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-border-color/30">
                                        <button
                                            onClick={() => {
                                                window.open(`/profile/${userDetails.id}`, '_blank');
                                            }}
                                            className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Eye size={18} />
                                            Visit Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDeleteUser(userDetails.id);
                                                setShowUserModal(false);
                                            }}
                                            className="flex-1 py-3 rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all font-bold flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            Delete User
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
