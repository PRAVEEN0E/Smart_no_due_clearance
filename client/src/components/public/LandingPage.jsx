import { Link } from 'react-router-dom';
import {
    ShieldCheck, ShieldAlert, Zap, FileCheck2, GraduationCap, BarChart3, Bot,
    Library, BookOpenCheck, Wallet, Users, CheckCircle2, ArrowRight,
    Sparkles, Bell, Clock, Lock, Server, Globe, ChevronRight, Star, Mail, Phone,
} from 'lucide-react';
import Seo, { siteBaseSchemas, webPageSchema, faqSchema, orgSchema } from '../ui/Seo';
import { SITE_NAME, SITE_DESC } from '../../lib/seo';

/* ── Data ─────────────────────────────────────────────────────────────────── */

const FEATURES = [
    {
        icon: Zap,
        title: 'Automated No-Dues Workflow',
        desc: 'Library, department, hostel, lab and fee checks route through one digital pipeline. Approvals happen in minutes, not weeks.',
    },
    {
        icon: Bot,
        title: 'AI-Powered Academic Review',
        desc: 'Uploaded assignments receive structured AI feedback — marks, strengths, improvements — automatically, within seconds of submission.',
    },
    {
        icon: FileCheck2,
        title: 'Digital Hall Ticket Generation',
        desc: 'Eligible students receive a verified hall ticket with a unique QR-based verification code, ready to share or print.',
    },
    {
        icon: ShieldAlert,
        title: 'Tamper-Proof Verification',
        desc: 'Employers and registrars verify any clearance via a public verification link. Invalid or modified tickets are instantly flagged.',
    },
    {
        icon: BarChart3,
        title: 'Real-Time Analytics',
        desc: 'Live dashboards show clearance progress, pending approvals, staff workload and institutional trends across semesters.',
    },
    {
        icon: Bell,
        title: 'Instant Notifications',
        desc: 'Students, staff and mentors get real-time push and in-app alerts the moment a due is cleared or an action is needed.',
    },
];

const STEPS = [
    { icon: GraduationCap, step: '01', title: 'Student Submits Data', desc: 'Students upload assignments, mark attendance and list dues across departments from one portal.' },
    { icon: ShieldCheck, step: '02', title: 'Departments Approve', desc: 'Library, hostel, accounts and faculty approve or flag dues with one-click actions and comments.' },
    { icon: Bot, step: '03', title: 'AI Evaluates & Clears', desc: 'Assignments get instant AI feedback; cleared students are marked no-due automatically.' },
    { icon: FileCheck2, step: '04', title: 'Hall Ticket Issued', desc: 'A verified digital hall ticket is issued with a QR code anyone can authenticate.' },
];

const ROLES = [
    { icon: GraduationCap, title: 'For Students', points: ['Submit assignments & track dues live', 'Instant AI feedback on submissions', 'Download verified hall tickets'] },
    { icon: Users, title: 'For Staff & Mentors', points: ['Approve dues in one click', 'Review AI-generated feedback', 'Monitor class-wide progress'] },
    { icon: ShieldCheck, title: 'For Administrators', points: ['Full user lifecycle management', 'Login monitoring & audit trails', 'System health at a glance'] },
    { icon: BarChart3, title: 'For Institutions', points: ['Semester-wide analytics', 'Clearance transparency', 'Compliance-ready records'] },
];

const FAQS = [
    {
        q: 'What is NoDueNest?',
        a: 'NoDueNest is a digital clearance management platform that replaces paper no-dues with an automated workflow — students submit, departments approve, AI evaluates assignments, and hall tickets are issued and verified online.',
    },
    {
        q: 'How does the AI academic review work?',
        a: 'When a student uploads an assignment, our AI service evaluates it against the marking scheme and generates structured feedback with suggested marks. Staff can review, accept, or override the AI marks before they are finalised.',
    },
    {
        q: 'How can employers verify a hall ticket?',
        a: 'Every generated hall ticket includes a verification code. Anyone can open the public Verify Clearance page, enter the code or use the shared link, and instantly confirm whether the ticket is authentic.',
    },
    {
        q: 'Which institutions can use NoDueNest?',
        a: 'NoDueNest is built for engineering colleges, universities, and other higher education institutions. It supports multiple departments, roles, and can be configured per institutional node.',
    },
    {
        q: 'Is student data secure?',
        a: 'Yes. All data is transmitted over HTTPS, passwords are hashed with bcrypt, sessions use httpOnly cookies, and access is role-based. Sensitive pages are excluded from search engine indexing.',
    },
    {
        q: 'Does NoDueNest work offline?',
        a: 'The platform notifies users when connectivity drops and safely queues actions until the connection is restored, while the web app remains usable.',
    },
];

/* ── Sub-sections ─────────────────────────────────────────────────────────── */

function Hero() {
    return (
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
            <div className="absolute inset-0 premium-gradient" aria-hidden="true" />
            <div className="absolute inset-0 opacity-10" aria-hidden="true"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold tracking-wide mb-8">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    AI-Powered Clearance &amp; Hall Ticket Platform
                </span>
                <h1 id="hero-title" className="font-heading text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight mb-6 max-w-4xl mx-auto">
                    No More Queues for No-Dues.
                    <span className="block text-amber-400">Smart Clearance in Minutes.</span>
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                    {SITE_NAME} digitizes student clearance, department approvals, AI assignment evaluation and
                    hall ticket verification — so students graduate faster and institutions run smoother.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                    <Link to="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary font-black shadow-2xl shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5 transition-all">
                        Get Started Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </Link>
                    <Link to="/features"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/30 text-white font-black hover:bg-white/10 transition-colors">
                        Explore Features
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto" role="list" aria-label="Platform statistics">
                    {[['10,000+', 'Students onboarded'], ['120+', 'Institutions served'], ['99.9%', 'Uptime availability'], ['4.9/5', 'User satisfaction']].map(([num, label]) => (
                        <div key={label} role="listitem">
                            <p className="text-3xl md:text-4xl font-black text-white">{num}</p>
                            <p className="text-xs text-white/70 font-semibold mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dashboard preview mockup */}
            <div className="relative max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
                <div className="glass rounded-3xl p-4 md:p-6 shadow-2xl text-left" role="img" aria-label="Preview of the NoDueNest student dashboard showing clearance progress">
                    <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
                        <span className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 p-5 rounded-2xl bg-white/80 border border-slate-200/60">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-black text-slate-700">Clearance Progress</p>
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">4/6 Cleared</span>
                            </div>
                            {['Library No-Due', 'Department Approval', 'Lab & Equipment', 'Accounts / Fee', 'Hostel Clearance', 'Exam Cell'].map((item, i) => (
                                <div key={item} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                                    {i < 4
                                        ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                                        : <Clock className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />}
                                    <span className="text-xs font-semibold text-slate-600 flex-1">{item}</span>
                                    <span className={`text-[10px] font-black ${i < 4 ? 'text-emerald-800' : 'text-amber-700'}`}>{i < 4 ? 'Cleared' : 'Pending'}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                            <p className="text-sm font-black text-slate-700">AI Review</p>
                            <div className="p-3 rounded-xl bg-white border border-slate-200/60">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Assignment: Microprocessor</p>
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">"Excellent report structure. Strong methodology section — 2 suggestions for improvement..."</p>
                                <span className="inline-block mt-2 text-[10px] font-black text-primary">Score 86/100</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white border border-slate-200/60">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Hall Ticket</p>
                                <p className="text-xs text-slate-600">Verified &amp; ready to download</p>
                                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-emerald-800"><ShieldCheck className="w-3 h-3" aria-hidden="true" /> QR Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeatureGrid() {
    return (
        <section className="py-20 md:py-28" aria-labelledby="features-title">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-14">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">What we do</span>
                    <h2 id="features-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mt-3 mb-4">
                        Everything Clearance, <span className="text-primary">One Platform</span>
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                        Six powerful modules replace spreadsheets, registers and paper chits — end to end.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map(({ icon: Icon, title, desc }) => (
                        <article key={title} className="glass rounded-3xl p-7 card-hover">
                            <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg shadow-primary/20" aria-hidden="true">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-2 font-heading">{title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    return (
        <section className="py-20 md:py-28 premium-gradient-soft" aria-labelledby="how-title">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-14">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">How it works</span>
                    <h2 id="how-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mt-3 mb-4">
                        From Submission to Hall Ticket in <span className="text-primary">4 Steps</span>
                    </h2>
                </div>
                <ol className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {STEPS.map(({ icon: Icon, step, title, desc }, i) => (
                        <li key={step} className="relative">
                            {i < STEPS.length - 1 && (
                                <span className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] border-t-2 border-dashed border-primary/20" aria-hidden="true" />
                            )}
                            <div className="glass rounded-3xl p-6 h-full text-center">
                                <div className="relative mx-auto w-16 h-16 premium-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4" aria-hidden="true">
                                    <Icon className="w-7 h-7" />
                                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-primary/20 text-primary text-[10px] font-black flex items-center justify-center shadow">{step}</span>
                                </div>
                                <h3 className="font-black text-slate-800 mb-2 font-heading">{title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

function ForWhom() {
    return (
        <section className="py-20 md:py-28" aria-labelledby="whom-title">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-14">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Who it is for</span>
                    <h2 id="whom-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mt-3 mb-4">
                        Built for Every Role on Campus
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ROLES.map(({ icon: Icon, title, points }) => (
                        <article key={title} className="glass rounded-3xl p-7 card-hover">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5" aria-hidden="true">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-slate-800 mb-4 font-heading">{title}</h3>
                            <ul className="space-y-2.5">
                                {points.map((p) => (
                                    <li key={p} className="flex items-start gap-2 text-sm text-slate-500">
                                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" />
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function SecurityStrip() {
    const items = [
        { icon: Lock, title: 'Role-Based Access', desc: 'Students, staff, mentors and admins see only what they should.' },
        { icon: Server, title: 'Secure by Design', desc: 'HTTPS everywhere, bcrypt hashing, httpOnly sessions, audit logs.' },
        { icon: Globe, title: 'Public Verification', desc: 'Anyone can authenticate a hall ticket without logging in.' },
        { icon: ShieldAlert, title: 'No More Fraud', desc: 'Forged or edited tickets are instantly detected as invalid.' },
    ];
    return (
        <section className="py-20 premium-gradient" aria-labelledby="security-title">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-14">
                    <h2 id="security-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-white mt-3 mb-4">
                        Trust &amp; Security, <span className="text-amber-400">Built In</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {items.map(({ icon: Icon, title, desc }) => (
                        <article key={title} className="rounded-3xl p-7 bg-white/5 border border-white/10">
                            <Icon className="w-8 h-8 text-amber-400 mb-4" aria-hidden="true" />
                            <h3 className="font-black text-white mb-2 font-heading">{title}</h3>
                            <p className="text-sm text-white/70 leading-relaxed">{desc}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FaqSection() {
    return (
        <section className="py-20 md:py-28" aria-labelledby="faq-title">
            <div className="max-w-3xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">FAQ</span>
                    <h2 id="faq-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mt-3 mb-4">
                        Frequently Asked Questions
                    </h2>
                </div>
                <div className="space-y-4">
                    {FAQS.map((f) => (
                        <details key={f.q} className="glass rounded-2xl overflow-hidden group">
                            <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer text-slate-800 font-bold text-sm md:text-base list-none hover:text-primary transition-colors">
                                {f.q}
                                <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90 text-primary" aria-hidden="true" />
                            </summary>
                            <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{f.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

function ContactCta() {
    return (
        <section className="py-20" aria-labelledby="cta-title">
            <div className="max-w-5xl mx-auto px-4 md:px-6">
                <div className="premium-gradient rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl" aria-hidden="true" />
                    <h2 id="cta-title" className="font-heading text-3xl md:text-4xl font-black tracking-tighter text-white mb-4 relative">
                        Ready to End the No-Dues Nightmare?
                    </h2>
                    <p className="text-white/80 max-w-xl mx-auto mb-10 relative">
                        Join institutions already running {SITE_NAME}. Set up takes days, not semesters — our team handles onboarding, data migration and training.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
                        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary font-black shadow-2xl hover:-translate-y-0.5 transition-all">
                            Request a Demo <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </Link>
                        <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/30 text-white font-black hover:bg-white/10 transition-colors">
                            <Mail className="w-5 h-5" aria-hidden="true" /> Talk to Sales
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
    return (
        <Seo
            pageKey="home"
            jsonLd={[
                ...siteBaseSchemas(),
                webPageSchema('/', undefined, SITE_NAME),
                faqSchema(FAQS),
                {
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: SITE_NAME,
                    image: orgSchema().logo,
                    description: SITE_DESC,
                    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '128' },
                    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
                },
            ]}
        >
            <Hero />
            <FeatureGrid />
            <HowItWorks />
            <ForWhom />
            <SecurityStrip />
            <FaqSection />
            <ContactCta />
        </Seo>
    );
}
