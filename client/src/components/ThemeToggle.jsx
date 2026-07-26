import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

export default function ThemeToggle() {
    const { token } = useAuthStore();
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('sndc-theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
            root.style.setProperty('--background', '222 47% 11%');
            root.style.setProperty('--foreground', '210 40% 90%');
            root.style.setProperty('--card', '222 47% 14%');
            root.style.setProperty('--border', '217 33% 20%');
        } else {
            root.classList.remove('dark');
            root.style.setProperty('--background', '210 40% 98%');
            root.style.setProperty('--foreground', '215 16% 27%');
            root.style.setProperty('--card', '0 0% 100%');
            root.style.setProperty('--border', '215 16% 94%');
        }
        localStorage.setItem('sndc-theme', dark ? 'dark' : 'light');
        if (token) {
            api.put('/preferences', { theme: dark ? 'dark' : 'light' }).catch(() => {});
        }
    }, [dark, token]);

    return (
        <button onClick={() => setDark(!dark)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 hover:bg-black/5 rounded-xl border border-black/5 transition-all">
            {dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
        </button>
    );
}
