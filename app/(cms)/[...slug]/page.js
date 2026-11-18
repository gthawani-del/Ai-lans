import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { PreviewSection } from '../../backoffice/CmsPageEditor';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../../lib/supabase-browser';

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
  const title = seo.title || page.page.title;
  const description = pageDescription(page);
  const canonical = seo.canonical_url || `https://weareailabs.com/${page.page.slug}`;
  const image = seo.social_image_url || seo.og_image || '/weareailabs-logo.webp';
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: seo.indexable === true, follow: true },
    openGraph: { title: seo.og_title || title, description: seo.og_description || description, url: canonical, images: [image], type: 'article' },
    twitter: { card: 'summary_large_image', title: seo.og_title || title, description: seo.og_description || description, images: [image] },
  };
}

export default async function CmsPublicPage({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const sections = (page.revision?.document?.sections || []).filter(section => section.visible !== false);
  return <main className="cmsPublicPage">
    <article className="cmsPublicArticle">
      <header className="cmsPublicHeader"><a href="/" aria-label="weareailabs home">weareailabs</a><span>{page.template?.name}</span></header>
      <h1>{page.page.title}</h1>
      <div className="cmsLiveSections">{sections.map((section, index) => <PreviewSection key={section.id || index} section={section} />)}</div>
    </article>
  </main>;
}
