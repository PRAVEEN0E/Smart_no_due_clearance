import { motion } from 'framer-motion';
import { SkeletonTable } from '../Skeletons';
import EmptyState from '../EmptyState';

export default function DataTable({
    columns,
    data,
    loading = false,
    emptyMessage = 'No data found.',
    emptyIcon = null,
    keyExtractor = (_, i) => i,
    onRowClick,
    actions
}) {
    if (loading) return <SkeletonTable rows={5} />;
    if (!data || data.length === 0) return <EmptyState message={emptyMessage} icon={emptyIcon} />;

    return (
        <div className="overflow-x-auto rounded-xl border border-black/5">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50/80 border-b border-black/5">
                        {columns.map((col, i) => (
                            <th key={i} className="text-left px-3 md:px-4 py-3 md:py-3.5 font-bold text-slate-600 text-[10px] md:text-xs uppercase tracking-wider">
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className="px-3 md:px-4 py-3 md:py-3.5 font-bold text-slate-600 text-[10px] md:text-xs uppercase tracking-wider text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                    {data.map((row, idx) => (
                        <motion.tr
                            key={keyExtractor(row, idx)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => onRowClick?.(row)}
                            className={`hover:bg-slate-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                        >
                            {columns.map((col, ci) => (
                                <td key={ci} className="px-3 md:px-4 py-3 md:py-3.5 text-slate-700 text-xs md:text-sm">
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                            {actions && (
                                <td className="px-3 md:px-4 py-3 md:py-3.5 text-right">
                                    {typeof actions === 'function' ? actions(row) : actions}
                                </td>
                            )}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
