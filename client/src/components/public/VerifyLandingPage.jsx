import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, QrCode, User, CheckCircle2, ArrowRight } from 'lucide-react';
import Seo, { siteBaseSchemas, webPageSchema, breadcrumbSchema } from '../ui/Seo';
import { SITE_NAME } from '../../lib/seo';

const VERIFY_POINTS = [
    { icon: QrCode, title: 'Scan or Open the Link', desc: 'Every hall ticket carries a QR code and a verification link that points here.' },
    { icon: User, title: 'Ticket Details Shown', desc: 'The verification page displays the student name, issue date, approved subjects and a unique validation ID.' },
    { icon: ShieldCheck, title: 'Authenticity Confirmed', desc: 'A green authentic badge confirms the ticket was legitimately generated. Invalid or edited tickets are flagged red.' },
];

export default function VerifyLandingPage() {
    return (
        <Seo
            pageKey="verify"
            jsonLd={[
                ...siteBaseSchemas(),
                webPageSchema('/verify', undefined, 'Verify a NoDueNest clearance or hall ticket'),
                breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Verify Clearance', path: '/verify' }]),
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebApplication',
                    name: `${SITE_NAME} Ticket Verification`,
                    url: 'https://smart-no-due-clearance.vercel.app/verify',
                    description: 'Publicly verify the authenticity of a NoDueNest hall ticket or clearance using its QR code or verification link.',
                    applicationCategory: 'SecurityApplication',
                    operatingSystem: 'All',
                },
            ]}
        >
            {/* Hero */}
            <section className="premium-gradient relative overflow-hidden" aria-labelledby="verify-hero-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-24 text-center relative">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold tracking-wide mb-6">
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Official Verification Service
                    </span>
                    <h1 id="verify-hero-title" className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
                        Authenticate Any {SITE_NAME} <span className="text-amber-400">Hall Ticket</span>
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
                        Employers, registrars and institutions can instantly confirm whether a hall ticket or clearance
                        is genuine — no login required.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary font-black shadow-2xl shadow-black/20 hover:-translate-y-0.5 transition-all">
                            Open Ticket Verification <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </Link>
                        <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/30 text-white font-black hover:bg-white/10 transition-colors">
                            Report a Suspicious Ticket
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20" aria-labelledby="verify-how-title">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-14">
                        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">How verification works</span>
                        <h2 id="verify-how-title" className="font-heading text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mt-3 mb-4">
                            Three Steps to <span className="text-primary">Certainty</span>
                        </h2>
                    </div>
                    <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {VERIFY_POINTS.map(({ icon: Icon, title, desc }, i) => (
                            <li key={title} className="glass rounded-3xl p-8 card-hover relative">
                                <span className="absolute top-6 right-8 text-5xl font-black text-slate-100" aria-hidden="true">0{i + 1}</span>
                                <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg shadow-primary/20" aria-hidden="true">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-slate-800 mb-2 font-heading">{title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Trust strip */}
            <section className="py-20 premium-gradient-soft" aria-labelledby="verify-trust-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
                    <div className="w-16 h-16 mx-auto premium-gradient rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20" aria-hidden="true">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 id="verify-trust-title" className="font-heading text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mb-4">
                        Forged Tickets Don't Stand a Chance
                    </h2>
                    <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto mb-8">
                        Each ticket's validation code is cryptographically tied to the issued record. Any modification —
                        changed dates, altered subjects, doctored names — breaks the match, and the system reports the
                        ticket as invalid immediately.
                    </p>
                    <ul className="flex flex-wrap justify-center gap-3">
                        {['Cryptographically verified', 'No login required', 'Instant result', 'Free for all users'].map((p) => (
                            <li key={p} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" /> {p}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20" aria-labelledby="verify-cta-title">
                <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
                    <h2 id="verify-cta-title" className="font-heading text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mb-6">
                        Want the Same Protection for Your Institution?
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl premium-gradient text-white font-black shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all">
                            Request a Demo <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </Link>
                        <Link to="/features" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-slate-200 text-slate-700 font-black hover:border-primary/30 hover:text-primary transition-colors">
                            Explore Features
                        </Link>
                    </div>
                </div>
            </section>
        </Seo>
    );
}
