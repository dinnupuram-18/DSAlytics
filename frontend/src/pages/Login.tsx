import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const [collegeId, setCollegeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collegeId, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to login');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

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
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
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

            {/* Centered Stunning Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full px-6"
                style={{ maxWidth: '440px', zIndex: 10 }}
            >
                <div className="glass-card">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <motion.div variants={itemVariants} className="mb-10 text-center">
                            <h3 className="text-3xl font-bold mb-3 tracking-tight">Member Login</h3>
                            <p className="text-secondary text-sm opacity-70">Enter your credentials to access the hub.</p>
                        </motion.div>

                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 text-sm font-bold text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="flex-col gap-5">
                            <motion.div variants={itemVariants} className="input-group">
                                <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 ml-1">College ID</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '1.25rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        <User size={22} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="input-field w-full transition-all focus:scale-[1.02]"
                                        style={{ paddingLeft: '3.2rem' }}
                                        placeholder="Ex: 21CSE101"
                                        value={collegeId}
                                        onChange={e => setCollegeId(e.target.value)}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="input-group">
                                <label className="input-label text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 ml-1">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '1.25rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        <Lock size={22} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="input-field w-full transition-all focus:scale-[1.02]"
                                        style={{ paddingLeft: '3.2rem' }}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </motion.div>

                            <motion.button
                                variants={itemVariants}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                className="btn btn-primary w-full mt-6 py-4 rounded-[16px] flex items-center justify-center gap-3 text-sm font-bold tracking-widest uppercase"
                                disabled={loading}
                                style={{ boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)' }}
                            >
                                {loading ? 'Authenticating...' : (
                                    <>Sign In <ArrowRight size={18} /></>
                                )}
                            </motion.button>
                        </form>

                        <motion.div variants={itemVariants} className="text-center mt-10 text-xs text-secondary tracking-wide">
                            New coder? <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 800, textDecoration: 'none' }} className="hover:underline">Join the Batch</Link>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Subtle background decoration */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
                    top: '-200px',
                    right: '-200px',
                    pointerEvents: 'none'
                }}
            />
        </div>
    )
}
