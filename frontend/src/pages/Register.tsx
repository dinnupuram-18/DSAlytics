import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        collegeId: '',
        batch: '',
        department: '',
        password: '',
        leetcodeUrl: '',
        codechefUrl: '',
        codeforcesUrl: '',
        gfgUrl: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {

            const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            navigate('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', padding: '120px 20px 60px' }}>
            {/* Minimalist Branding in Corner */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="brand-corner brand-animate"
            >
                <motion.div
                    initial={{ rotate: -180 }}
                    animate={{ rotate: -5 }}
                    transition={{ duration: 1, type: "spring", bounce: 0.5 }}
                    style={{
                        width: '56px', height: '56px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 12px 30px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    <Award size={32} />
                </motion.div>
                <h1 className="text-5xl font-black text-gradient" style={{ letterSpacing: '-0.04em' }}>DSAlytics</h1>
            </motion.div>

            {/* Centered Stunning Register Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
                style={{ maxWidth: '800px', zIndex: 10 }}
            >
                <div className="glass-card">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <motion.div variants={itemVariants} className="mb-10 text-center">
                            <h3 className="text-3xl font-bold mb-3 tracking-tight">Create Profile</h3>
                            <p className="text-secondary text-sm opacity-70">Complete your academic identity to track progress.</p>
                        </motion.div>

                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 p-4 text-sm font-bold text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '3rem' }}>
                                {/* Personal Info */}
                                <motion.div variants={itemVariants} className="flex-col gap-5">
                                    <h4 className="text-[10px] uppercase font-black text-muted tracking-[0.2em] mb-2">Digital Identity</h4>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Full Name</label>
                                        <input type="text" required className="input-field transition-all focus:scale-[1.02]" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Email</label>
                                        <input type="email" required className="input-field transition-all focus:scale-[1.02]" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">College ID</label>
                                        <input type="text" required className="input-field transition-all focus:scale-[1.02]" placeholder="23CSE001" value={formData.collegeId} onChange={e => setFormData({ ...formData, collegeId: e.target.value })} />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Batch</label>
                                            <input type="text" required className="input-field transition-all focus:scale-[1.02]" placeholder="2025" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} />
                                        </div>
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Dept</label>
                                            <input type="text" required className="input-field transition-all focus:scale-[1.02]" placeholder="CSE" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Security Access</label>
                                        <input type="password" required className="input-field transition-all focus:scale-[1.02]" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                </motion.div>

                                {/* Platforms */}
                                <motion.div variants={itemVariants} className="flex-col gap-5">
                                    <h4 className="text-[10px] uppercase font-black text-muted tracking-[0.2em] mb-2">Coding Links (Optional)</h4>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">LeetCode</label>
                                        <input type="url" className="input-field transition-all focus:scale-[1.02]" placeholder="Profile URL" value={formData.leetcodeUrl} onChange={e => setFormData({ ...formData, leetcodeUrl: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">CodeChef</label>
                                        <input type="url" className="input-field transition-all focus:scale-[1.02]" placeholder="Profile URL" value={formData.codechefUrl} onChange={e => setFormData({ ...formData, codechefUrl: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Codeforces</label>
                                        <input type="url" className="input-field transition-all focus:scale-[1.02]" placeholder="Profile URL" value={formData.codeforcesUrl} onChange={e => setFormData({ ...formData, codeforcesUrl: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">GeeksforGeeks</label>
                                        <input type="url" className="input-field transition-all focus:scale-[1.02]" placeholder="Profile URL" value={formData.gfgUrl} onChange={e => setFormData({ ...formData, gfgUrl: e.target.value })} />
                                    </div>
                                </motion.div>
                            </div>

                            <motion.button
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full mt-10 py-5 rounded-[16px] flex items-center justify-center gap-3 text-sm font-bold tracking-widest uppercase"
                                style={{ boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)' }}
                            >
                                {loading ? 'Processing...' : (
                                    <>Confirm Registration <ArrowRight size={18} /></>
                                )}
                            </motion.button>
                        </form>

                        <motion.p variants={itemVariants} className="text-center mt-8 text-xs text-secondary tracking-wide">
                            Existing member? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 800, textDecoration: 'none' }} className="hover:underline">Login to Hub</Link>
                        </motion.p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Subtle background decoration */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    width: '800px',
                    height: '800px',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.03) 0%, transparent 70%)',
                    bottom: '-300px',
                    left: '-300px',
                    pointerEvents: 'none'
                }}
            />
        </div>
    );
}

