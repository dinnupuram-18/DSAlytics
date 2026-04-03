import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { PageHeader } from '../components/PageHeader';
import { Target, AlertCircle, CheckCircle2, Info, BarChart3, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Analytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://127.0.0.1:5000/api/analytics/placement-readiness', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setData(await res.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <DashboardLayout><div className="text-center py-20 font-bold">Fetching detailed analytics...</div></DashboardLayout>;
    if (!data) return <DashboardLayout><div className="text-danger text-center py-20">Failed to load analytics data.</div></DashboardLayout>;

    // Prepare chart data
    const chartData = data.detailedReport.map((r: any) => ({
        subject: r.topic,
        A: r.userCount,
        fullMark: r.requiredCount,
    }));

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
                        title="Interview Readiness Report 🚀"
                        description="Analysis of your coding performance against industry SDE-1 standards."
                        icon={<BarChart3 size={28} />}
                    />
                </motion.div>

                <div className="flex gap-6 flex-wrap mt-6">
                    {/* Mastery Rings Section (Innovative Alternative to Radar Chart) */}
                    <motion.div variants={itemVariants} className="glass-card hover-lift flex-col" style={{ flex: '1 1 500px', minHeight: '450px' }}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                                    <Star size={20} className="text-accent-secondary" /> Mastery Rings
                                </h3>
                                <p className="text-xs text-secondary font-medium">Your topic coverage visualized as activity rings.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-2 w-full h-full place-items-center mt-2">
                            {chartData.filter((item: any) => {
                                const percentage = item.fullMark > 0 ? (item.A / item.fullMark) * 100 : 0;
                                return percentage < 100; // Filter out 100% mastered topics to focus on areas to improve
                            }).slice(0, 6).map((item: any, i: number) => {
                                const percentage = item.fullMark > 0 ? Math.min(100, (item.A / item.fullMark) * 100) : 0;
                                const radius = 28; // Smaller radius
                                const circumference = 2 * Math.PI * radius;
                                const strokeDashoffset = circumference - (percentage / 100) * circumference;

                                // Cycle through vibrant colors
                                const colors = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];
                                const color = colors[i % colors.length];

                                return (
                                    <div key={item.subject} className="flex-col items-center justify-center w-full">
                                        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                                            <svg className="transform -rotate-90 w-full h-full drop-shadow-sm" viewBox="0 0 72 72">
                                                {/* Background Track */}
                                                <circle cx="36" cy="36" r={radius} stroke="var(--border-color)" strokeWidth="6" fill="transparent" />
                                                {/* Animated Progress Ring */}
                                                <motion.circle
                                                    initial={{ strokeDashoffset: circumference }}
                                                    animate={{ strokeDashoffset }}
                                                    transition={{ duration: 1.5, delay: 0.3 + (i * 0.1), ease: "easeOut" }}
                                                    cx="36" cy="36" r={radius}
                                                    stroke={color}
                                                    strokeWidth="6"
                                                    fill="transparent"
                                                    strokeDasharray={circumference}
                                                    strokeLinecap="round"
                                                    style={{ filter: `drop-shadow(0 0 3px ${color}50)` }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{Math.round(percentage)}%</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-wider font-bold mt-2 text-center text-secondary truncate w-full block px-2" title={item.subject}>
                                            {item.subject}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Scorecard & Gaps */}
                    <div className="flex-col gap-6" style={{ flex: '1 1 350px' }}>
                        <motion.div variants={itemVariants} className="glass-card hover-lift text-center py-10" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))' }}>
                            <div className="text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-3">Readiness Index</div>
                            <div className="text-7xl font-black text-gradient">{data.readinessScore}%</div>
                            <div className="mt-6 px-8">
                                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/10 text-xs text-secondary italic font-medium leading-relaxed">
                                    "{data.recommendation}"
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card hover-lift">
                            <h3 className="font-black flex items-center gap-2 mb-6 text-lg">
                                <AlertCircle size={20} className="text-danger" /> Critical Skill Gaps
                            </h3>
                            <div className="flex flex-col gap-4">
                                {data.detailedReport.filter((r: any) => r.gap > 0 && r.importance === 'High').slice(0, 4).map((r: any) => (
                                    <div key={r.topic} className="flex justify-between items-center text-sm p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-danger/30 transition-colors cursor-default">
                                        <span className="font-bold tracking-tight">{r.topic}</span>
                                        <span className="text-danger font-black text-xs">-{r.gap} Problems</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Detailed Topic List */}
                <motion.div variants={itemVariants} className="glass-card mt-6">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                        <Target size={24} className="text-accent-primary" /> Deep Dive Analysis
                    </h3>
                    <div className="flex flex-col gap-4">
                        {data.detailedReport.map((r: any, idx: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + idx * 0.05 }}
                                key={r.topic}
                                className="p-5 rounded-2xl bg-white/[0.02] border border-transparent hover:border-accent-primary/30 hover:bg-white/[0.03] hover-lift transition-all group"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${r.isReady ? 'bg-success/10 text-success' : 'bg-white/5 text-muted'}`}>
                                            {r.isReady ? <CheckCircle2 size={18} /> : <Info size={18} />}
                                        </div>
                                        <div className="flex-col">
                                            <span className="font-black text-sm tracking-tight">{r.topic}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${r.importance === 'High' ? 'bg-danger/20 text-danger' : 'bg-white/5 text-muted'}`}>
                                                    {r.importance}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-gradient">{r.userCount} / {r.requiredCount}</div>
                                        <div className="text-[9px] font-bold text-muted uppercase tracking-widest">Solved</div>
                                    </div>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${r.progress}%` }}
                                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 + idx * 0.05 }}
                                        className="h-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                        style={{
                                            background: r.isReady ? 'var(--success)' : 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))'
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}
