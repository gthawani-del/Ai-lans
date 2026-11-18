'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import { SOCIAL_PROFILE_DEFAULTS, SOCIAL_PLATFORM_LABELS } from '../lib/site-social-profiles';
import SocialBrandIcon from './SocialBrandIcon';
import './social-links.css';

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
            <SocialBrandIcon platform={profile.platform} />
          </a>
        );
      })}
    </nav>
  );
}
