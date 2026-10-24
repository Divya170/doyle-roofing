export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Roofing', href: '/roofing' },
  { label: 'Remodeling', href: '/remodeling' },
  { label: 'Projects', href: '/projects' },
  { label: 'About & FAQs', href: '/about' },
] as const;

/** Estimate wizard, optionally with the project type preselected. */
export const estimateHref = (type?: string) => (type === 'roofing' || type === 'remodeling' ? `/estimate?type=${type}` : '/estimate');
export const projectsHref = (cat?: string) => (cat === 'roofing' || cat === 'remodeling' ? `/projects?cat=${cat}` : '/projects');
