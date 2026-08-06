import { Helmet } from 'react-helmet-async';
import { PAGE_META, SITE_NAME, SITE_URL, SITE_DESC, LOCALE, OG_IMAGE, OG_IMAGE_W, OG_IMAGE_H, OG_IMAGE_ALT, getPageTitle, getCanonical } from '../../lib/seo';

/**
 * Emits complete, unique SEO meta tags for a page.
 *
 * @param {string}  pageKey    key into PAGE_META (or custom object)
 * @param {object}  overrides  { title, description, canonical, keywords, robots, ogImage, ogImageAlt }
 * @param {object[]} jsonLd    array of structured-data objects (injected as script tags)
 */
export default function Seo({ pageKey, overrides = {}, jsonLd = [], children }) {
    const meta = typeof pageKey === 'string' ? { ...(PAGE_META[pageKey] || {}), ...overrides } : { ...pageKey, ...overrides };
    const title = meta.title || getPageTitle();
    const description = meta.description || '';
    const canonical = meta.canonical ? getCanonical(meta.canonical) : getCanonical();
    const robots = meta.robots || 'index, follow';
    const ogImage = meta.ogImage || OG_IMAGE;
    const ogImageAlt = meta.ogImageAlt || OG_IMAGE_ALT;

    return (
        <>
            <Helmet>
                <html lang="en" />
                <title>{title}</title>
                {description && <meta name="description" content={description} />}
                {meta.keywords && <meta name="keywords" content={meta.keywords} />}
                <meta name="robots" content={robots} />
                <link rel="canonical" href={canonical} />

                <meta property="og:type" content="website" />
                <meta property="og:site_name" content={SITE_NAME} />
                <meta property="og:locale" content={LOCALE} />
                <meta property="og:url" content={canonical} />
                <meta property="og:title" content={title} />
                {description && <meta property="og:description" content={description} />}
                <meta property="og:image" content={ogImage} />
                <meta property="og:image:width" content={String(OG_IMAGE_W)} />
                <meta property="og:image:height" content={String(OG_IMAGE_H)} />
                <meta property="og:image:alt" content={ogImageAlt} />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={canonical} />
                <meta name="twitter:title" content={title} />
                {description && <meta name="twitter:description" content={description} />}
                <meta name="twitter:image" content={ogImage} />
                <meta name="twitter:image:alt" content={ogImageAlt} />
            </Helmet>
            {jsonLd.length > 0 && jsonLd.map((schema, i) => (
                <script key={i} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
            {children}
        </>
    );
}

/* ── Structured data builders ─────────────────────────────────────────────── */

export function orgSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo512.png`,
        image: `${SITE_URL}/og-image.png`,
        description: SITE_DESC,
        email: 'hello@noduenest.app',
        sameAs: [],
    };
}

export function eduOrgSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        '@id': `${SITE_URL}/#educational-org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo512.png`,
        description: SITE_DESC,
        sameAs: [],
    };
}

export function softwareAppSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESC,
        applicationCategory: 'EducationApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Organization', name: SITE_NAME },
    };
}

export function websiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESC,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en',
    };
}

export function webPageSchema(path, name, description) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: getCanonical(path),
        name: name || getPageTitle(),
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en',
    };
}

export function breadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: getCanonical(item.path),
        })),
    };
}

export function faqSchema(faqs) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };
}

export function siteBaseSchemas() {
    return [orgSchema(), eduOrgSchema(), softwareAppSchema(), websiteSchema()];
}
