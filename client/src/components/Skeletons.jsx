import { motion } from 'framer-motion';

export function SkeletonCard({ count = 3 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-100 rounded-lg w-3/4 animate-pulse" />
                            <div className="h-3 bg-slate-50 rounded-lg w-1/2 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-50 rounded-lg w-full animate-pulse" />
                        <div className="h-3 bg-slate-50 rounded-lg w-5/6 animate-pulse" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-4 bg-slate-100 rounded-lg animate-pulse flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-6 py-4 border-b border-slate-50 flex gap-4 items-center"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                    {Array.from({ length: cols - 1 }).map((_, j) => (
                        <div key={j} className="h-3 bg-slate-50 rounded-lg animate-pulse flex-1" />
                    ))}
                </motion.div>
            ))}
        </div>
    );
}

export function SkeletonStats({ count = 4 }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                        <div className="h-3 bg-slate-50 rounded-lg w-12 animate-pulse" />
                    </div>
                    <div className="h-8 bg-slate-100 rounded-lg w-20 animate-pulse" />
                    <div className="h-3 bg-slate-50 rounded-lg w-2/3 animate-pulse" />
                </motion.div>
            ))}
        </div>
    );
}
