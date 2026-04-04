import { motion } from 'framer-motion';

export const Skeleton = ({ className, height = 'h-4', width = 'w-full', rounded = 'rounded-lg' }) => {
    return (
        <div className={`relative overflow-hidden bg-white/5 ${height} ${width} ${rounded} ${className}`}>
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear'
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
        </div>
    );
};

export const CardSkeleton = () => (
    <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex gap-4 items-center">
            <Skeleton height="h-12" width="w-12" rounded="rounded-xl" />
            <div className="space-y-2 flex-1">
                <Skeleton height="h-4" width="w-1/3" />
                <Skeleton height="h-3" width="w-1/4" />
            </div>
        </div>
        <Skeleton height="h-32" width="w-full" />
    </div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton height="h-10" width="w-48" />
                <Skeleton height="h-4" width="w-64" />
            </div>
            <Skeleton height="h-12" width="w-32" rounded="rounded-2xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton height="h-32" />
            <Skeleton height="h-32" />
            <Skeleton height="h-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton height="h-96" />
                <Skeleton height="h-64" />
            </div>
            <div className="space-y-6">
                <Skeleton height="h-64" />
                <Skeleton height="h-48" />
                <Skeleton height="h-96" />
            </div>
        </div>
    </div>
);
