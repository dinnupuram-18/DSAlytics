import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Settings, LogOut, ShieldAlert, Menu, X, Award, UserCircle2, Bell, UserPlus, LayoutDashboard, Users, Trophy, Megaphone, Activity, Lock, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
    children: ReactNode;
    isAdminView?: boolean;
}

export const DashboardLayout = ({ children, isAdminView }: LayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Check if current user is the designated admin
    const isAdminUser = (() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return u?.collegeId === '24J41A05HK';
        } catch { return false; }
    })();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) setIsMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
        return localStorage.getItem('avatarUrl');
    });

    useEffect(() => {
        const fetchAvatar = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch('http://127.0.0.1:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.avatarUrl) {
                        setAvatarUrl(data.avatarUrl);
                        localStorage.setItem('avatarUrl', data.avatarUrl);
                    } else {
                        setAvatarUrl(null);
                        localStorage.removeItem('avatarUrl');
                    }
                }
            } catch (e) {
                console.error("Failed to load layout avatar", e);
            }
        };
        fetchAvatar();
    }, []);

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showBell, setShowBell] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const fetchUnread = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('http://127.0.0.1:5000/api/notifications/count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) { const d = await res.json(); setUnreadCount(d.count || 0); }
        } catch { }
    };

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('http://127.0.0.1:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setNotifications(await res.json());
        } catch { }
    };

    const markAllRead = async () => {
        const token = localStorage.getItem('token');
        await fetch('http://127.0.0.1:5000/api/notifications/read', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(0);
        setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    };

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!showBell) return;
        fetchNotifications();
    }, [showBell]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const notifIcon = (type: string) => {
        if (type === 'friend_request' || type === 'friend_accepted') return <UserPlus size={13} />;
        return <Bell size={13} />;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('avatarUrl');
        navigate('/login');
    };

    const CustomDashboardIcon = ({ size, color, strokeWidth }: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    );

    const CustomLeaderboardIcon = ({ size, color, strokeWidth }: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
    );

    const menuItems = [
        { icon: CustomDashboardIcon, label: 'Dashboard', path: '/' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: CustomLeaderboardIcon, label: 'Leaderboard', path: '/leaderboard' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        // Only show Admin link to the designated admin user
        ...(isAdminUser ? [{ icon: ShieldAlert, label: 'Admin', path: '/admin' }] : []),
    ];

    const adminMenuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: Trophy, label: 'Competitions', path: '/admin/competitions' },
        { icon: Megaphone, label: 'Notifications', path: '/admin/notifications' },
        { icon: Activity, label: 'System Health', path: '/admin/system' },
        { icon: Lock, label: 'Security & Roles', path: '/admin/security' },
        { icon: Settings, label: 'Platform Settings', path: '/admin/platform-settings' },
        { icon: UserCircle, label: 'Admin Profile', path: '/admin/profile' },
        { icon: LogOut, label: 'Exit Admin', path: '/' },
    ];

    const currentMenuItems = (isAdminView || location.pathname.startsWith('/admin')) ? adminMenuItems : menuItems;

    const sidebarVariants: any = {
        hidden: { x: -280, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
        exit: { x: -280, opacity: 0, transition: { duration: 0.3 } }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, x: -20 },
        visible: (i: number) => ({
            opacity: 1, x: 0,
            transition: { delay: i * 0.1 + 0.3, duration: 0.5, ease: "easeOut" }
        })
    };

    return (
        <div className="flex" style={{ minHeight: '100vh', overflow: 'hidden' }}>
            {isMobile && (
                <div className="fixed top-0 left-0 w-full z-50 p-4 bg-bg-elevated/80 backdrop-blur-md border-b border-border-color flex justify-between items-center" style={{ backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-center gap-2">
                        <Award size={24} className="text-accent-primary" />
                        <span className="font-bold text-lg text-gradient">DSAlytics</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/50 rounded-lg shadow-sm">
                        <Menu size={24} className="text-accent-primary" />
                    </button>
                </div>
            )}

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(!isMobile || isMobileMenuOpen) && (
                    <motion.aside
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glass-card"
                        style={{
                            width: '280px',
                            height: '100vh',
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            borderRadius: 0,
                            borderRight: 'var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 100,
                            background: 'var(--bg-card)',
                            boxShadow: isMobile ? '20px 0 50px rgba(0,0,0,0.1)' : 'var(--glass-shadow)'
                        }}
                    >
                        <div className="flex items-center gap-4 mb-10 mt-6 px-6 relative">
                            <motion.div
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                                style={{
                                    width: '42px', height: '42px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                <Award size={24} />
                            </motion.div>
                            <div className="flex-col" style={{ marginLeft: '6px' }}>
                                <h2 className="text-xl font-bold text-gradient" style={{ marginBottom: 0 }}>DSAlytics</h2>
                            </div>
                            {isMobile && (
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="absolute right-4 top-2 p-2 hover:bg-black/5 rounded-lg"
                                >
                                    <X size={20} className="text-secondary" />
                                </button>
                            )}
                        </div>

                        {user && (
                            <div className="flex items-center gap-4 px-6 pb-6 mt-2">
                                <div className="rounded-full bg-main flex items-center justify-center border border-border-color overflow-hidden flex-shrink-0" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                                    {avatarUrl ? (
                                        <img src={`http://127.0.0.1:5000${avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <UserCircle2 size={24} className="text-secondary opacity-70" />
                                    )}
                                </div>
                                <div className="flex-col overflow-hidden ml-2" style={{ minWidth: 0, width: '100%' }}>
                                    <div className="font-bold truncate" style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: '1.2' }}>{user.name}</div>
                                    <div className="text-secondary font-bold uppercase tracking-wider mt-1 truncate" style={{ fontSize: '0.7rem' }}>{user.collegeId}</div>
                                </div>
                            </div>
                        )}

                        <nav className="flex-col" style={{ flex: 1, overflowY: 'auto' }}>
                            {currentMenuItems.map((item, i) => {
                                const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin');
                                const Icon = item.icon;
                                return (
                                    <motion.div key={item.path} custom={i} variants={itemVariants} initial="hidden" animate="visible">
                                        <Link
                                            to={item.path}
                                            onClick={() => isMobile && setIsMobileMenuOpen(false)}
                                            className={`sidebar-nav-item ${isActive ? 'active' : ''} group`}
                                            style={{ textDecoration: 'none', position: 'relative' }}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-indigo-50/50 rounded-xl -z-10"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                            <Icon size={22} color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} strokeWidth={isActive ? 2 : 1.5} />
                                            <span>{item.label}</span>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </nav>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="px-3 pb-6 mt-auto flex-col gap-4"
                        >
                            <div ref={bellRef} style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                <button
                                    onClick={() => setShowBell(v => !v)}
                                    style={{ width: '100%', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: showBell ? 'rgba(99,102,241,0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', position: 'relative' }}
                                >
                                    <Bell size={20} color={unreadCount > 0 ? 'var(--accent-primary)' : undefined} />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span style={{ marginLeft: 'auto', background: 'var(--accent-primary)', color: 'white', borderRadius: '999px', fontSize: '10px', fontWeight: 800, padding: '2px 7px', minWidth: '20px', textAlign: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showBell && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                            transition={{ duration: 0.15 }}
                                            style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden', maxHeight: '320px', display: 'flex', flexDirection: 'column' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Notifications</span>
                                                {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Mark all read</button>}
                                            </div>
                                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                                {notifications.length === 0 ? (
                                                    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No notifications yet</div>
                                                ) : notifications.slice(0, 10).map(n => (
                                                    <div key={n.id} style={{ padding: '10px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start', background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.05)', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                                        <span style={{ color: n.isRead ? 'var(--text-muted)' : 'var(--accent-primary)', marginTop: '2px', flexShrink: 0 }}>{notifIcon(n.type)}</span>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '12px', fontWeight: 600, color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.4 }}>{n.message}</div>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                                        </div>
                                                        {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: '5px' }} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="btn w-full hover-lift"
                                style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px', justifyContent: 'center', fontSize: '0.875rem' }}
                            >
                                <LogOut size={18} />
                                Logout Session
                            </button>
                        </motion.div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <main className={isMobile ? "main-content-mobile" : ""} style={{ marginLeft: isMobile ? '0' : '280px', width: '100%', padding: '2.5rem', paddingTop: isMobile ? '6rem' : '2.5rem', position: 'relative', transition: 'margin 0.3s ease' }}>
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div >
    );
};
