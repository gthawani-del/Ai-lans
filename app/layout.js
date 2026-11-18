import './globals.css';
import './a11y.css';
import './register/register.css';
import './register/register-adjustments.css';
import './register/registration-flow-v2.css';
import './register/field-integrity.css';
import './register/rail-branding-v2.css';
import './backoffice/backoffice.css';
import './backoffice/backoffice-controls.css';
import './backoffice/sidebar-hotfix.css';
import './backoffice/cms-page-studio.css';
import './backoffice/backoffice-sections.css';
import BackofficeShellBehavior from './BackofficeShellBehavior';
export const metadata={metadataBase:new URL('https://weareailabs.com'),title:'weareailabs | ELIV8 LYF',description:'A hands-on AI business workshop for founders, CXOs and business owners. Mumbai — coming soon.',icons:{icon:'/favicon.ico'},robots:{index:true,follow:true},openGraph:{title:'weareailabs | ELIV8 LYF',description:'Stop learning about AI. Start building with it.',type:'website',locale:'en_IN',siteName:'weareailabs'},twitter:{card:'summary_large_image',title:'weareailabs | ELIV8 LYF',description:'Stop learning about AI. Start building with it.'}};
export const viewport={width:'device-width',initialScale:1};
export default function RootLayout({children}){return <html lang="en"><body>{children}<BackofficeShellBehavior/></body></html>}
