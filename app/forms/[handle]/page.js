import CmsPublicForm from '../../backoffice/CmsPublicForm';
import { createPageMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const title = 'Form | weareailabs';
  const description = 'Complete the weareailabs form using the information requested on the page.';
  return createPageMetadata({ title, description, path: `/forms/${encodeURIComponent(handle)}`, indexable: false, follow: false });
}

export default async function PublicFormPage({ params }) {
  const { handle } = await params;
  return <main className="cmsPublicFormPage">
    <header className="cmsPublicFormPageHeader"><a href="/" aria-label="weareailabs homepage">weareailabs</a></header>
    <article><CmsPublicForm handle={handle}/></article>
    <footer>weareailabs · ELIV8 LYF</footer>
  </main>;
}
