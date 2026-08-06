import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Seo, { siteBaseSchemas, webPageSchema, breadcrumbSchema } from '../ui/Seo';
import { SITE_NAME } from '../../lib/seo';

const CONTACT_CHANNELS = [
    { icon: Mail, title: 'Email Us', line1: 'hello@noduenest.app', line2: 'support@noduenest.app', href: 'mailto:hello@noduenest.app' },
    { icon: Phone, title: 'Call Us', line1: '+91 98765 43210', line2: 'Mon–Sat, 9am–7pm IST', href: 'tel:+919876543210' },
    { icon: MapPin, title: 'Head Office', line1: 'Coimbatore, Tamil Nadu', line2: 'India', href: undefined },
];

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const onSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <Seo
            pageKey="contact"
            jsonLd={[
                ...siteBaseSchemas(),
                webPageSchema('/contact', undefined, 'Contact NoDueNest'),
                breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]),
                {
                    '@context': 'https://schema.org',
                    '@type': 'ContactPage',
                    url: 'https://smart-no-due-clearance.vercel.app/contact',
                    name: `Contact ${SITE_NAME}`,
                    isPartOf: { '@id': 'https://smart-no-due-clearance.vercel.app/#website' },
                },
            ]}
        >
            {/* Hero */}
            <section className="premium-gradient relative overflow-hidden" aria-labelledby="contact-hero-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-24 text-center relative">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold tracking-wide mb-6">
                        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> We reply within one business day
                    </span>
                    <h1 id="contact-hero-title" className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
                        Let's Talk About <span className="text-amber-400">Your Campus</span>
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
                        Questions about {SITE_NAME}, demos for your institution, or partnership ideas — we would love to hear from you.
                    </p>
                </div>
            </section>

            {/* Channels */}
            <section className="py-16" aria-labelledby="channels-title">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <h2 id="channels-title" className="sr-only">Contact channels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {CONTACT_CHANNELS.map(({ icon: Icon, title, line1, line2, href }) => (
                            <article key={title} className="glass rounded-3xl p-7 card-hover text-center">
                                <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary/20" aria-hidden="true">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-slate-800 mb-1 font-heading">{title}</h3>
                                {href ? (
                                    <a href={href} className="block text-sm font-semibold text-primary hover:underline">{line1}</a>
                                ) : (
                                    <p className="text-sm font-semibold text-slate-600">{line1}</p>
                                )}
                                <p className="text-xs text-slate-400 font-medium mt-1">{line2}</p>
                            </article>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {/* Form */}
                        <div className="glass rounded-3xl p-8">
                            {submitted ? (
                                <div className="text-center py-16" role="status">
                                    <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2 font-heading">Message Sent!</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Thank you for reaching out. Our team will get back to you within one business day.
                                    </p>
                                    <Link to="/" className="inline-flex items-center gap-2 mt-6 text-sm font-black text-primary hover:underline">
                                        Back to Home <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={onSubmit} aria-labelledby="form-title">
                                    <h2 id="form-title" className="text-2xl font-black text-slate-800 mb-6 font-heading">Send Us a Message</h2>
                                    <div className="space-y-5">
                                        <div>
                                            <label htmlFor="contact-name" className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                                            <input id="contact-name" name="name" required className="input-modern" placeholder="Your name" autoComplete="name" />
                                        </div>
                                        <div>
                                            <label htmlFor="contact-email" className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
                                            <input id="contact-email" name="email" type="email" required className="input-modern" placeholder="you@college.edu" autoComplete="email" />
                                        </div>
                                        <div>
                                            <label htmlFor="contact-institution" className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Institution</label>
                                            <input id="contact-institution" name="institution" className="input-modern" placeholder="College / university name" />
                                        </div>
                                        <div>
                                            <label htmlFor="contact-message" className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Message</label>
                                            <textarea id="contact-message" name="message" rows="5" required className="input-modern resize-none" placeholder="Tell us what you need..." />
                                        </div>
                                        <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl premium-gradient text-white font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                                            Send Message <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Info panel */}
                        <aside className="glass rounded-3xl p-8 premium-gradient-soft" aria-labelledby="demo-title">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 premium-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20" aria-hidden="true">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <h2 id="demo-title" className="text-xl font-black text-slate-800 font-heading">Prefer a Live Demo?</h2>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                Book a 30-minute walkthrough with our team. We will set up a sandbox node, walk you
                                through the full clearance lifecycle, and share an onboarding plan tailored to your
                                institution.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {['Live product walkthrough', 'Onboarding & migration plan', 'Pricing tailored to institution size'].map((item) => (
                                    <li key={item} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl premium-gradient text-white font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                                Request a Demo <ArrowRight className="w-5 h-5" aria-hidden="true" />
                            </Link>
                        </aside>
                    </div>
                </div>
            </section>
        </Seo>
    );
}
