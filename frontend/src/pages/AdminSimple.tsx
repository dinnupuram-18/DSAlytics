import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { API_BASE_URL } from '../config';
import { Users, Clock, Download, Search, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                
                console.log('Current user:', user);
                
                if (user && user.collegeId === '24J41A05HK') {
                    await fetchUsers();
                } else {
                    console.error('Not admin! College ID:', user?.collegeId);
                    alert('Access Denied: Admin privileges required');
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

    const fetchUsers = async (search = '') => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token!');
            return;
        }

        try {
            console.log('Fetching users...');
            const url = search 
                ? `${API_BASE_URL}/api/admin/users?search=${search}`
                : `${API_BASE_URL}/api/admin/users?limit=100`;
            
            console.log('URL:', url);
            
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Fetch failed:', res.status, errorText);
                alert(`Error: ${res.status} - ${errorText}`);
                return;
            }

            const data = await res.json();
            console.log('Data received:', data);
            console.log('Users count:', data.users?.length);
            console.log('Total:', data.total);
            
            setUsers(data.users || []);
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to fetch users. Check console for details.');
        }
    };

    const handleSearch = (query: string) => {
        setSearchTerm(query);
        fetchUsers(query);
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!window.confirm(`⚠️ Delete user "${userName}"? This cannot be undone!`)) return;
        
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                alert('✅ User deleted');
                fetchUsers(searchTerm);
            } else {
                alert('❌ Failed to delete user');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('❌ Error deleting user');
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                alert('✅ Data exported!');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('❌ Export failed');
        }
    };

    if (loading) {
        return (
            <DashboardLayout isAdminView={true}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm font-bold text-indigo-400">Loading...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdminView={true}>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black mb-2">Admin Panel</h1>
                        <p className="text-muted">Manage users and system</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                    >
                        <Download size={20} />
                        Export Data
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                        <div className="flex items-center justify-between mb-3">
                            <Users size={32} className="text-indigo-400" />
                        </div>
                        <div className="text-4xl font-black mb-1">{users.length}</div>
                        <div className="text-xs font-bold text-muted uppercase tracking-wider">Total Users</div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or college ID..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full glass-card pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>

                {/* Users List */}
                {users.length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <Users size={64} className="mx-auto mb-4 opacity-30 text-muted" />
                        <p className="font-black text-xl mb-2">No users found</p>
                        <p className="text-sm text-muted">Try adjusting your search or check backend connection</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map((user) => (
                            <motion.div 
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-5 hover:scale-105 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface border-2 border-indigo-500/30">
                                        <img 
                                            src={user.avatarUrl ? `${API_BASE_URL}${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&size=128`}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                        className="p-2 rounded-lg hover:bg-error/10 text-muted hover:text-error transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                
                                <div className="mb-3">
                                    <h4 className="font-black text-base mb-1 truncate">{user.name}</h4>
                                    <div className="text-xs text-muted space-y-0.5">
                                        <div>{user.email}</div>
                                        <div>{user.collegeId}</div>
                                        <div>{user.batch} • {user.department}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2 rounded-lg bg-indigo-500/10">
                                        <div className="text-muted mb-0.5">Points</div>
                                        <div className="font-black text-indigo-400">{user.totalPoints}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                        <div className="text-muted mb-0.5">Streak</div>
                                        <div className="font-black text-emerald-400">{user.dailyStreak || 0}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
