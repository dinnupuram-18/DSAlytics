import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { Award, Zap, UserCircle2, ChevronRight, ShieldCheck, Code2, LayoutDashboard, CheckCircle2, Clock, Sparkles, ExternalLink, Swords, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [topCoders, setTopCoders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [challengeToast, setChallengeToast] = useState<string | null>(null);

    // Task of the Day State
    const [dailyTask, setDailyTask] = useState<any>(null);
    const [taskEligibilityReason, setTaskEligibilityReason] = useState<string | null>(null);
    const [taskJustCompleted, setTaskJustCompleted] = useState(false);

    // Challenges State
    const [receivedChallenges, setReceivedChallenges] = useState<any[]>([]);


    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const [profRes, leadRes, chalRes] = await Promise.all([
                    fetch('http://127.0.0.1:5000/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://127.0.0.1:5000/api/leaderboard/overall', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://127.0.0.1:5000/api/challenge/received', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                // Token expired or invalid → go to login
                if (profRes.status === 401 || profRes.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                    return;
                }

                if (profRes.ok) {
                    const profileData = await profRes.json();
                    setProfile(profileData);
                    if (profileData.avatarUrl) {
                        localStorage.setItem('avatarUrl', profileData.avatarUrl);
                    } else {
                        localStorage.removeItem('avatarUrl');
                    }
                }
                if (leadRes.ok) {
                    const data = await leadRes.json();
                    setTopCoders(data.slice(0, 3));
                }
                if (chalRes.ok) {
                    const data = await chalRes.json();
                    setReceivedChallenges(data);
                }

                // Fetch Daily Task
                try {
                    const response = await fetch('http://127.0.0.1:5000/api/task/today', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.reason) {
                        setTaskEligibilityReason(data.reason);
                    } else if (data.task) {
                        setDailyTask(data.task);
                    }
                } catch (e) {
                    console.error("Failed to load daily task", e);
                }

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // Auto-completion polling: check every 60s if user solved the task on LeetCode
    useEffect(() => {
        if (!dailyTask || dailyTask.completed) return;
        const token = localStorage.getItem('token');
        const poll = async () => {
            try {
                const res = await fetch('http://127.0.0.1:5000/api/task/check-completion', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.completed) {
                    setDailyTask((prev: any) => prev ? { ...prev, completed: true } : null);
                    setTaskJustCompleted(true);
                    setProfile((prev: any) => prev ? { ...prev, totalPoints: data.newTotalPoints } : null);
                    setChallengeToast('🎉 Task Auto-Completed! +10 Points Earned!');
                    setTimeout(() => setChallengeToast(null), 4000);
                }
            } catch { /* silent */ }
        };
        const interval = setInterval(poll, 60000);
        return () => clearInterval(interval);
    }, [dailyTask]);

    if (loading) return (
        <DashboardLayout>
            <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                {/* Header skeleton */}
                <div style={{ height: '80px', borderRadius: '16px', background: 'var(--bg-elevated)', marginBottom: '2rem', opacity: 0.5 }} />
                {/* Stat cards skeleton */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ flex: 1, height: '100px', borderRadius: '16px', background: 'var(--bg-elevated)', opacity: 0.5 }} />
                    ))}
                </div>
                {/* Main content skeleton */}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ height: '180px', borderRadius: '16px', background: 'var(--bg-elevated)', opacity: 0.5 }} />
                        <div style={{ height: '200px', borderRadius: '16px', background: 'var(--bg-elevated)', opacity: 0.5 }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ height: '200px', borderRadius: '16px', background: 'var(--bg-elevated)', opacity: 0.5 }} />
                        <div style={{ height: '120px', borderRadius: '16px', background: 'var(--bg-elevated)', opacity: 0.5 }} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
    if (!profile) return <DashboardLayout><div className="flex justify-center mt-20 text-danger font-bold">Session expired. Please login again.</div></DashboardLayout>;

    // Extract real analytics from profile
    const analytics = {
        masteryScore: profile.leetcodePoints > 0 ? Math.min(Math.round((profile.leetcodePoints / 5000) * 100), 100) : 0,
        weakTopics: profile.topicStats ? Object.entries(profile.topicStats as Record<string, number>)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 3)
            .map(([topic]) => topic) : ['None'],
        recommendation: profile.leetcodePoints > 2000
            ? "You have a solid foundation! Focus on Hard problems to reach Top 1%."
            : "Focus on High-Impact topics like Graphs and DP to improve your score."
    };

    const handleSync = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/sync/fetch-leetcode', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile((prev: any) => ({ ...prev, leetcodePoints: data.leetcodePoints || data.totalPoints }));
                alert('Stats synced successfully!');
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChallengeClick = async (sub: any) => {
        try {
            const token = localStorage.getItem('token');
            const receiverIds = topCoders
                 .filter(coder => coder.id !== profile?.id)
                 .map(coder => coder.id);

            if (receiverIds.length === 0) {
                 setChallengeToast('No other friends on leaderboard to challenge!');
                 setTimeout(() => setChallengeToast(null), 3000);
                 return;
            }

            const response = await fetch('http://127.0.0.1:5000/api/challenge/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiverIds,
                    problemName: sub.title,
                    problemURL: `https://leetcode.com/problems/${sub.titleSlug}`,
                    difficulty: 'Medium' // Defaulting to medium for synced recent submissions
                })
            });

            if (response.ok) {
                setChallengeToast('Challenge auto-sent to Leaderboard friends! 🎯');
                setTimeout(() => setChallengeToast(null), 3000);
            } else {
                setChallengeToast('Failed to send challenge ❌');
                setTimeout(() => setChallengeToast(null), 3000);
            }
        } catch(e) {
             console.error(e);
        }
    };

    const markChallengeDone = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:5000/api/challenge/${id}/complete`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setChallengeToast('Challenge Marked as Done! +10 Pts');
                setTimeout(() => setChallengeToast(null), 3500);
                
                // Update local state
                setReceivedChallenges(prev => prev.map(c => c.id === id ? { ...c, status: 'COMPLETED' } : c));
                setProfile((prev: any) => ({ ...prev, totalPoints: prev.totalPoints + 10 }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const refetchChallenges = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/challenge/received', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReceivedChallenges(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <DashboardLayout>
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}>
                    <PageHeader
                        title={`Welcome back, ${profile.name.split(' ')[0]}! 👋`}
                        description={`${profile.department} • Batch ${profile.batch}`}
                        icon={<LayoutDashboard size={24} />}
                    />
                </motion.div>

                <motion.div variants={itemVariants} className="flex gap-4 flex-wrap mb-8">
                    <motion.div whileHover={{ y: -5 }} className="hover-lift" style={{ flex: 1, minWidth: '200px' }}>
                        <StatCard title="LeetCode Points" value={profile.leetcodePoints || 0} icon={Award} color="251, 146, 60" />
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="hover-lift" style={{ flex: 1, minWidth: '200px' }}>
                        <StatCard title="Daily Streak" value={`${profile.dailyStreak} Days`} icon={Zap} color="245, 158, 11" />
                    </motion.div>
                </motion.div>

                <div className="flex gap-6 flex-wrap">
                    {/* Visual Performance Stats - Left Column */}
                    <div style={{ flex: '2 1 600px' }} className="flex-col gap-6">
                        {/* Interview Readiness Section */}
                        <motion.div variants={itemVariants} className="glass-card hover-lift" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)', marginBottom: '1.5rem' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <ShieldCheck size={24} className="text-success" /> Interview Readiness
                                </h3>
                                <button className="btn text-xs btn-primary py-2 px-4 rounded-xl" onClick={() => navigate('/analytics')}>View Topic Insights</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="flex-col gap-4">
                                    <div className="p-5 bg-elevated rounded-2xl border border-border-color">
                                        <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Priority Focus Topics</div>
                                        <div className="flex flex-wrap gap-2">
                                            {analytics.weakTopics.map(t => (
                                                <span key={t} className="badge badge-hard" style={{ fontSize: '10px' }}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 flex-col justify-center items-center p-5 bg-main rounded-2xl border border-border-color" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="text-4xl font-black text-primary drop-shadow-sm">{profile.stats?.totalSolved || 0}</div>
                                        <div className="text-[9px] uppercase font-bold text-secondary tracking-widest mt-2 px-3 py-1.5 rounded-md" style={{ background: 'rgba(0,0,0,0.05)' }}>Problems</div>
                                    </div>
                                    <div className="flex-1 flex-col justify-center items-center p-5 bg-main rounded-2xl border border-border-color" style={{ background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.05), transparent)' }}>
                                        <div className="text-4xl font-black text-danger drop-shadow-sm">{analytics.weakTopics.length}</div>
                                        <div className="text-[9px] uppercase font-bold text-secondary tracking-widest mt-2 px-3 py-1.5 rounded-md" style={{ background: 'rgba(0,0,0,0.05)' }}>Skill Gaps</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Coding Performance Section */}
                        <motion.div variants={itemVariants} className="coding-performance-card glass-card hover-lift">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                                <Code2 size={24} className="text-accent-primary" /> Coding Performance
                            </h3>
                            <div className="flex-col gap-5">
                                <ProgressRow label="LeetCode" current={profile.leetcodePoints || 0} max={6000} colorClass="progress-leetcode" url={profile.leetcodeUrl} />
                                <ProgressRow label="CodeChef" current={profile.codechefPoints || 0} max={2500} colorClass="progress-codechef" url={profile.codechefUrl} />
                                <ProgressRow label="CodeForces" current={profile.codeforcesPoints || 0} max={2500} colorClass="progress-codeforces" url={profile.codeforcesUrl} />
                                <ProgressRow label="GeeksforGeeks" current={profile.gfgPoints || 0} max={3000} colorClass="progress-gfg" url={profile.gfgUrl} />
                                <ProgressRow label="GitHub" current={profile.githubPoints || 0} max={1500} colorClass="progress-codeforces" url={profile.githubUrl} />
                                <ProgressRow label="HackerRank" current={profile.hackerrankPoints || 0} max={2500} colorClass="progress-hackerrank" url={profile.hackerrankUrl} />
                            </div>
                        </motion.div>

                        {/* Smart Task of the Day – Redesigned */}
                        <motion.div variants={itemVariants} className="glass-card hover-lift mt-6" style={{
                            position: 'relative',
                            overflow: 'hidden',
                            background: dailyTask?.completed
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.07), transparent)'
                                : undefined,
                            border: dailyTask?.completed
                                ? '1px solid rgba(16,185,129,0.25)'
                                : undefined,
                        }}>
                            {/* Glowing orb bg decoration */}
                            <div style={{
                                position: 'absolute', top: '-40px', right: '-40px',
                                width: '120px', height: '120px', borderRadius: '50%',
                                background: dailyTask?.completed ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.07)',
                                filter: 'blur(40px)', pointerEvents: 'none'
                            }} />

                            {/* Header row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <span style={{ fontSize: '1.2rem' }}>🎯</span>
                                    Smart Task of the Day
                                </h3>
                                {!dailyTask?.completed && dailyTask && (
                                    <span style={{
                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                                        textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px',
                                        background: 'var(--bg-elevated)',
                                        color: 'var(--text-muted)', border: '1px solid var(--border-color)'
                                    }}>🔁 Revision Task</span>
                                )}
                            </div>

                            {taskEligibilityReason && !dailyTask ? (
                                <div style={{
                                    padding: '14px 18px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '14px',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>🔒</span> {taskEligibilityReason}
                                </div>
                            ) : dailyTask ? (
                                dailyTask.completed ? (
                                    /* ── COMPLETED STATE ── */
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            gap: '10px', padding: '1.5rem 1rem', textAlign: 'center'
                                        }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: [0, 1.3, 1] }}
                                            transition={{ delay: 0.15, duration: 0.5, ease: 'backOut' }}
                                        >
                                            <CheckCircle2 size={52} style={{ color: '#10b981', filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.5))' }} />
                                        </motion.div>
                                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>Completed on LeetCode!</div>
                                        <a href={dailyTask.questionUrl} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {dailyTask.questionTitle} <ExternalLink size={12} />
                                        </a>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            marginTop: '4px', padding: '8px 20px', borderRadius: '30px',
                                            background: 'linear-gradient(90deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))',
                                            border: '1px solid rgba(16,185,129,0.4)'
                                        }}>
                                            <Sparkles size={14} style={{ color: '#10b981' }} />
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', letterSpacing: '0.05em' }}>+10 Points Earned</span>
                                        </div>
                                        {taskJustCompleted && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                Leaderboard rank updating...
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    /* ── ACTIVE TASK STATE ── */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {/* Badges row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            {/* Difficulty badge */}
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '20px',
                                                fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                                                background: dailyTask.difficulty === 'Hard'
                                                    ? 'linear-gradient(90deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))'
                                                    : dailyTask.difficulty === 'Medium'
                                                        ? 'linear-gradient(90deg, rgba(245,158,11,0.22), rgba(217,119,6,0.15))'
                                                        : 'linear-gradient(90deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))',
                                                color: dailyTask.difficulty === 'Hard' ? '#ef4444'
                                                    : dailyTask.difficulty === 'Medium' ? '#f59e0b' : '#10b981',
                                                border: `1px solid ${dailyTask.difficulty === 'Hard' ? 'rgba(239,68,68,0.4)'
                                                    : dailyTask.difficulty === 'Medium' ? 'rgba(245,158,11,0.4)'
                                                        : 'rgba(16,185,129,0.4)'}`,
                                            }}>
                                                {dailyTask.difficulty === 'Hard' ? '🔥' : dailyTask.difficulty === 'Medium' ? '⚡' : '✅'} {dailyTask.difficulty}
                                            </span>
                                            {/* Topic badge */}
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '20px',
                                                fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                                                background: 'rgba(99,102,241,0.12)',
                                                color: 'var(--accent-primary)',
                                                border: '1px solid rgba(99,102,241,0.28)'
                                            }}>
                                                {dailyTask.topic}
                                            </span>
                                        </div>

                                        {/* Problem title */}
                                        <a href={dailyTask.questionUrl} target="_blank" rel="noopener noreferrer"
                                            style={{
                                                fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em',
                                                color: 'var(--accent-primary)', textDecoration: 'none',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                        >
                                            {dailyTask.questionTitle}
                                            <ExternalLink size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
                                        </a>

                                        {/* Meta row: time + reward */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)'
                                            }}>
                                                <Clock size={12} />
                                                ~{dailyTask.estimatedMinutes || (dailyTask.difficulty === 'Hard' ? 60 : dailyTask.difficulty === 'Medium' ? 30 : 15)} min
                                            </span>
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                fontSize: '11px', fontWeight: 800,
                                                color: '#f59e0b'
                                            }}>
                                                <Sparkles size={12} />
                                                +10 Bonus Points
                                            </span>
                                        </div>

                                        {/* Auto-detect hint */}
                                        <div style={{
                                            marginTop: '4px',
                                            padding: '10px 14px',
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            fontSize: '11px', fontWeight: 600,
                                            color: 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            <span style={{ fontSize: '14px' }}>🤖</span>
                                            Solve this on LeetCode — we'll auto-detect your completion!
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div style={{
                                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em',
                                    textTransform: 'uppercase', color: 'var(--text-muted)',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                }}>Loading today's task...</div>
                            )}
                        </motion.div>

                        {/* Challenged Questions */}
                        <motion.div variants={itemVariants} className="glass-card hover-lift mt-6">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <Swords size={24} className="text-accent-primary" /> Challenged Questions
                            </h3>
                            <div className="flex-col gap-4">
                                {receivedChallenges.length > 0 ? (
                                    receivedChallenges.map((challenge: any) => (
                                        <div key={challenge.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-elevated/50 border border-border-color/30" style={{ gap: '1rem' }}>
                                            <div className="flex-col gap-1" style={{ flex: 1 }}>
                                                <div className="flex items-center gap-2">
                                                    <div style={{ width: '24px', height: '24px', minWidth: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        {challenge.sender.avatarUrl ? (
                                                            <img src={`http://127.0.0.1:5000${challenge.sender.avatarUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <UserCircle2 size={24} className="text-secondary opacity-70" />
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                                                        {challenge.sender.name} challenged you
                                                    </div>
                                                </div>
                                                <a href={challenge.problemURL} target="_blank" rel="noopener noreferrer" className="font-bold text-[15px] hover:text-accent-primary transition-colors hover:underline block w-max">
                                                    {challenge.problemName} <ExternalLink size={12} className="inline opacity-50 relative -top-[1px]" />
                                                </a>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                                                        challenge.difficulty === 'Hard' ? 'text-danger border-danger/30 bg-danger/10' :
                                                        challenge.difficulty === 'Medium' ? 'text-warning border-warning/30 bg-warning/10' :
                                                        'text-success border-success/30 bg-success/10'
                                                    }`}>{challenge.difficulty}</span>
                                                    <span className="text-[10px] text-muted font-medium ml-1">
                                                        {new Date(challenge.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {challenge.status === 'COMPLETED' ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg text-success font-bold text-xs uppercase tracking-wider">
                                                        <CheckCircle2 size={16} /> Completed
                                                    </div>
                                                ) : (
                                                    <>
                                                        <a 
                                                            href={challenge.problemURL} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="btn font-bold text-xs flex items-center gap-1 hover:bg-white/5 px-4 py-2 rounded-xl transition-all border border-border-color"
                                                        >
                                                            Solve <ExternalLink size={14} />
                                                        </a>
                                                        <button 
                                                            onClick={() => markChallengeDone(challenge.id)}
                                                            className="btn border border-success/40 text-success font-bold text-xs bg-success/10 hover:bg-success hover:text-white px-4 py-2 rounded-xl transition-all"
                                                        >
                                                            <Check size={16} /> Mark Done
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-elevated/30 rounded-2xl border border-white/5 border-dashed">
                                        <div className="text-4xl mb-3 opacity-50">🎮</div>
                                        <div className="text-secondary font-bold text-sm tracking-wide">No challenges received yet.</div>
                                        <div className="text-muted text-xs mt-1">Challenge a friend to start a battle!</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Recent LeetCode Submissions */}
                        <motion.div variants={itemVariants} className="glass-card hover-lift mt-6" style={{ position: 'relative' }}>
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <ChevronRight size={24} className="text-accent-primary" /> Recent LeetCode Activity
                            </h3>
                            {/* Challenge toast */}
                            <AnimatePresence>
                                {challengeToast && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(99,102,241,0.2)', zIndex: 10 }}
                                    >
                                        ⚡ {challengeToast}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="flex flex-col gap-4 overflow-y-auto pr-2 styled-scrollbar max-h-[300px]">
                                {profile.stats?.recentSubmission && (profile.stats.recentSubmission as any[]).length > 0 ? (
                                    (profile.stats.recentSubmission as any[]).slice(0, 50).map((sub: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-elevated/50 border border-border-color/30" style={{ gap: '1rem' }}>
                                            <div className="flex-col" style={{ flex: 1 }}>
                                                <div className="font-bold text-sm">{sub.title}</div>
                                                <div className="text-[10px] text-muted uppercase font-bold tracking-widest">{sub.lang} • {sub.statusDisplay}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                                <div className="text-[10px] text-secondary font-medium">
                                                    {new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString()}
                                                </div>
                                                <button
                                                    onClick={() => handleChallengeClick(sub)}
                                                    style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                                                >
                                                    ⚡ Challenge
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted text-xs font-medium italic">No recent LeetCode activity found. Hit Sync to update!</div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Top Coders & Platform Links */}
                    <div style={{ flex: '1 1 350px' }} className="flex-col gap-6">
                        {/* Top Coders Preview */}
                        <motion.div variants={itemVariants} className="glass-card hover-lift flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <Award size={20} className="text-secondary" /> Elite Leaders
                                </h3>
                                <button className="btn text-xs btn-primary py-2 px-4 rounded-xl" onClick={() => navigate('/leaderboard')}>View All</button>
                            </div>
                            <div className="flex-col gap-3">
                                {topCoders.map((coder: any, idx: number) => (
                                    <div key={coder.id} className="group flex items-center justify-between p-4 rounded-[16px] bg-elevated/40 border border-white/5 hover:border-accent-primary/50 hover:bg-white/[0.04] transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            {/* Premium Rank Badge */}
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm"
                                                style={{
                                                    background: idx === 0 ? '#fffbeb' : idx === 1 ? '#f8fafc' : '#fff7ed',
                                                    color: idx === 0 ? '#d97706' : idx === 1 ? '#475569' : '#c2410c',
                                                    border: `1px solid ${idx === 0 ? '#fde68a' : idx === 1 ? '#e2e8f0' : '#fed7aa'}`
                                                }}
                                            >
                                                #{idx + 1}
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-main flex items-center justify-center border border-border-color shadow-sm overflow-hidden">
                                                {coder.avatarUrl ? (
                                                    <img src={`http://127.0.0.1:5000${coder.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle2 size={24} className="text-secondary opacity-70" />
                                                )}
                                            </div>

                                            <div className="ml-4">
                                                <div className="font-bold text-[15px] tracking-tight text-primary group-hover:text-accent-primary transition-colors">{coder.name}</div>
                                                <div className="text-[10px] text-muted uppercase font-bold tracking-[0.15em] mt-0.5">{coder.collegeId}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end justify-center">
                                            <div className="font-black text-lg text-gradient">{coder.leetcodePoints || 0}</div>
                                            <div className="text-[9px] uppercase text-muted font-black tracking-widest drop-shadow-sm">Pts</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Sync Pulse */}
                        <motion.div variants={itemVariants} className="glass-card hover-lift" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))' }}>
                            <h4 className="font-black text-lg mb-3 flex items-center gap-2">
                                <Zap size={18} className="text-secondary" /> Instant Data Sync
                            </h4>
                            <p className="text-xs text-secondary mb-6 leading-relaxed">Refresh your global stats and leaderboard rank in real-time.</p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn btn-primary w-full text-xs py-3 rounded-xl font-bold tracking-widest uppercase flex items-center justify-center gap-2"
                                onClick={handleSync}
                            >
                                <Zap size={16} /> Sync Everything
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
            
        </DashboardLayout>
    );
}

const ProgressRow = ({ label, current, max, colorClass, url }: any) => {
    const percent = Math.min((current / max) * 100, 100);
    return (
        <div className="platform-progress-row">
            <div className="platform-info">
                <div className="flex items-center gap-2 cursor-pointer hover:text-accent-primary transition-all" onClick={() => url && window.open(url, '_blank')}>
                    <span className="font-bold uppercase tracking-wide text-xs">{label}</span>
                    <ChevronRight size={10} className="opacity-40" />
                </div>
                <span className="font-bold text-xs">{current} / {max}</span>
            </div>
            <div className="progress-bar-bg">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className={`progress-bar-fill ${colorClass}`}
                />
            </div>
        </div>
    );
};

