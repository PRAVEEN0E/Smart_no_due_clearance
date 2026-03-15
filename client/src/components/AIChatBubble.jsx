import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import api from '../lib/api';

export default function AIChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Academic Assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && subjects.length === 0) {
            fetchSubjects();
        }
        scrollToBottom();
    }, [messages, isOpen]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/student/subjects');
            setSubjects(res.data);
            if (res.data.length > 0) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I've analyzed your curriculum. Which subject would you like the **Important Questions & Answers** for?",
                    isSubjectPrompt: true
                }]);
            }
        } catch (err) {
            console.error("Failed to fetch subjects");
        }
    };

    const handleSubjectSelect = async (sub) => {
        setSelectedSubject(sub);
        setMessages(prev => [...prev, { role: 'user', content: `Focus on: ${sub.subject.name}` }]);
        setLoading(true);

        try {
            const res = await api.post('/student/qa', { subjectId: sub.subjectId });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble retrieving the syllabus for this subject." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await api.post('/student/chat', { message: userMsg, subjectId: selectedSubject?.subjectId });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm experiencing some connectivity issues." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] glass rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">Academic Assistant</h3>
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10'
                                            }`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-white/5 border border-white/10 rounded-tl-none prose prose-invert prose-sm max-w-none'
                                            }`}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            
                                            {msg.isSubjectPrompt && (
                                                <div className="mt-4 flex flex-wrap gap-2 not-prose">
                                                    {subjects.map((sub, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleSubjectSelect(sub)}
                                                            className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-[11px] font-bold transition-all"
                                                        >
                                                            {sub.subject.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2 bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none items-center">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/20">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything about your grades..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:grayscale transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-white/10 text-white' : 'premium-gradient text-white scale-110'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}
