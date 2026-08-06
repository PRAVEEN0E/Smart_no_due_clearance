import { Link } from 'react-router-dom';
import { Target, Eye, Heart, Rocket, ShieldCheck, Users, GraduationCap, Sparkles } from 'lucide-react';
import Seo, { siteBaseSchemas, webPageSchema, breadcrumbSchema } from '../ui/Seo';
import { SITE_NAME } from '../../lib/seo';

const VALUES = [
    { icon: Target, title: 'Simplicity', desc: 'Clearance used to mean paper trails and long queues. We design flows that take minutes, not weeks.' },
    { icon: Eye, title: 'Transparency', desc: 'Every approval, evaluation and verification is traceable. Institutions know exactly where things stand.' },
    { icon: Heart, title: 'Student-First', desc: 'Every feature exists to get students through graduation faster and with less friction.' },
    { icon: ShieldCheck, title: 'Trust', desc: 'Security and data protection are non-negotiable. Verified tickets, audited actions, secure storage.' },
];

const TIMELINE = [
    { year: '2025', title: 'The Idea', desc: 'We watched a final-year student queue for three days across five departments for a single no-due signature. That was the catalyst.' },
    { year: '2025', title: 'First Node Live', desc: 'The first engineering college node went live with digital clearances, staff dashboards and QR-verified hall tickets.' },
    { year: '2026', title: 'AI Academic Review', desc: 'Assignment evaluation became AI-assisted, giving students instant structured feedback and staff a powerful review tool.' },
    { year: '2026', title: 'Enterprise Scale', desc: 'Super-admin tooling, login monitoring, API keys, system health and broadcast features made NoDueNest ready for multi-institution deployments.' },
];

export default function AboutPage() {
    return (
        <Seo
            pageKey="about"
            jsonLd={[
                ...siteBaseSchemas(),
                webPageSchema('/about', undefined, 'About NoDueNest'),
                breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]),
                {
                    '@context': 'https://schema.org',
                    '@type': 'AboutPage',
                    url: 'https://smart-no-due-clearance.vercel.app/about',
                    name: `About ${SITE_NAME}`,
                    isPartOf: { '@id': 'https://smart-no-due-clearance.vercel.app/#website' },
                },
            ]}
        >
            {/* Hero */}
            <section className="premium-gradient relative overflow-hidden" aria-labelledby="about-hero-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-24 text-center relative">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold tracking-wide mb-6">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Our Story
                    </span>
                    <h1 id="about-hero-title" className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
                        We Built What Students <span className="text-amber-400">Actually Needed</span>
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
                        {SITE_NAME} started with a simple frustration: clearance systems that ran on paper, queues and
                        guesswork. Today it is an AI-powered platform keeping graduation on track for thousands of students.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20" aria-labelledby="mission-title">
                <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Our mission</span>
                        <h2 id="mission-title" className="font-heading text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mt-3 mb-5">
                            Every student cleared on time, every ticket verifiable.
                        </h2>
                        <p className="text-slate-500 leading-relaxed mb-4">
                            No-due clearance is the last gate before a degree — yet it is run on torn registers and
                            contradictory spreadsheets. We digitize the entire journey: students see exactly what is
                            pending, departments approve in one click, AI accelerates evaluation, and hall tickets carry
                            a verification code anyone can check.
                        </p>
                        <p className="text-slate-500 leading-relaxed">
                            The result? Hall tickets issued in days instead of weeks, fraud eliminated, and staff time
                            returned to teaching.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl premium-gradient text-white font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                                Get Started <GraduationCap className="w-5 h-5" aria-hidden="true" />
                            </Link>
                            <Link to="/features" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-black hover:border-primary/30 hover:text-primary transition-colors">
                                See Features
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {VALUES.map(({ icon: Icon, title, desc }) => (
                            <article key={title} className="glass rounded-3xl p-6 card-hover">
                                <div className="w-11 h-11 premium-gradient rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20" aria-hidden="true">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-slate-800 mb-2 font-heading">{title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 premium-gradient-soft" aria-labelledby="timeline-title">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-14">
                        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Milestones</span>
                        <h2 id="timeline-title" className="font-heading text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mt-3">
                            The Road So Far
                        </h2>
                    </div>
                    <ol className="relative border-l-2 border-primary/20 ml-4 space-y-10">
                        {TIMELINE.map((t) => (
                            <li key={t.title} className="relative pl-10">
                                <span className="absolute -left-[11px] top-1 w-5 h-5 premium-gradient rounded-full border-4 border-white shadow" aria-hidden="true" />
                                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/15 rounded-full px-3 py-1 mb-2">
                                    {t.year}
                                </span>
                                <h3 className="font-black text-slate-800 mb-1.5 font-heading text-lg">{t.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{t.desc}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Team strip */}
            <section className="py-20" aria-labelledby="team-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
                    <div className="w-16 h-16 mx-auto premium-gradient rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20" aria-hidden="true">
                        <Users className="w-8 h-8" />
                    </div>
                    <h2 id="team-title" className="font-heading text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mb-4">
                        Made with Care by <span className="text-primary">TalentNest</span>
                    </h2>
                    <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto mb-8">
                        We are a small team of engineers and educators who believe institutional software should feel
                        modern, mobile-first and human. No outdated ERP pain — just software that respects your time.
                    </p>
                    <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl premium-gradient text-white font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                        <Rocket className="w-5 h-5" aria-hidden="true" /> Work With Us
                    </Link>
                </div>
            </section>
        </Seo>
    );
}
