import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, FileCheck2, AlertTriangle, HelpCircle, Ban } from 'lucide-react';
import Seo, { siteBaseSchemas, webPageSchema, breadcrumbSchema } from '../ui/Seo';
import { SITE_NAME } from '../../lib/seo';

const SECTIONS = [
    { icon: Scale, title: '1. Acceptance of Terms', body: 'By accessing or using the NoDueNest platform, you agree to be bound by these Terms of Service. If you use the platform on behalf of an institution, you confirm you are authorised to accept these terms for that institution.' },
    { icon: FileCheck2, title: '2. Accounts & Eligibility', body: 'You must provide accurate information when creating an account. Student accounts must be associated with a registered institution. You are responsible for safeguarding your credentials — accounts are non-transferable.' },
    { icon: ShieldCheck, title: '3. Institutional Responsibilities', body: 'Institutions are responsible for configuring roles, approving or rejecting clearances, and ensuring submitted data is accurate. NoDueNest provides the software; academic decisions remain with the institution.' },
    { icon: Ban, title: '4. Acceptable Use', body: 'You agree not to misuse the platform: no unauthorised access, no attempts to bypass verification, no uploading of malicious content, and no use of the service to misrepresent clearance status. Verified tickets are generated only through legitimate clearance.' },
    { icon: AlertTriangle, title: '5. AI-Assisted Evaluation', body: 'AI-generated feedback and marks are suggestions. Final academic decisions rest with the institution\'s staff. NoDueNest is not liable for academic outcomes based on AI suggestions that staff chose to accept.' },
    { icon: HelpCircle, title: '6. Limitation of Liability', body: 'The platform is provided "as is" without warranties of any kind. To the maximum extent permitted by law, NoDueNest shall not be liable for indirect, incidental or consequential damages arising from use of the service.' },
];

export default function TermsPage() {
    return (
        <Seo
            pageKey="terms"
            jsonLd={[
                ...siteBaseSchemas(),
                webPageSchema('/terms', undefined, 'NoDueNest terms of service'),
                breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Terms of Service', path: '/terms' }]),
            ]}
        >
            <section className="premium-gradient" aria-labelledby="terms-hero-title">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20 text-center relative">
                    <h1 id="terms-hero-title" className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-white/80 max-w-xl mx-auto">Last updated: August 2026</p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-6">
                    <p className="text-slate-500 leading-relaxed">
                        These Terms of Service govern your use of the {SITE_NAME} platform, its websites and related
                        services. Please read them carefully.
                    </p>
                    {SECTIONS.map(({ icon: Icon, title, body }) => (
                        <article key={title} className="glass rounded-3xl p-7">
                            <h2 className="flex items-center gap-3 text-lg font-black text-slate-800 mb-3 font-heading">
                                <span className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center text-white shrink-0" aria-hidden="true">
                                    <Icon className="w-4.5 h-4.5" />
                                </span>
                                {title}
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                        </article>
                    ))}
                    <p className="text-sm text-slate-400 leading-relaxed">
                        For questions about these terms, email{' '}
                        <a href="mailto:hello@noduenest.app" className="text-primary font-bold hover:underline">hello@noduenest.app</a>{' '}
                        or review our{' '}
                        <Link to="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
                    </p>
                </div>
            </section>
        </Seo>
    );
}
