import { motion } from 'framer-motion';
import { Inbox, Search, UserX, FileX, BookOpen } from 'lucide-react';

const icons = {
    default: Inbox,
    search: Search,
    users: UserX,
    files: FileX,
    subjects: BookOpen,
};

export default function EmptyState({ 
    icon = 'default', 
    title = 'No data found', 
    description = 'There are no items to display at this time.',
    action,
    actionLabel 
}) {
    const Icon = icons[icon] || icons.default;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6 border border-slate-100">
                <Icon className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
            {action && (
                <button 
                    onClick={action}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    {actionLabel || 'Get Started'}
                </button>
            )}
        </motion.div>
    );
}
