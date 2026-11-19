import CmsPublicForm from '../../backoffice/CmsPublicForm';

export async function generateMetadata({ params }) {
  const { handle } = await params;
  return { title: 'Form | weareailabs', robots: { index: false, follow: false }, alternates: { canonical: `https://weareailabs.com/forms/${encodeURIComponent(handle)}` } };
}

export default async function PublicFormPage({ params }) {
  const { handle } = await params;
  return <main className="cmsPublicFormPage">
    <header className="cmsPublicFormPageHeader"><a href="/" aria-label="weareailabs homepage">weareailabs</a></header>
    <article><CmsPublicForm handle={handle}/></article>
    <footer>weareailabs · ELIV8 LYF</footer>
  </main>;
}
