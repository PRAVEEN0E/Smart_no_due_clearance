import { useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { motion } from 'framer-motion';

export default function VirtualizedTable({
    columns,
    data,
    loading = false,
    emptyMessage = 'No data found.',
    emptyComponent: EmptyComponent,
    keyExtractor = (_, i) => i,
    onRowClick,
    actions,
    fixedHeader = true,
    rowHeight = 60,
    overscan = 5,
}) {
    const headerRef = useRef(null);
    const listRef = useRef(null);

    const headerHeight = 48;

    if (loading) {
        return (
            <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        if (EmptyComponent) return EmptyComponent;
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <p className="text-sm font-medium">{emptyMessage}</p>
            </div>
        );
    }

    const HeaderRow = () => (
        <div
            ref={headerRef}
            className="flex bg-slate-50/80 border-b border-black/5 sticky top-0 z-10"
            style={{ height: headerHeight }}
        >
            {columns.map((col, i) => (
                <div
                    key={i}
                    className="flex items-center px-3 md:px-4 text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-wider"
                    style={{ flex: col.flex || 1, minWidth: col.minWidth || 80 }}
                >
                    {col.header}
                </div>
            ))}
            {actions && (
                <div
                    className="flex items-center px-3 md:px-4 justify-end text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-wider"
                    style={{ flex: '0 0 120px' }}
                >
                    Actions
                </div>
            )}
        </div>
    );

    const Row = useCallback(({ item, index }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(index * 0.005, 0.15) }}
            className="flex border-b border-black/5 hover:bg-slate-50/50 transition-colors"
            style={{ height: rowHeight }}
            onClick={() => onRowClick?.(item)}
        >
            {columns.map((col, ci) => (
                <div
                    key={ci}
                    className="flex items-center px-3 md:px-4 text-xs md:text-sm text-slate-700 truncate"
                    style={{ flex: col.flex || 1, minWidth: col.minWidth || 80 }}
                >
                    {col.render ? col.render(item) : item[col.accessor]}
                </div>
            ))}
            {actions && (
                <div
                    className="flex items-center px-3 md:px-4 gap-1 justify-end"
                    style={{ flex: '0 0 120px' }}
                >
                    {typeof actions === 'function' ? actions(item) : actions}
                </div>
            )}
        </motion.div>
    ), [columns, actions, onRowClick, rowHeight]);

    const itemContent = useCallback((index) => (
        <Row item={data[index]} index={index} />
    ), [data, Row]);

    return (
        <div className="rounded-xl border border-black/5 overflow-hidden">
            {fixedHeader && <HeaderRow />}
            <Virtuoso
                ref={listRef}
                style={{ height: Math.min(data.length * rowHeight, 600) }}
                totalCount={data.length}
                itemContent={itemContent}
                overscan={overscan}
                increaseViewportBy={{ top: 200, bottom: 200 }}
                components={{
                    Header: fixedHeader ? undefined : HeaderRow,
                }}
            />
        </div>
    );
}
