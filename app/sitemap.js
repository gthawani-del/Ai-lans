import { createClient } from '@supabase/supabase-js';
import { SITE_ORIGIN } from '../lib/seo';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../lib/supabase-browser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap() {
  const entries = [
    { url: `${SITE_ORIGIN}/` },
    { url: `${SITE_ORIGIN}/privacy` },
  ];
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: 'no-store' }) },
    });
    const { data, error } = await supabase.rpc('cms_public_list_sitemap_pages');
    if (error) throw error;
    const pages = Array.isArray(data) ? data : [];
    for (const page of pages) {
      if (!page?.slug || page.canonical_path !== `/${page.slug}`) continue;
      entries.push({ url: `${SITE_ORIGIN}${page.canonical_path}`, lastModified: page.last_modified || undefined });
    }
  } catch (error) {
    console.error('CMS sitemap entries are temporarily unavailable:', error?.message || error);
  }
  return entries;
}
