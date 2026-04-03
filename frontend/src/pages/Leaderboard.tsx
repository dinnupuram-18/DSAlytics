import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { PageHeader } from '../components/PageHeader';
import { Search, Filter, UserCircle2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const API = 'http://127.0.0.1:5000';

// Friend button states: none | pending | accepted | self
const FriendButton = ({ targetId, currentUserId }: { targetId: string; currentUserId: string }) => {
    const [status, setStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'loading' | 'sending'>('loading');
    const [requestId, setRequestId] = useState<string | null>(null);

    useEffect(() => {
        if (targetId === currentUserId) { setStatus('accepted'); return; }
        const token = localStorage.getItem('token');
        fetch(`${API}/api/friends/status/${targetId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                if (d.status === 'none') setStatus('none');
                else if (d.status === 'accepted') setStatus('accepted');
                else if (d.status === 'pending' && d.isSender) { setStatus('pending_sent'); setRequestId(d.requestId); }
                else if (d.status === 'pending') { setStatus('pending_received'); setRequestId(d.requestId); }
            })
            .catch(() => setStatus('none'));
    }, [targetId]);

    const sendRequest = async () => {
        setStatus('sending');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/friends/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ receiverId: targetId })
            });
            if (res.ok) setStatus('pending_sent');
            else setStatus('none');
        } catch { setStatus('none'); }
    };

    const respond = async (action: 'accepted' | 'rejected') => {
        if (!requestId) return;
        const token = localStorage.getItem('token');
        await fetch(`${API}/api/friends/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ requestId, action })
        });
        setStatus(action === 'accepted' ? 'accepted' : 'none');
    };

    const cancelRequest = async () => {
        if (!requestId) return;
        setStatus('sending');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/friends/cancel/${requestId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setStatus('none');
            else setStatus('pending_sent');
        } catch { setStatus('pending_sent'); }
    };

    const unfriendUser = async () => {
        if (!requestId) return;
        setStatus('sending');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/friends/unfriend/${requestId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setStatus('none');
            else setStatus('accepted');
        } catch { setStatus('accepted'); }
    };

    if (targetId === currentUserId) return null;

    if (status === 'loading') return <div style={{ width: 80, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', animation: 'shimmer 1.5s infinite' }} />;

    if (status === 'accepted') return (
        <button
            onClick={unfriendUser}
            title="Unfriend"
            style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.07)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s', minWidth: 70 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.textContent = '✗ Unfriend'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.07)'; e.currentTarget.style.color = 'var(--success)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.2)'; e.currentTarget.textContent = '✓ Friends'; }}
        >
            ✓ Friends
        </button>
    );

    if (status === 'pending_sent') return (
        <button
            onClick={cancelRequest}
            title="Cancel friend request"
            style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.07)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.textContent = '✕ Unsend'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.textContent = '⏱ Sent'; }}
        >
            ⏱ Sent
        </button>
    );

    if (status === 'pending_received') return (
        <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => respond('accepted')} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Accept</button>
            <button onClick={() => respond('rejected')} style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
    );

    return (
        <button
            onClick={sendRequest}
            disabled={status === 'sending'}
            style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
        >
            <UserPlus size={12} /> {status === 'sending' ? '...' : 'Add Friend'}
        </button>
    );
};

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overall' | 'batch'>('overall');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');
    const [timeframe, setTimeframe] = useState<'overall' | 'weekly' | 'monthly'>('overall');

    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                if (activeTab === 'batch') {
                    // "My Batch" = Friends leaderboard
                    const [friendsRes, selfRes] = await Promise.all([
                        fetch(`${API}/api/friends/list`, { headers: { Authorization: `Bearer ${token}` } }),
                        fetch(`${API}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);
                    if (friendsRes.ok && selfRes.ok) {
                        const friends = await friendsRes.json();
                        const self = await selfRes.json();
                        const combined = [...friends, { ...self, isSelf: true }];
                        combined.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
                        setLeaderboard(combined);
                    }
                    return;
                }

                let url = `${API}/api/leaderboard/overall`;
                const params = new URLSearchParams();
                if (branch) params.append('branch', branch);
                if (year) params.append('year', year);
                if (timeframe !== 'overall') params.append('timeframe', timeframe);
                url += `?${params.toString()}`;

                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) setLeaderboard(await res.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [activeTab, branch, year, timeframe]);

    const filteredList = leaderboard.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.collegeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const topThree = filteredList.slice(0, 3);
    const others = filteredList.slice(3);

    const containerVariants: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants: any = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

    return (
        <DashboardLayout>
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}>
                    <PageHeader title="Leaderboard" description="Platform performance rankings." icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
                            <circle cx="12" cy="8" r="7" />
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                        </svg>
                    } />
                </motion.div>

                {/* Rank Filters & Search */}
                <motion.div variants={itemVariants} className="flex gap-4 mb-8 flex-wrap items-center">
                    <div className="flex gap-1 p-1 glass-card" style={{ padding: '0.25rem', borderRadius: '12px' }}>
                        <button className={`btn text-sm ${activeTab === 'overall' ? 'btn-primary' : ''}`} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', background: activeTab !== 'overall' ? 'transparent' : '' }} onClick={() => setActiveTab('overall')}>Global</button>
                        <button className={`btn text-sm ${activeTab === 'batch' ? 'btn-primary' : ''}`} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', background: activeTab !== 'batch' ? 'transparent' : '' }} onClick={() => setActiveTab('batch')}>My Friends</button>
                    </div>

                    <div className="flex glass-card items-center gap-2" style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '12px' }}>
                        <Search size={18} className="text-secondary" />
                        <input type="text" placeholder="Search student by name or ID..." className="w-full" style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    {activeTab === 'overall' && (
                        <button className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '12px' }} onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={18} /> Filters
                        </button>
                    )}
                </motion.div>

                {showFilters && activeTab === 'overall' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-8 p-4 flex gap-4 flex-wrap">
                        <div className="flex-col gap-1" style={{ flex: 1, minWidth: '150px' }}>
                            <label className="text-[10px] uppercase font-bold text-muted tracking-widest">Branch</label>
                            <select className="input-field" value={branch} onChange={e => setBranch(e.target.value)} style={{ padding: '0.5rem', height: '40px' }}>
                                <option value="">All Branches</option>
                                <option value="CSE">CSE</option>
                                <option value="IT">IT</option>
                                <option value="ECE">ECE</option>
                            </select>
                        </div>
                        <div className="flex-col gap-1" style={{ flex: 1, minWidth: '150px' }}>
                            <label className="text-[10px] uppercase font-bold text-muted tracking-widest">Year</label>
                            <select className="input-field" value={year} onChange={e => setYear(e.target.value)} style={{ padding: '0.5rem', height: '40px' }}>
                                <option value="">All Years</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                        <div className="flex-col gap-1" style={{ flex: 1, minWidth: '150px' }}>
                            <label className="text-[10px] uppercase font-bold text-muted tracking-widest">Timeframe</label>
                            <select className="input-field" value={timeframe} onChange={e => setTimeframe(e.target.value as any)} style={{ padding: '0.5rem', height: '40px' }}>
                                <option value="overall">Overall Total</option>
                                <option value="monthly">Monthly Gain</option>
                                <option value="weekly">Weekly Gain</option>
                            </select>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'batch' && !loading && leaderboard.length === 0 && (
                    <motion.div variants={itemVariants} className="glass-card text-center py-16">
                        <UserPlus size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.4 }} />
                        <p style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No friends yet!</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Go to Global tab and add friends to see them here.</p>
                    </motion.div>
                )}

                {loading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-secondary">Fetching rankings...</motion.div>
                ) : (
                    <>
                        {/* Podium Section */}
                        {topThree.length > 0 && (
                            <motion.div variants={itemVariants} className="podium-container">
                                {topThree.map((student, idx) => (
                                    <motion.div whileHover={{ y: -8, scale: 1.02 }} key={student.id} className={`glass-card podium-card rank-${idx + 1}`}>
                                        <div className="avatar-wrapper">
                                            <div className="avatar-large flex items-center justify-center bg-elevated shadow-inner overflow-hidden">
                                                {student.avatarUrl ? (
                                                    <img src={`${API}${student.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle2 size={64} className="text-muted/50" />
                                                )}
                                            </div>
                                            <div className="rank-badge-float font-black shadow-lg">{idx + 1}</div>
                                        </div>
                                        <div className="text-center mb-1 mt-3">
                                            <div className="font-black text-xl tracking-tight leading-tight">{student.name.split(' ')[0]}</div>
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1">{student.collegeId}</div>
                                            <div className="flex items-center justify-center gap-2 mt-2">
                                                <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-black text-gradient mt-3">{student.displayPoints || student.totalPoints || 0}</div>
                                        <div className="text-[9px] text-muted uppercase tracking-[0.3em] font-black mt-1">Total Points</div>
                                        <div className="stat-grid-mini">
                                            <StatMini icon="LC" val={student.leetcodePoints || 0} color="#fb923c" />
                                            <StatMini icon="CC" val={student.codechefPoints || 0} color="#94a3b8" />
                                            <StatMini icon="CF" val={student.codeforcesPoints || 0} color="#6366f1" />
                                            <StatMini icon="GFG" val={student.gfgPoints || 0} color="#22c55e" />
                                        </div>
                                        {currentUser && (
                                            <div style={{ marginTop: '1rem' }}>
                                                <FriendButton targetId={student.id} currentUserId={currentUser.id} />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Others List */}
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="ranking-list-container mt-8">
                            {/* Table Header */}
                            <div className="px-6 text-[11px] font-black text-muted uppercase tracking-[0.25em] mb-4 pb-3" style={{ display: 'grid', gridTemplateColumns: 'minmax(60px, 80px) 1fr minmax(80px, 120px) minmax(80px, 120px) minmax(80px, 100px)', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                                <div className="text-center">Rank</div>
                                <div>Student</div>
                                <div className="text-center hidden sm:block">Solved</div>
                                <div className="text-right">Total Pts</div>
                                <div className="text-center">Action</div>
                            </div>

                            {others.length === 0 && topThree.length === 0 ? (
                                <div className="glass-card text-center py-12 text-secondary">No coders found matching your search.</div>
                            ) : others.map((student, index) => (
                                <motion.div
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                                    key={student.id}
                                    className="glass-card px-6 py-4 mb-3 transition-all duration-300"
                                    style={{ display: 'grid', gridTemplateColumns: 'minmax(60px, 80px) 1fr minmax(80px, 120px) minmax(80px, 120px) minmax(80px, 100px)', gap: '1rem', alignItems: 'center', borderRadius: '16px', border: '1px solid var(--border-color)' }}
                                >
                                    {/* Rank */}
                                    <div className="text-center font-black text-2xl italic" style={{ color: 'var(--text-muted)' }}>
                                        #{index + 4}
                                    </div>

                                    {/* Student Info */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="rounded-full bg-main border border-border-color overflow-hidden flex-shrink-0" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {student.avatarUrl ? (
                                                <img src={`${API}${student.avatarUrl}`} alt="Avatar" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                                            ) : (
                                                <UserCircle2 size={24} className="text-secondary opacity-70" />
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <div className="font-bold text-[15px] truncate text-primary">{student.name}</div>
                                            <div className="text-[10px] font-semibold text-secondary mt-1 tracking-wider uppercase flex items-center gap-2">
                                                {student.collegeId} <span className="text-muted mx-1">•</span> {student.batch || '2024'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Problems Solved */}
                                    <div className="hidden sm:flex justify-center items-center">
                                        <div className="bg-elevated px-4 py-1.5 rounded-full border border-border-color text-xs font-bold text-secondary">
                                            {student.totalSolved || student.stats?.totalSolved || 0}
                                        </div>
                                    </div>

                                    {/* Total Points */}
                                    <div className="flex justify-end items-center">
                                        <div className="font-black text-2xl" style={{ color: 'var(--accent-primary)' }}>
                                            {student.displayPoints || student.totalPoints || 0}
                                        </div>
                                    </div>

                                    {/* Action (Friend Button) */}
                                    <div className="flex justify-center items-center">
                                        {currentUser ? <FriendButton targetId={student.id} currentUserId={currentUser.id} /> : <div />}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}
            </motion.div>
        </DashboardLayout>
    );
}

const StatMini = ({ icon, val, color }: any) => (
    <div className="stat-chip-pill">
        <span style={{ color, fontWeight: 800 }}>{icon}</span>
        <span className="font-bold">{val}</span>
    </div>
);
