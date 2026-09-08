'use client';
import {usePathname} from 'next/navigation';
export default function RegisterLink(){const path=usePathname();if(path!=='/')return null;return <a className="attendeeRegisterLink" href="/register">ATTENDEE REGISTRATION <span aria-hidden="true">→</span></a>}