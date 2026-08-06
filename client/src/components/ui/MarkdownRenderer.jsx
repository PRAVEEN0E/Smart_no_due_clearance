import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

const MARKDOWN_PATTERNS = [
    /^#{1,6}\s/m,            // headings
    /^\s*[-*+]\s/m,          // bullet lists
    /^\s*\d+[.)]\s/m,        // numbered lists
    /^\s*>/m,                // blockquotes
    /^\s*```/m,              // code fences
    /^\s*\|.*\|/m,           // tables
    /\*\*[^*\n]+\*\*/,       // bold
    /\*[^*\n]+\*/,           // italic
    /__[^_\n]+__/,           // bold (alt)
    /\[[^\]]*\]\([^)]*\)/,   // links
];

const hasMarkdown = (content) => MARKDOWN_PATTERNS.some((re) => re.test(content));

const components = (compact, dark) => ({
    h1: (props) => (
        <h1 {...props} className={`text-xl font-bold mt-6 first:mt-0 mb-3 tracking-tight ${dark ? 'text-slate-100' : 'text-slate-800'}`} />
    ),
    h2: (props) => (
        <h2 {...props} className={`text-lg font-semibold mt-8 first:mt-0 mb-3 pb-2 border-b tracking-tight ${dark ? 'text-slate-100 border-slate-700' : 'text-slate-800 border-blue-100'}`} />
    ),
    h3: (props) => (
        <h3 {...props} className={`text-base font-semibold mt-6 first:mt-0 mb-2 tracking-tight ${dark ? 'text-slate-200' : 'text-slate-700'}`} />
    ),
    h4: (props) => (
        <h4 {...props} className={`text-sm font-semibold mt-4 first:mt-0 mb-1.5 ${dark ? 'text-slate-200' : 'text-slate-700'}`} />
    ),
    p: (props) => (
        <p {...props} className={`leading-[1.7] my-3 first:mt-0 last:mb-0 ${compact ? 'text-xs' : 'text-sm md:text-base'} ${dark ? 'text-slate-300' : 'text-slate-700'}`} />
    ),
    ul: (props) => (
        <ul {...props} className={`list-disc pl-5 my-3 space-y-1.5 ${dark ? 'marker:text-blue-400' : 'marker:text-blue-500'}`} />
    ),
    ol: (props) => (
        <ol {...props} className={`list-decimal pl-5 my-3 space-y-1.5 ${dark ? 'marker:text-blue-400' : 'marker:text-blue-500'}`} />
    ),
    li: (props) => (
        <li {...props} className={`leading-relaxed pl-1 ${compact ? 'text-xs' : 'text-sm md:text-base'} ${dark ? 'text-slate-300' : 'text-slate-700'}`} />
    ),
    strong: (props) => <strong {...props} className={`font-bold ${dark ? 'text-slate-50' : 'text-slate-900'}`} />,
    em: (props) => <em {...props} className={`italic ${dark ? 'text-slate-300' : 'text-slate-700'}`} />,
    a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`} />,
    hr: (props) => <hr {...props} className={`my-6 ${dark ? 'border-slate-700' : 'border-slate-200'}`} />,
    blockquote: (props) => (
        <blockquote {...props} className={`border-l-4 pl-4 py-1 pr-3 italic my-4 rounded-r-xl ${dark ? 'border-blue-400 bg-slate-800 text-slate-300' : 'border-blue-300 bg-blue-50/50 text-slate-600'}`} />
    ),
    code: ({ inline, className, children, ...props }) => {
        if (!inline) {
            return <code className={className}>{children}</code>;
        }
        return (
            <code {...props} className={`rounded-md px-1.5 py-0.5 text-xs font-mono ${dark ? 'bg-slate-700 text-blue-300' : 'bg-blue-100/70 text-blue-800'}`}>
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 my-4 overflow-x-auto text-xs font-mono leading-relaxed">
            {children}
        </pre>
    ),
    table: (props) => (
        <div className={`my-4 overflow-x-auto rounded-xl border ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
            <table {...props} className={`w-full text-xs md:text-sm border-collapse ${dark ? 'bg-slate-800' : 'bg-white'}`} />
        </div>
    ),
    thead: (props) => <thead {...props} className={dark ? 'bg-slate-700/60' : 'bg-blue-50/80'} />,
    th: (props) => <th {...props} className={`px-3 py-2.5 text-left font-semibold border-b whitespace-nowrap ${dark ? 'text-slate-100 border-slate-600' : 'text-slate-800 border-slate-200'}`} />,
    td: (props) => <td {...props} className={`px-3 py-2 border-b align-top ${dark ? 'text-slate-300 border-slate-700/60' : 'text-slate-700 border-slate-100'}`} />,
});

export default memo(function MarkdownRenderer({ content = '', compact = false, dark = false, className = '' }) {
    if (!content) return null;

    if (!hasMarkdown(content)) {
        return <p className={`whitespace-pre-wrap leading-[1.7] ${compact ? 'text-xs' : 'text-sm md:text-base'} ${dark ? 'text-slate-300' : 'text-slate-700'} ${className}`}>{content}</p>;
    }

    return (
        <div className={`text-left ${compact ? 'space-y-1' : 'space-y-2'} ${className}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components(compact, dark)}>
                {content}
            </ReactMarkdown>
        </div>
    );
});
