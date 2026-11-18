'use client';

import { useEffect, useState } from 'react';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import { SOCIAL_PROFILE_DEFAULTS, SOCIAL_PLATFORM_LABELS } from '../lib/site-social-profiles';
import './social-links.css';

function PlatformIcon({ platform }) {
  const common = { size: 19, strokeWidth: 1.8, 'aria-hidden': true };
  if (platform === 'facebook') return <Facebook {...common} />;
  if (platform === 'youtube') return <Youtube {...common} />;
  if (platform === 'instagram') return <Instagram {...common} />;
  if (platform === 'linkedin') return <Linkedin {...common} />;
  if (platform === 'whatsapp') return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.8 11.8 0 0 0 12.1 0C5.56 0 .24 5.32.24 11.86c0 2.09.55 4.14 1.6 5.94L.14 24l6.35-1.66a11.9 11.9 0 0 0 5.6 1.43h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.15-3.44-8.43ZM12.1 21.76a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.77.99 1.01-3.67-.23-.38a9.85 9.85 0 0 1-1.51-5.25c0-5.46 4.44-9.9 9.9-9.9 2.65 0 5.14 1.03 7.01 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.18.2-.35.23-.65.08-.3-.15-1.26-.47-2.4-1.49-.88-.78-1.48-1.75-1.66-2.05-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.18-1.42-.07-.13-.27-.2-.57-.35Z" /></svg>;
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.9 1.2h3.7l-8.1 9.2L24 22.9h-7.4l-5.8-7.6-6.7 7.6H.5l8.6-9.8L0 1.2h7.6l5.3 6.9 6-6.9Zm-1.3 19.5h2L6.5 3.2H4.3l13.3 17.5Z" /></svg>;
}

export default function SocialLinks({ className = '' }) {
  const initial = SOCIAL_PROFILE_DEFAULTS.filter(profile => profile.is_enabled && profile.profile_url);
  const [profiles, setProfiles] = useState(initial);

  useEffect(() => {
    let active = true;
    getSupabaseBrowserClient()
      .from('site_social_profiles')
      .select('platform,handle,profile_url,is_enabled,display_order')
      .eq('is_enabled', true)
      .not('profile_url', 'is', null)
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (active && !error && data) setProfiles(data);
      });
    return () => { active = false; };
  }, []);

  if (!profiles.length) return null;
  return (
    <nav className={`socialLinks ${className}`} aria-label="Social media links">
      {profiles.map(profile => {
        const label = SOCIAL_PLATFORM_LABELS[profile.platform];
        if (!label || !profile.profile_url) return null;
        return (
          <a className={`socialIcon socialIcon--${profile.platform}`} key={profile.platform} href={profile.profile_url} target="_blank" rel="noopener noreferrer" aria-label={`Visit weareailabs on ${label}`} title={label}>
            <PlatformIcon platform={profile.platform} />
          </a>
        );
      })}
    </nav>
  );
}
