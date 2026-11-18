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
          <a key={profile.platform} href={profile.profile_url} target="_blank" rel="noopener noreferrer" aria-label={`Visit weareailabs on ${label}`} title={label}>
            <PlatformIcon platform={profile.platform} />
          </a>
        );
      })}
    </nav>
  );
}
