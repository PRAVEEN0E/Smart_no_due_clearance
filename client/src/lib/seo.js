export const SITE_NAME = 'NoDueNest'
export const SITE_TAGLINE = 'Smart Student Clearance & Hall Ticket Management Platform'
export const SITE_URL = 'https://smart-no-due-clearance.vercel.app'
export const SITE_DESC = 'NoDueNest is an AI-powered student clearance management platform that automates department approvals, digital no due verification, assignment evaluation, and hall ticket generation for engineering colleges and higher educational institutions.'
export const SITE_KEYWORDS = 'NoDueNest, Student Clearance System, No Due Clearance, Hall Ticket Management, Engineering College ERP, Digital Clearance System, Academic Clearance, Student Portal, College Automation, AI Student Management, University Clearance, Education Technology, Campus Management, online no due clearance, student portal for clearance, automated hall ticket generation, college management software'
export const TWITTER_HANDLE = '@NoDueNest'
export const LOCALE = 'en_US'
export const OG_IMAGE = 'https://smart-no-due-clearance.vercel.app/og-image.png'
export const OG_IMAGE_W = 1200
export const OG_IMAGE_H = 630
export const OG_IMAGE_ALT = 'NoDueNest — AI-powered student clearance and hall ticket management platform'

export function getPageTitle(title) {
  return title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`
}

export function getCanonical(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Per-page SEO metadata. Used by the <Seo> component to emit
 * unique title, description, canonical, OG and Twitter tags.
 */
export const PAGE_META = {
  home: {
    title: `${SITE_NAME} — Smart Student Clearance & Hall Ticket Management Platform`,
    description: SITE_DESC,
    canonical: '/',
  },
  about: {
    title: 'About Us — The Story Behind NoDueNest',
    description: 'Learn how NoDueNest modernizes student no-dues clearance with AI, automation and transparent workflows for engineering colleges and universities.',
    canonical: '/about',
  },
  features: {
    title: 'Features — Digital No-Dues, Hall Tickets & AI Evaluations',
    description: 'Explore NoDueNest features: automated clearance workflows, AI assignment feedback, hall ticket generation, fee verification, analytics and role-based dashboards.',
    canonical: '/features',
  },
  contact: {
    title: 'Contact Us — Get in Touch with the NoDueNest Team',
    description: 'Contact the NoDueNest team for demos, institutional onboarding, support and partnership enquiries. We reply within one business day.',
    canonical: '/contact',
  },
  privacy: {
    title: 'Privacy Policy — How NoDueNest Protects Your Data',
    description: 'Read the NoDueNest privacy policy: what student data we collect, how we store and secure it, and your rights regarding your personal information.',
    canonical: '/privacy',
  },
  terms: {
    title: 'Terms of Service — NoDueNest Platform Agreement',
    description: 'The NoDueNest terms of service covering acceptable use, institutional agreements, data handling, liability and account responsibilities.',
    canonical: '/terms',
  },
  verify: {
    title: 'Verify Student Clearance — Official No-Dues Verification',
    description: 'Verify a student\'s clearance status on NoDueNest. Check no-dues, library, department and hostel clearance with an official verification link.',
    canonical: '/verify',
  },
  notFound: {
    title: 'Page Not Found (404)',
    description: 'The page you are looking for could not be found. Return to the NoDueNest homepage to continue.',
    canonical: '/404',
    robots: 'noindex',
  },
}
