import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100"
                    >
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
                        <p className="text-slate-500 mb-6 text-sm">
                            We're sorry, but an unexpected error occurred in the application interface.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && (
                            <div className="text-left bg-slate-50 p-4 rounded-lg mb-6 overflow-auto max-h-32 text-xs text-slate-600 font-mono border border-slate-200">
                                {this.state.error?.toString()}
                            </div>
                        )}

                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Application
                        </button>
                    </motion.div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
