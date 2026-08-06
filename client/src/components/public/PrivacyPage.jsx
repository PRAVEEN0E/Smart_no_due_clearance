import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Database, Eye, Cookie, FileText } from 'lucide-react';
import Seo, { siteBaseSchemas, webPageSchema, breadcrumbSchema } from '../ui/Seo';
import { SITE_NAME } from '../../lib/seo';

const SECTIONS = [
    { icon: Database, title: '1. Information We Collect', body: ['Account information you provide at registration: name, email, role, college affiliation, and student details such as roll number and department.', 'Academic data you upload or generate: assignments, study materials, marks, clearance statuses, and hall tickets.', 'Technical data collected automatically: IP address, browser type, device information, and usage patterns for security and performance.'] },
    { icon: Eye, title: '2. How We Use Your Information', body: ['To operate the platform: process clearances, evaluate assignments, generate hall tickets, and send notifications.', 'To verify authenticity: public verification pages display only the information needed to confirm a ticket.', 'To improve the service: anonymized analytics help us fix bugs and design better features.'] },
    { icon: Lock, title: '3. Data Storage & Security', body: ['All data is transmitted over HTTPS and stored with encryption at rest.', 'Passwords are hashed using bcrypt — we never store plain-text passwords.', 'Access is role-based: students, staff, mentors and administrators see only the data their role requires.', 'Sessions use secure, httpOnly cookies to prevent cross-site scripting token theft.'] },
    { icon: Cookie, title: '4. Cookies & Local Storage', body: ['We use strictly necessary cookies and local storage for authentication and preferences.', 'We do not sell or share your personal data with third-party advertisers.', 'You may clear cookies at any time; this will sign you out but will not delete your account data.'] },
    { icon: FileText, title: '5. Your Rights', body: ['You may request access to, correction of, or deletion of your personal data at any time.', 'Institutional records may be subject to your college\'s retention policies; contact your administrator for institution-held records.', 'To exercise your rights, email hello@noduenest.app with your registered email address.'] },
    { icon: ShieldCheck, title: '6. Changes to This Policy', body: ['We may update this policy as the platform evolves. Material changes will be announced in-app and on this page.', 'Continued use of the platform after changes take effect constitutes acceptance of the updated policy.'] },
];

export default function PrivacyPage() {
    return (
        <Seo
            pageKey="privacy"
            jsonLd={[
                ...siteBaseSchemas(),
                webPageSchema('/privacy', undefined, 'NoDueNest privacy policy'),
                breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Privacy Policy', path: '/privacy' }]),
            ]}
        >
            <section className="premium-gradient" aria-labelledby="privacy-hero-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20 text-center relative">
                    <h1 id="privacy-hero-title" className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-white/80 max-w-xl mx-auto">Last updated: August 2026</p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-8">
                    <p className="text-slate-500 leading-relaxed">
                        {SITE_NAME} ("we", "our", "us") is committed to protecting the privacy of students, staff and
                        administrators who use our clearance and hall ticket management platform. This policy explains
                        what we collect, why we collect it, and how we keep it safe.
                    </p>
                    {SECTIONS.map(({ icon: Icon, title, body }) => (
                        <article key={title} className="glass rounded-3xl p-7">
                            <h2 className="flex items-center gap-3 text-lg font-black text-slate-800 mb-3 font-heading">
                                <span className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center text-white shrink-0" aria-hidden="true">
                                    <Icon className="w-4.5 h-4.5" />
                                </span>
                                {title}
                            </h2>
                            <ul className="space-y-2.5">
                                {body.map((b) => (
                                    <li key={b} className="text-sm text-slate-500 leading-relaxed flex items-start gap-2">
                                        <span className="text-primary mt-1" aria-hidden="true">•</span>{b}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Questions about this policy? Contact us at{' '}
                        <a href="mailto:hello@noduenest.app" className="text-primary font-bold hover:underline">hello@noduenest.app</a>{' '}
                        or read our{' '}
                        <Link to="/terms" className="text-primary font-bold hover:underline">Terms of Service</Link>.
                    </p>
                </div>
            </section>
        </Seo>
    );
}
