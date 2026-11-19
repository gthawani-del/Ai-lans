export const SITE_ORIGIN = 'https://weareailabs.com';
export const DEFAULT_SEO_IMAGE_ID = 'brand_home';
export const SEO_IMAGE_ASSETS = Object.freeze({
  brand_home: { src: '/brand/weareailabs-home.webp', alt: 'weareailabs — Explore, Learn, Create Together', label: 'weareailabs brand image' },
  brand_volunteer: { src: '/brand/weareailabs-volunteer.webp', alt: 'Volunteer with weareailabs', label: 'Volunteer programme image' },
  workshop_mvp: { src: '/images/ai-lab/working-mvp-teal.webp', alt: 'A working AI minimum viable product', label: 'Working MVP image' },
  workshop_problem: { src: '/images/ai-lab/business-problem-teal.webp', alt: 'A business problem ready for an AI solution', label: 'Business problem image' },
});

export function resolveSeoImage(seo = {}) {
  return SEO_IMAGE_ASSETS[seo.og_image_asset_id] || SEO_IMAGE_ASSETS[DEFAULT_SEO_IMAGE_ID];
}

export function safeCanonicalPath(value, fallback = '/') {
  const path = typeof value === 'string' ? value.trim() : '';
  if (!path || !path.startsWith('/') || path.startsWith('//') || /[?#\\\\\s]/.test(path) || path.split('/').some(part => part === '.' || part === '..')) return fallback;
  return path;
}

export function createPageMetadata({
  title,
  description,
  path = '/',
  seo = {},
  defaultImage = SEO_IMAGE_ASSETS[DEFAULT_SEO_IMAGE_ID],
  openGraphType = 'website',
  indexable = true,
  follow = true,
}) {
  const resolvedTitle = seo.seo_title || title;
  const resolvedDescription = seo.meta_description || description;
  const canonicalPath = safeCanonicalPath(seo.canonical_path, path);
  const image = resolveSeoImage(seo);
  const selectedImage = seo.og_image_asset_id ? image : defaultImage;
  const imageUrl = selectedImage?.src || image.src;
  const isIndexable = typeof seo.indexable === 'boolean' ? seo.indexable : indexable;
  const shouldFollow = typeof seo.follow_links === 'boolean' ? seo.follow_links : follow;
  const socialTitle = seo.og_title || resolvedTitle;
  const socialDescription = seo.og_description || resolvedDescription;
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: canonicalPath },
    robots: { index: isIndexable, follow: shouldFollow },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: canonicalPath,
      type: seo.og_type || openGraphType,
      locale: seo.locale || 'en_IN',
      siteName: 'weareailabs',
      images: [{ url: imageUrl, alt: seo.social_image_alt || selectedImage.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: socialDescription,
      images: [{ url: imageUrl, alt: seo.social_image_alt || selectedImage.alt }],
    },
  };
}

export function buildCmsStructuredData(page) {
  if (!page?.page || !page?.revision) return null;
  const seo = page.revision.seo || {};
  const canonicalPath = safeCanonicalPath(seo.canonical_path, `/${page.page.slug}`);
  const url = new URL(canonicalPath, SITE_ORIGIN).toString();
  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: seo.seo_title || page.page.title,
      description: seo.meta_description || '',
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      about: { '@id': `${SITE_ORIGIN}/#organization` },
      inLanguage: seo.locale || 'en-IN',
    },
  ];
  if (seo.structured_data_type === 'Article' && page.page.template_id === 'editorial_article' && seo.author_name) {
    const article = {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: seo.seo_title || page.page.title,
      description: seo.meta_description || '',
      mainEntityOfPage: { '@id': `${url}#webpage` },
      author: { '@type': 'Person', name: seo.author_name },
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      datePublished: page.revision.created_at,
      dateModified: page.revision.created_at,
      inLanguage: seo.locale || 'en-IN',
    };
    if (Array.isArray(seo.references) && seo.references.length) article.citation = seo.references;
    graph.push(article);
  }
  const segments = page.page.slug.split('/').filter(Boolean);
  if (segments.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumbs`,
      itemListElement: segments.map((segment, index) => {
        const itemPath = '/' + segments.slice(0, index + 1).join('/');
        return { '@type': 'ListItem', position: index + 1, name: index === segments.length - 1 ? page.page.title : segment.replace(/-/g, ' '), item: new URL(itemPath, SITE_ORIGIN).toString() };
      }),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function inspectAeoSignals({ pageTitle = '', sections = [], seo = {}, templateId = '' }) {
  const visible = sections.filter(section => section.visible !== false);
  const intro = visible.slice(0, 2).map(section => {
    const props = section.props || {};
    return section.type === 'hero' || section.type === 'rich_text' ? props.body || '' : '';
  }).find(Boolean) || '';
  const allCopy = visible.map(section => Object.values(section.props || {}).flatMap(value => typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(item => Object.values(item || {}).filter(v => typeof v === 'string')) : []).join(' ')).join(' ');
  const headings = visible.some(section => section.props?.heading || section.props?.title);
  const links = visible.flatMap(section => {
    const props = section.props || {};
    return [[props.cta_label, props.cta_href], [props.label, props.href]].filter(([, href]) => Boolean(href));
  });
  const vagueLink = links.some(([label]) => !label || /^(click here|here|read more|learn more)$/i.test(label.trim()));
  const editorial = templateId === 'editorial_article';
  const referenceCount = Array.isArray(seo.references) ? seo.references.length : 0;
  return [
    { label: 'An introductory answer appears near the start', pass: intro.trim().length >= 40, detail: 'Heuristic: checks whether the first content sections have a direct introduction.' },
    { label: 'Page and section headings are present', pass: Boolean(pageTitle.trim() && headings), detail: 'Use headings that state what each section explains.' },
    { label: 'Copy includes a concrete example or practical detail', pass: /\b(for example|example|case study|in practice|we built|real business)\b/i.test(allCopy), detail: 'This lightweight text check will not replace editorial review.' },
    { label: editorial ? 'Author is set for this article' : 'References are included where relevant', pass: editorial ? Boolean(seo.author_name?.trim()) : referenceCount > 0, detail: editorial ? 'Article structured data requires an author.' : 'Add references when the page makes claims that need sourcing.' },
    { label: 'Links use descriptive labels', pass: !vagueLink, detail: links.length ? 'Avoid labels such as “click here” or “read more”.' : 'No content links detected yet.' },
  ];
}

export function validateCmsSeo(seo = {}, { title = '', slug = '', templateId = '' } = {}) {
  const errors = [];
  const normalized = {
    seo_title: String(seo.seo_title || title).trim(),
    meta_description: String(seo.meta_description || '').trim(),
    canonical_path: safeCanonicalPath(seo.canonical_path, `/${slug}`),
    indexable: seo.indexable === true,
    follow_links: seo.follow_links !== false,
    og_title: String(seo.og_title || '').trim(),
    og_description: String(seo.og_description || '').trim(),
    og_image_asset_id: SEO_IMAGE_ASSETS[seo.og_image_asset_id] ? seo.og_image_asset_id : DEFAULT_SEO_IMAGE_ID,
    social_image_alt: String(seo.social_image_alt || '').trim(),
    locale: String(seo.locale || 'en-IN').trim(),
    og_type: seo.og_type === 'article' ? 'article' : 'website',
    structured_data_type: templateId === 'editorial_article' && seo.structured_data_type === 'Article' ? 'Article' : 'WebPage',
    author_name: String(seo.author_name || '').trim(),
    references: Array.isArray(seo.references) ? seo.references.map(value => String(value).trim()).filter(Boolean) : [],
  };
  const placeholders = /\{\{[^}]+\}\}|\blorem ipsum\b|\b(tbd|todo|placeholder)\b/i;
  if (normalized.indexable) {
    if (!normalized.seo_title) errors.push('An indexable page needs an SEO title.');
    if (!normalized.meta_description) errors.push('An indexable page needs a meta description.');
    if (placeholders.test(normalized.seo_title) || placeholders.test(normalized.meta_description)) errors.push('Replace placeholder text before making this page indexable.');
    if (!seo.canonical_path || normalized.canonical_path !== seo.canonical_path) errors.push('Canonical path must be a valid path on weareailabs.com.');
  }
  if (normalized.structured_data_type === 'Article' && !normalized.author_name) errors.push('Add an author before selecting Article structured data.');
  if (normalized.references.length > 20 || normalized.references.some(value => !/^https:\/\/[^\s/]+(?:[/?#][^\s]*)?$/i.test(value))) errors.push('References must be HTTPS URLs (up to 20).');
  if (normalized.social_image_alt.length > 300) errors.push('Social image alt text must be 300 characters or fewer.');
  if (normalized.locale.length > 20) errors.push('Locale must be 20 characters or fewer.');
  return { seo: normalized, errors };
}
