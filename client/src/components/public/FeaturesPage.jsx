import { Link } from 'react-router-dom';
import {
    Zap, Bot, FileCheck2, ShieldAlert, BarChart3, Bell, GraduationCap, Users,
    ShieldCheck, Library, Wallet, BookOpenCheck, LayoutDashboard, QrCode,
    CheckCircle2, ArrowRight,
} from 'lucide-react';
import Seo, { siteBaseSchemas, webPageSchema, breadcrumbSchema } from '../ui/Seo';
import { SITE_NAME } from '../../lib/seo';

const CORE = [
    { icon: Zap, title: 'Automated No-Dues Workflow', desc: 'Library, department, hostel, lab, accounts and exam-cell checks route through one digital pipeline with live status tracking. Approvals happen in minutes, not weeks.', points: ['One-click approve or flag', 'Per-department due tracking', 'Live student status view'] },
    { icon: Bot, title: 'AI Academic Review', desc: 'Every uploaded assignment receives structured AI feedback with suggested marks, strengths and improvements — giving students instant evaluation and staff a head start.', points: ['Structured feedback reports', 'Staff override & finalisation', 'Groq-powered, low latency'] },
    { icon: FileCheck2, title: 'Digital Hall Ticket Generation', desc: 'Eligible students automatically get a verified hall ticket with a unique QR-based verification code, downloadable and shareable.', points: ['Auto-eligibility checks', 'QR verification code', 'Shareable verification link'] },
    { icon: ShieldAlert, title: 'Tamper-Proof Verification', desc: 'Anyone can authenticate a hall ticket through the public verification page — invalid or edited tickets are flagged instantly.', points: ['Public verify endpoint', 'Instant invalid detection', 'No login required'] },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Institutional dashboards surface clearance progress, pending approvals, staff workload and semester trends as they happen.', points: ['Live progress cards', 'Trend & workload views', 'Exportable stats'] },
    { icon: Bell, title: 'Instant Notifications', desc: 'Push and in-app alerts keep students, staff and mentors updated the moment a due clears or an action is required.', points: ['Real-time push alerts', 'Announcement ticker', 'Per-role targeting'] },
];

const ROLE_TABS = [
    { icon: GraduationCap, role: 'Student Portal', desc: 'Everything a student needs in one place — from assignment submission to hall ticket download.', features: ['Upload assignments & materials', 'Track clearance progress live', 'AI feedback on submissions', 'Download verified hall tickets', 'Chat with the AI assistant'] },
    { icon: Users, role: 'Staff & Mentor Console', desc: 'Powerful review and approval tools built for faculty workloads.', features: ['One-click due approvals', 'Review AI-generated marks', 'Class-wide progress views', 'Publish study materials', 'Mentor-wide student overviews'] },
    { icon: ShieldCheck, role: 'Super Admin Suite', desc: 'Enterprise control for administrators running whole institutions.', features: ['User lifecycle management', 'Login monitoring & audit logs', 'Broadcast announcements', 'API key management', 'System health & rate-limit settings'] },
];

export default function FeaturesPage() {
    return (
        <Seo
            pageKey="features"
            jsonLd={[
                ...siteBaseSchemas(),
                webPageSchema('/features', undefined, 'NoDueNest features'),
                breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Features', path: '/features' }]),
                {
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: 'NoDueNest features',
                    itemListElement: CORE.map((f, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        name: f.title,
                        description: f.desc,
                    })),
                },
            ]}
        >
            {/* Hero */}
            <section className="premium-gradient relative overflow-hidden" aria-labelledby="features-hero-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-24 text-center relative">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold tracking-wide mb-6">
                        <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" /> Platform Features
                    </span>
                    <h1 id="features-hero-title" className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
                        Powerful Tools, <span className="text-amber-400">Zero Paperwork</span>
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
                        Every feature is designed around one goal: move students from submission to a verified hall
                        ticket with the least possible friction.
                    </p>
                </div>
            </section>

            {/* Core feature cards */}
            <section className="py-20" aria-labelledby="core-title">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-14">
                        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Core modules</span>
                        <h2 id="core-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mt-3 mb-4">
                            The Clearance <span className="text-primary">Engine Room</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {CORE.map(({ icon: Icon, title, desc, points }) => (
                            <article key={title} className="glass rounded-3xl p-8 card-hover">
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 premium-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0" aria-hidden="true">
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 mb-2 font-heading">{title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed mb-4">{desc}</p>
                                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {points.map((p) => (
                                                <li key={p} className="flex items-start gap-1.5 text-xs text-slate-600 font-semibold">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" aria-hidden="true" /> {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Role tabs */}
            <section className="py-20 premium-gradient-soft" aria-labelledby="roles-title">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-14">
                        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Dashboards</span>
                        <h2 id="roles-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mt-3 mb-4">
                            One Platform, <span className="text-primary">Three Experiences</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {ROLE_TABS.map(({ icon: Icon, role, desc, features }) => (
                            <article key={role} className="glass rounded-3xl p-8 card-hover flex flex-col">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5" aria-hidden="true">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2 font-heading">{role}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-5">{desc}</p>
                                <ul className="space-y-2.5 mt-auto">
                                    {features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                                            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integration strip */}
            <section className="py-20" aria-labelledby="extras-title">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                        <h2 id="extras-title" className="font-heading text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
                            And the Little Things That Matter
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[
                            { icon: QrCode, label: 'QR hall tickets' },
                            { icon: Library, label: 'Study materials hub' },
                            { icon: Wallet, label: 'Fee verification' },
                            { icon: BookOpenCheck, label: 'Marking schemes' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="glass rounded-2xl p-6 text-center card-hover">
                                <Icon className="w-7 h-7 text-primary mx-auto mb-3" aria-hidden="true" />
                                <p className="text-sm font-black text-slate-700">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl premium-gradient text-white font-black shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all">
                            Try {SITE_NAME} Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>
        </Seo>
    );
}
