import { Link } from 'react-router-dom';
import { Compass, Home, ShieldCheck } from 'lucide-react';
import Seo from '../ui/Seo';
import PublicLayout from './PublicLayout';
import { SITE_NAME } from '../../lib/seo';

export default function NotFoundPage() {
    return (
        <PublicLayout>
            <Seo pageKey="notFound">
                <section className="py-24 md:py-32 text-center px-4" aria-labelledby="notfound-title">
                    <div className="w-20 h-20 mx-auto premium-gradient rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-8" aria-hidden="true">
                        <Compass className="w-10 h-10" />
                    </div>
                    <h1 id="notfound-title" className="font-heading text-7xl md:text-9xl font-black tracking-tighter premium-gradient bg-clip-text text-transparent">
                        404
                    </h1>
                    <p className="text-xl font-black text-slate-800 mt-4 mb-3 font-heading">This page wandered off campus</p>
                    <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
                        The page you are looking for does not exist or has moved. Check the URL or head back to the {SITE_NAME} homepage.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl premium-gradient text-white font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                            <Home className="w-5 h-5" aria-hidden="true" /> Back to Home
                        </Link>
                        <Link to="/verify" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-black hover:border-primary/30 hover:text-primary transition-colors">
                            <ShieldCheck className="w-5 h-5" aria-hidden="true" /> Verify a Ticket
                        </Link>
                    </div>
                </section>
            </Seo>
        </PublicLayout>
    );
}
