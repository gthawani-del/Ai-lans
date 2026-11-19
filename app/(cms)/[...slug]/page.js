import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { PreviewSection } from '../../backoffice/CmsPageEditor';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../../lib/supabase-browser';
import { buildCmsStructuredData, createPageMetadata, resolveSeoImage } from '../../../lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPage(slug) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: 'no-store' }) },
  });
  const { data, error } = await supabase.rpc('cms_public_get_page', { p_slug: slug.join('/') });
  if (error) return null;
  return data || null;
}

function pageDescription(page) {
  const explicit = page?.revision?.seo?.description || page?.revision?.seo?.meta_description;
  if (explicit) return explicit;
  const sections = page?.revision?.document?.sections || [];
  const intro = sections.find(section => section.visible !== false && section.type === 'hero')?.props?.body
    || sections.find(section => section.visible !== false && section.type === 'rich_text')?.props?.body;
  return String(intro || '').replace(/\s+/g, ' ').slice(0, 160) || `Information from weareailabs about ${page?.page?.title || 'this topic'}.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: 'Page not found' };
  const seo = page.revision?.seo || {};
  return createPageMetadata({
    title: page.page.title,
    description: pageDescription(page),
    path: `/${page.page.slug}`,
    seo,
    defaultImage: resolveSeoImage(seo),
    openGraphType: seo.og_type || (page.page.template_id === 'editorial_article' ? 'article' : 'website'),
    indexable: false,
    follow: true,
  });
}

export default async function CmsPublicPage({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const sections = (page.revision?.document?.sections || []).filter(section => section.visible !== false);
  const structuredData = buildCmsStructuredData(page);
  return <main className="cmsPublicPage">
    {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />}
    <article className="cmsPublicArticle">
      <header className="cmsPublicHeader"><a href="/" aria-label="weareailabs home">weareailabs</a><span>{page.template?.name}</span></header>
      <h1>{page.page.title}</h1>
      <div className="cmsLiveSections">{sections.map((section, index) => <PreviewSection key={section.id || index} section={section} interactiveForm sourcePageId={page.page.id} />)}</div>
    </article>
  </main>;
}
