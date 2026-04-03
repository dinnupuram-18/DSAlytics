import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { PageHeader } from '../components/PageHeader';
import {
    Save, Camera, UserCircle2, Sun, Moon, CheckCircle2, AlertCircle,
    User, BookOpen, Code2, Settings as SettingsIcon, ExternalLink, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://127.0.0.1:5000';

// ── Skeleton component ──────────────────────────────────────────────────────
const SkeletonRow = ({ w = '100%', h = 40 }: { w?: string; h?: number }) => (
    <div style={{
        width: w, height: `${h}px`, borderRadius: '10px',
        background: 'var(--bg-elevated)', opacity: 0.55,
        animation: 'shimmer 1.6s ease-in-out infinite',
    }} />
);

const ProfileSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-elevated)', opacity: 0.55, animation: 'shimmer 1.6s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <SkeletonRow w="45%" h={24} />
                <SkeletonRow w="30%" h={14} />
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonRow key={i} h={48} />)}
        </div>
        <SkeletonRow h={80} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[1, 2, 3, 4].map(i => <SkeletonRow key={i} h={48} />)}
        </div>
    </div>
);

// ── Input field helper ──────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">{label}</label>
        {children}
    </div>
);

// ── Platform badge ──────────────────────────────────────────────────────────
const platformColors: Record<string, string> = {
    LeetCode: '#f89f1b', CodeChef: '#5b4638', Codeforces: '#3b82f6',
    GeeksforGeeks: '#2f8d46', HackerRank: '#1ba94c',
};

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', email: '', dob: '', aboutMe: '',
        branch: '', year: '', section: '', placementTarget: '',
        leetcodeUrl: '', codechefUrl: '', codeforcesUrl: '', gfgUrl: '', hackerrankUrl: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarMenuRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'platforms'>('personal');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Theme sync
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Close avatar menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node))
                setShowAvatarMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-dismiss messages
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(() => setMessage(null), 4000);
        return () => clearTimeout(t);
    }, [message]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                    aboutMe: data.aboutMe || '',
                    branch: data.branch || '',
                    year: data.year || '',
                    section: data.section || '',
                    placementTarget: data.placementTarget || '',
                    leetcodeUrl: data.leetcodeUrl || '',
                    codechefUrl: data.codechefUrl || '',
                    codeforcesUrl: data.codeforcesUrl || '',
                    gfgUrl: data.gfgUrl || '',
                    hackerrankUrl: data.hackerrankUrl || '',
                });
                // Keep avatarUrl in localStorage for DashboardLayout
                if (data.avatarUrl) localStorage.setItem('avatarUrl', data.avatarUrl);
                else localStorage.removeItem('avatarUrl');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Client-side validation
        if (formData.name.trim().length < 2) {
            setMessage({ text: 'Name must be at least 2 characters.', type: 'error' }); return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
            setMessage({ text: data.message || 'Profile saved successfully!', type: 'success' });
            fetchProfile();
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];

        // Show instant local preview
        const previewUrl = URL.createObjectURL(file);
        setLocalPreview(previewUrl);

        const fd = new FormData();
        fd.append('avatar', file);
        setUploadingAvatar(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) { setMessage({ text: 'Session expired — please log in again', type: 'error' }); setUploadingAvatar(false); return; }
            const res = await fetch(`${API}/api/auth/avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (res.ok) {
                setProfile((p: any) => ({ ...p, avatarUrl: data.avatarUrl }));
                localStorage.setItem('avatarUrl', data.avatarUrl);
                setLocalPreview(null); // clear preview, use server URL
                setMessage({ text: 'Profile picture updated! ✅', type: 'success' });
            } else {
                setLocalPreview(null); // revert preview on failure
                setMessage({ text: data.error || 'Upload failed — try again', type: 'error' });
            }
        } catch {
            setLocalPreview(null);
            setMessage({ text: 'Upload failed — check your connection', type: 'error' });
        } finally {
            setUploadingAvatar(false);
            setShowAvatarMenu(false);
            // Reset file input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAvatarDelete = async () => {
        setShowAvatarMenu(false);
        setUploadingAvatar(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/auth/avatar`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setProfile((p: any) => ({ ...p, avatarUrl: null }));
                localStorage.removeItem('avatarUrl');
                setMessage({ text: 'Profile picture removed!', type: 'success' });
            } else {
                setMessage({ text: data.error || 'Remove failed', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Failed to remove avatar', type: 'error' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const platforms = [
        { name: 'LeetCode', key: 'leetcodeUrl', placeholder: 'https://leetcode.com/u/username' },
        { name: 'CodeChef', key: 'codechefUrl', placeholder: 'https://www.codechef.com/users/username' },
        { name: 'Codeforces', key: 'codeforcesUrl', placeholder: 'https://codeforces.com/profile/username' },
        { name: 'GeeksforGeeks', key: 'gfgUrl', placeholder: 'https://www.geeksforgeeks.org/user/username' },
        { name: 'HackerRank', key: 'hackerrankUrl', placeholder: 'https://www.hackerrank.com/profile/username' },
    ];

    const tabs = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'academic', label: 'Academic', icon: BookOpen },
        { id: 'platforms', label: 'Platforms', icon: Code2 },
    ] as const;

    const containerVariants: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants: any = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

    return (
        <DashboardLayout>
            {/* Global Notification - Fixed at top right */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{
                            position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
                            padding: '16px 24px', borderRadius: '16px',
                            background: message.type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
                            color: 'white', fontWeight: 700, fontSize: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto"
            >
                <motion.div variants={itemVariants}>
                    <PageHeader
                        title="Profile Settings"
                        description="Manage your personal information, academic details, and coding platform links."
                        icon={<SettingsIcon size={24} />}
                    />
                </motion.div>

                {loading ? (
                    <motion.div variants={itemVariants} className="glass-card mt-6">
                        <ProfileSkeleton />
                    </motion.div>
                ) : (
                    <>
                        {/* ── Avatar + Identity Card ── */}
                        <motion.div variants={itemVariants} className="glass-card mt-6" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                {/* Avatar */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    {/* Avatar circle */}
                                    <div style={{
                                        width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                                        border: '3px solid var(--accent-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'var(--bg-main)', position: 'relative',
                                        boxShadow: '0 0 0 6px rgba(99,102,241,0.1)',
                                    }}>
                                        {uploadingAvatar ? (
                                            <div style={{ fontSize: 22 }}>⏳</div>
                                        ) : (localPreview || profile?.avatarUrl) ? (
                                            <img
                                                src={localPreview || `${API}${profile.avatarUrl}`}
                                                alt="avatar"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <UserCircle2 size={44} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                        )}
                                    </div>

                                    {/* Always-visible action buttons below avatar */}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            <Camera size={13} /> Upload
                                        </button>
                                        {(profile?.avatarUrl || localPreview) && (
                                            <button
                                                onClick={handleAvatarDelete}
                                                disabled={uploadingAvatar}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                            >
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        )}
                                    </div>

                                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*,image/jpeg,image/jpg,image/png,image/webp,image/gif" style={{ display: 'none' }} />
                                </div>

                                {/* Identity info */}
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>
                                        {profile?.name}
                                    </h2>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>
                                        {profile?.collegeId} · {profile?.department}
                                    </p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {uploadingAvatar ? '⏳ Updating photo...' : 'Click your photo to update or remove it'}
                                    </p>
                                </div>

                                {/* Theme toggle */}
                                <button
                                    onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                                    style={{
                                        padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-color)',
                                        background: 'var(--bg-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                        fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', transition: 'all 0.2s',
                                    }}
                                >
                                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} style={{ color: '#f59e0b' }} />}
                                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                            </div>
                        </motion.div>

                        {/* ── Toast Message ── */}
                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                        marginBottom: '1rem', padding: '14px 18px', borderRadius: '14px',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        fontWeight: 700, fontSize: '14px',
                                        background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                                        border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                    }}
                                >
                                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Main Form Card ── */}
                        <motion.div variants={itemVariants} className="glass-card">
                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem', padding: '6px', background: 'var(--bg-elevated)', borderRadius: '14px', width: 'fit-content' }}>
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                                fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px',
                                                background: isActive ? 'var(--bg-card)' : 'transparent',
                                                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <Icon size={15} /> {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSubmit}>
                                <AnimatePresence mode="wait">
                                    {/* Personal Tab */}
                                    {activeTab === 'personal' && (
                                        <motion.div key="personal" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                                <Field label="Full Name *">
                                                    <input type="text" className="input-field" value={formData.name} onChange={handleChange('name')} required placeholder="Your full name" />
                                                </Field>
                                                <Field label="Email (read-only)">
                                                    <input type="email" className="input-field" value={formData.email} readOnly style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                                                </Field>
                                                <Field label="Date of Birth">
                                                    <input type="date" className="input-field" value={formData.dob} onChange={handleChange('dob')} />
                                                </Field>
                                            </div>
                                            <Field label="About Me">
                                                <textarea rows={4} className="input-field" placeholder="Tell the community about yourself — your goals, interests, and achievements..." value={formData.aboutMe} onChange={handleChange('aboutMe') as any} style={{ resize: 'vertical', lineHeight: 1.6 }} />
                                            </Field>
                                        </motion.div>
                                    )}

                                    {/* Academic Tab */}
                                    {activeTab === 'academic' && (
                                        <motion.div key="academic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                                                <Field label="Branch">
                                                    <input type="text" className="input-field" placeholder="e.g. CSE, ECE" value={formData.branch} onChange={handleChange('branch')} />
                                                </Field>
                                                <Field label="Year">
                                                    <select className="input-field" value={formData.year} onChange={handleChange('year')}>
                                                        <option value="">Select Year</option>
                                                        <option>1st Year</option>
                                                        <option>2nd Year</option>
                                                        <option>3rd Year</option>
                                                        <option>4th Year</option>
                                                    </select>
                                                </Field>
                                                <Field label="Section">
                                                    <input type="text" className="input-field" placeholder="e.g. A, B1" value={formData.section} onChange={handleChange('section')} maxLength={5} />
                                                </Field>
                                                <Field label="Placement Target">
                                                    <select className="input-field" value={formData.placementTarget} onChange={handleChange('placementTarget')}>
                                                        <option value="">Select Target</option>
                                                        <option>Product Base</option>
                                                        <option>Service Base</option>
                                                        <option>Higher Studies</option>
                                                        <option>Startup</option>
                                                        <option>Research</option>
                                                    </select>
                                                </Field>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Platforms Tab */}
                                    {activeTab === 'platforms' && (
                                        <motion.div key="platforms" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {platforms.map(p => {
                                                    const val = formData[p.key as keyof typeof formData];
                                                    const color = platformColors[p.name];
                                                    return (
                                                        <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                                                            <div style={{ flex: 1 }}>
                                                                <Field label={p.name}>
                                                                    <input type="url" className="input-field" placeholder={p.placeholder} value={val} onChange={handleChange(p.key)} />
                                                                </Field>
                                                            </div>
                                                            {val && (
                                                                <a href={val} target="_blank" rel="noopener noreferrer" style={{ marginTop: '24px', color: 'var(--text-secondary)', opacity: 0.6, transition: 'opacity 0.2s' }}
                                                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                                                                >
                                                                    <ExternalLink size={16} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                                                    💡 Updating platform links will trigger an automatic data sync on your next Sync.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Save Button */}
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        marginTop: '2rem', width: '100%', padding: '14px',
                                        borderRadius: '14px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                                        background: submitting ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                        color: 'white', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: submitting ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
                                        transition: 'all 0.2s', opacity: submitting ? 0.6 : 1,
                                    }}
                                >
                                    <Save size={18} />
                                    {submitting ? 'Saving...' : 'Save Profile'}
                                </motion.button>
                            </form>
                        </motion.div>

                        {/* ── Linked Platforms Status Card ── */}
                        <motion.div variants={itemVariants} className="glass-card" style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Code2 size={18} style={{ color: 'var(--accent-secondary)' }} /> Platform Status
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                {platforms.map(p => {
                                    const linked = !!(profile?.[p.key] || formData[p.key as keyof typeof formData]);
                                    const color = platformColors[p.name];
                                    return (
                                        <div key={p.key} style={{
                                            padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                                            background: linked ? `${color}12` : 'var(--bg-elevated)',
                                            border: `1px solid ${linked ? `${color}30` : 'var(--border-color)'}`,
                                            transition: 'all 0.2s',
                                        }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: linked ? color : 'var(--text-muted)', boxShadow: linked ? `0 0 6px ${color}` : 'none' }} />
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 700 }}>{p.name}</div>
                                                <div style={{ fontSize: '10px', color: linked ? color : 'var(--text-muted)', fontWeight: 600 }}>{linked ? 'Connected' : 'Not Linked'}</div>
                                            </div>
                                            {linked && profile?.[p.key] && (
                                                <a href={profile[p.key]} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', color: color, opacity: 0.7 }}>
                                                    <ExternalLink size={13} />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
