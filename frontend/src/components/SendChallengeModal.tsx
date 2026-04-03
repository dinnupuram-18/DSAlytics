import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserCircle2, CheckCircle2 } from 'lucide-react';

export function SendChallengeModal({ isOpen, onClose, problem, onSuccess }: any) {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
            setSelectedIds([]);
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/friends/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(data.friends || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (selectedIds.length === 0) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const questionUrl = `https://leetcode.com/problems/${problem.titleSlug || problem.title?.toLowerCase().replace(/\s+/g, '-')}/`;
            
            const res = await fetch('http://127.0.0.1:5000/api/challenge/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    receiverIds: selectedIds,
                    problemName: problem.title,
                    problemURL: questionUrl,
                    difficulty: 'Medium' // Defaulting based on frontend data
                })
            });
            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-main border border-border-color rounded-2xl overflow-hidden shadow-2xl"
                >
                    <div className="flex justify-between items-center p-6 border-b border-border-color/50 bg-elevated/30">
                        <h3 className="text-xl font-black">Challenge Friends</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors hidden-br-xs">
                            <X size={20} className="text-secondary" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <p className="text-sm font-bold text-muted uppercase tracking-widest mb-1">Problem</p>
                            <p className="text-lg font-black text-primary">{problem?.title}</p>
                        </div>

                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Select Friends</p>
                        
                        <div className="max-h-60 overflow-y-auto pr-2 flex flex-col gap-2 mb-6 styled-scrollbar">
                            {loading ? (
                                <p className="text-center text-secondary py-4 text-sm font-medium">Loading friends...</p>
                            ) : friends.length === 0 ? (
                                <p className="text-center text-muted py-4 text-sm font-medium italic">You have no friends to challenge yet.</p>
                            ) : (
                                friends.map((f: any) => {
                                    const friendUser = f.sender || f.receiver;
                                    const isSelected = selectedIds.includes(friendUser.id);
                                    
                                    return (
                                        <div 
                                            key={friendUser.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedIds(prev => prev.filter(id => id !== friendUser.id));
                                                } else {
                                                    setSelectedIds(prev => [...prev, friendUser.id]);
                                                }
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? 'bg-accent-primary/10 border-accent-primary/40' : 'bg-elevated/30 border-white/5 hover:border-white/20 hover:bg-elevated'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-main flex items-center justify-center border border-border-color shadow-sm overflow-hidden shrink-0">
                                                {friendUser.avatarUrl ? (
                                                    <img src={`http://127.0.0.1:5000${friendUser.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle2 size={24} className="text-secondary opacity-70" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm text-primary truncate">{friendUser.name}</div>
                                                <div className="text-[10px] text-muted uppercase tracking-widest">{friendUser.collegeId}</div>
                                            </div>
                                            {isSelected && (
                                                <div className="text-accent-primary flex-shrink-0">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <button 
                            onClick={handleSend}
                            disabled={selectedIds.length === 0 || sending}
                            className={`w-full py-3 rounded-xl font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${selectedIds.length > 0 && !sending ? 'btn-primary' : 'bg-elevated text-muted cursor-not-allowed opacity-60'}`}
                        >
                            {sending ? 'Sending...' : `Send Challenge (${selectedIds.length})`}
                            {!sending && <Send size={16} />}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
