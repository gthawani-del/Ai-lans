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
import './cms-public-form.css';
import './cms-form-governance.css';
import './backoffice/backoffice-sections.css';
import BackofficeShellBehavior from './BackofficeShellBehavior';
import { createPageMetadata } from '../lib/seo';
export const metadata={...createPageMetadata({title:'weareailabs | ELIV8 LYF',description:'A hands-on AI business workshop for founders, CXOs and business owners. Mumbai — coming soon.',path:'/',indexable:true,follow:true,seo:{og_description:'Stop learning about AI. Start building with it.'}}),icons:{icon:'/favicon.ico'}};
export const viewport={width:'device-width',initialScale:1};
export default function RootLayout({children}){return <html lang="en"><body>{children}<BackofficeShellBehavior/></body></html>}
