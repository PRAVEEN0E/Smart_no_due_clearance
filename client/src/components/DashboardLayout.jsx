import { LogOut, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { lazy } from 'react';
import useAuth from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import OfflineBanner from './OfflineBanner';
import ThemeToggle from './ThemeToggle';
import PushNotificationManager from './PushNotificationManager';
import AnnouncementTicker from './AnnouncementTicker';
import { SITE_NAME, SITE_TAGLINE, SITE_URL, SITE_DESC, SITE_KEYWORDS, OG_IMAGE, LOCALE } from '../lib/seo';

const AIChatBubble = lazy(() => import('./AIChatBubble'));

export default function DashboardLayout({ children }) {
    const { logout, user } = useAuth();
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
            <a href="#main-content" className="skip-to-content sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[9999] focus:p-4 focus:bg-primary focus:text-white focus:font-bold">Skip to main content</a>
            <Helmet>
                <title>{user?.collegeName ? `${user.collegeName} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`}</title>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="description" content={SITE_DESC} />
                <meta name="keywords" content={SITE_KEYWORDS} />
                <meta property="og:title" content={user?.collegeName ? `${user.collegeName} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`} />
                <meta property="og:description" content={SITE_DESC} />
                <meta property="og:url" content={SITE_URL} />
                <meta property="og:image" content={OG_IMAGE} />
                <meta property="og:locale" content={LOCALE} />
                <meta name="twitter:title" content={user?.collegeName ? `${user.collegeName} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`} />
                <meta name="twitter:description" content={SITE_DESC} />
                <meta name="twitter:image" content={OG_IMAGE} />
                <link rel="canonical" href={SITE_URL} />
            </Helmet>
            <AnnouncementTicker />
            <OfflineBanner />
            <header className="border-b border-black/5 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        {user?.branding?.logoUrl ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/5 bg-white flex items-center justify-center p-1">
                                <img src={user.branding.logoUrl} alt={`${user.collegeName} logo`} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-primary border border-primary/30 text-xs md:text-base shrink-0" aria-hidden="true">
                                {user?.collegeName ? user.collegeName[0] : 'N'}
                            </div>
                        )}
                        <h1 className="text-lg md:text-xl font-black italic tracking-tighter truncate text-slate-800 uppercase">
                            {user?.collegeName || SITE_NAME}
                        </h1>
                    </div>

                    <nav className="flex items-center gap-1 md:gap-4" aria-label="User navigation">
                        <ThemeToggle />
                        <PushNotificationManager />
                        <NotificationBell />

                        <div className="hidden xs:block h-6 md:h-8 w-[1px] bg-black/5 mx-1 md:mx-2" aria-hidden="true" />

                        <div className="hidden lg:flex flex-col items-end text-right">
                            <span className="text-sm font-bold text-slate-700 leading-none">{user?.name}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mt-1">{user?.role}</span>
                        </div>

                        <button
                            onClick={logout}
                            aria-label="Logout"
                            className="p-2 md:p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg md:rounded-xl border border-black/5 transition-all group"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </header>
            <main id="main-content" className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-1">{children}</main>

            <footer className="mt-auto py-6 text-center border-t border-black/5 bg-white/30 backdrop-blur-sm">
                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary/60" aria-hidden="true" />
                    Made with care by TalentNest
                    <Sparkles className="w-4 h-4 text-primary/60" aria-hidden="true" />
                </p>
            </footer>

            {user?.role === 'STUDENT' && <AIChatBubble />}
        </div>
    );
}
