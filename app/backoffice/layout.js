import {AdminSessionProvider} from './AdminSessionContext';
import './cms-activity-log.css';

export const metadata={title:'Backoffice | weareailabs',robots:{index:false,follow:false}};

export const dynamic='force-dynamic';
export const revalidate=0;

export default function BackofficeLayout({children}){
 return <AdminSessionProvider>{children}</AdminSessionProvider>;
}
