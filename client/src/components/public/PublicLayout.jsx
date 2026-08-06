import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, Sparkles, Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { SITE_NAME } from '../../lib/seo';

const NAV_LINKS = [
    { to: '/features', label: 'Features' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/verify', label: 'Verify Clearance' },
];

function PublicHeader() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const onHome = location.pathname === '/';

    const close = () => setOpen(false);

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-18 flex items-center justify-between">
                <Link to="/" onClick={close} className="flex items-center gap-2.5 group" aria-label={`${SITE_NAME} homepage`}>
                    <span className="w-9 h-9 md:w-10 md:h-10 premium-gradient rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform" aria-hidden="true">
                        <ShieldCheck className="w-5 h-5" />
                    </span>
                    <span className="text-xl md:text-2xl font-black italic tracking-tighter text-primary font-heading">
                        {SITE_NAME}
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
                    {NAV_LINKS.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isActive ? 'text-primary bg-primary/5' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-2">
                    <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors">
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white premium-gradient shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                        Get Started
                    </Link>
                </div>

                <button
                    className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                >
                    {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {open && (
                <nav id="mobile-menu" className="md:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1" aria-label="Mobile">
                    {!onHome && (
                        <Link to="/" onClick={close} className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                            Home
                        </Link>
                    )}
                    {NAV_LINKS.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            onClick={close}
                            className={({ isActive }) =>
                                `block px-4 py-3 rounded-xl text-sm font-bold ${isActive ? 'text-primary bg-primary/5' : 'text-slate-600 hover:bg-slate-50'}`
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                    <div className="pt-3 pb-1 flex flex-col gap-2 border-t border-slate-200/60 mt-2">
                        <Link to="/login" onClick={close} className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                            Sign In
                        </Link>
                        <Link to="/register" onClick={close} className="block px-4 py-3 rounded-xl text-sm font-bold text-white premium-gradient text-center">
                            Get Started
                        </Link>
                    </div>
                </nav>
            )}
        </header>
    );
}

function PublicFooter() {
    return (
        <footer className="premium-gradient text-white/80">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div className="md:col-span-2 space-y-4">
                    <Link to="/" className="flex items-center gap-2.5 w-fit" aria-label={`${SITE_NAME} homepage`}>
                        <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white" aria-hidden="true">
                            <ShieldCheck className="w-5 h-5" />
                        </span>
                        <span className="text-xl font-black italic tracking-tighter text-white font-heading">{SITE_NAME}</span>
                    </Link>
                    <p className="text-sm leading-relaxed max-w-md">
                        The smart student clearance and hall ticket management platform — automating no-dues, department approvals, and AI-powered academic evaluation for engineering colleges and higher education institutions.
                    </p>
                    <p className="text-xs text-white/50">
                        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
                    </p>
                </div>

                <nav aria-label="Company">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Company</h3>
                    <ul className="space-y-2.5 text-sm">
                        <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                        <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                        <li><Link to="/register" className="hover:text-white transition-colors">Request a Demo</Link></li>
                    </ul>
                </nav>

                <nav aria-label="Legal and support">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Legal &amp; Support</h3>
                    <ul className="space-y-2.5 text-sm">
                        <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        <li><Link to="/verify" className="hover:text-white transition-colors">Verify a Clearance</Link></li>
                        <li><Link to="/login" className="hover:text-white transition-colors">Institutional Login</Link></li>
                    </ul>
                </nav>
            </div>

            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
                    <div className="flex items-center gap-5">
                        <a href="mailto:hello@noduenest.app" className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Mail className="w-3.5 h-3.5" aria-hidden="true" /> hello@noduenest.app
                        </a>
                        <a href="tel:+919876543210" className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Phone className="w-3.5 h-3.5" aria-hidden="true" /> +91 98765 43210
                        </a>
                    </div>
                    <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Made with care by TalentNest
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default function PublicLayout({ children }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <PublicHeader />
            <main id="main-content" className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    );
}
