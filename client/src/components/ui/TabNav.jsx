import { memo } from 'react';
import { motion } from 'framer-motion';

function TabNav({ tabs, activeTab, onChange, className = '' }) {
    return (
        <div role="tablist" aria-label="Tab navigation" className={`flex gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.key}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(tab.key)}
                        className={`relative flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                            isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="tab-indicator"
                                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-black/5"
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5 md:gap-2">
                            {Icon && <Icon className="w-4 h-4" />}
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export default TabNav;
