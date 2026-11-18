'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Save, Share2 } from 'lucide-react';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../lib/supabase-browser';
import { SOCIAL_PROFILE_DEFAULTS, SOCIAL_PLATFORM_LABELS } from '../../lib/site-social-profiles';
import './social-profiles.css';

const API = `${SUPABASE_URL}/functions/v1/social-profile-settings-admin`;
const platformNames = { ...SOCIAL_PLATFORM_LABELS, x: 'X (Twitter)' };

export default function SocialProfilesSettings({ session, role }) {
  const [profiles, setProfiles] = useState(SOCIAL_PROFILE_DEFAULTS);
  const [savedProfiles, setSavedProfiles] = useState(SOCIAL_PROFILE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetch(API, { headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_PUBLISHABLE_KEY } })
      .then(async response => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Could not load social profiles');
        if (active) {
          const rows = result.profiles?.length ? result.profiles : SOCIAL_PROFILE_DEFAULTS;
          setProfiles(rows);
          setSavedProfiles(rows);
        }
      })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session]);

  const changed = JSON.stringify(profiles) !== JSON.stringify(savedProfiles);
  const update = (platform, field, value) => {
    setNotice('');
    setProfiles(rows => {
      if (field !== 'display_order') return rows.map(row => row.platform === platform ? { ...row, [field]: value } : row);
      const current = rows.find(row => row.platform === platform);
      const displaced = rows.find(row => row.display_order === value);
      return rows.map(row => row.platform === platform ? { ...row, display_order: value } : row.platform === displaced?.platform ? { ...row, display_order: current.display_order } : row);
    });
  };

  async function save() {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(API, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not save social profiles');
      setProfiles(result.profiles);
      setSavedProfiles(result.profiles);
      setNotice('Social profiles saved. Public footers will update shortly.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="boPanel boSocialProfiles">
    <div className="boPanelHead"><div><h2><Share2 size={18} aria-hidden="true"/> Social Profiles</h2><p>Manage the public social icons and profile URLs used across the website.</p></div></div>
    <div className="boSocialIntro"><b>Public display</b><span>Only enabled profiles with a valid HTTPS URL appear. Changes are recorded in the admin audit log. {role !== 'super_admin' ? 'Only a Super Admin can edit these settings.' : ''}</span></div>
    {loading ? <p className="boSocialState">Loading social profile settings…</p> : profiles.map(profile => <div className="boSocialRow" key={profile.platform}>
      <div className="boSocialIdentity"><strong>{platformNames[profile.platform]}</strong><small>{profile.platform === 'x' ? 'Formerly Twitter' : 'Profile link'}</small></div>
      <label><span>Handle</span><input disabled={role !== 'super_admin'} value={profile.handle || ''} maxLength={120} placeholder="Add account handle" onChange={event => update(profile.platform, 'handle', event.target.value)}/></label>
      <label className="boSocialUrl"><span>Profile URL</span><input disabled={role !== 'super_admin'} type="url" value={profile.profile_url || ''} placeholder={`https://${profile.platform}.com/...`} onChange={event => update(profile.platform, 'profile_url', event.target.value)}/></label>
      <label className="boSocialOrder"><span>Order</span><select disabled={role !== 'super_admin'} value={profile.display_order} onChange={event => update(profile.platform, 'display_order', Number(event.target.value))}>{[1,2,3,4,5,6].map(order => <option key={order} value={order}>{order}</option>)}</select></label>
      <label className="boSocialToggle"><input disabled={role !== 'super_admin'} type="checkbox" checked={profile.is_enabled} onChange={event => update(profile.platform, 'is_enabled', event.target.checked)}/><span>Show</span></label>
      {profile.is_enabled && profile.profile_url && <a className="boSocialPreview" href={profile.profile_url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${platformNames[profile.platform]} profile`}><ExternalLink size={15}/></a>}
    </div>)}
    {error && <p className="boSocialError" role="alert">{error}</p>}
    {notice && <p className="boSocialNotice" role="status">{notice}</p>}
    <div className="boSocialActions"><p>Facebook and YouTube are prefilled. Instagram, X, LinkedIn and WhatsApp stay hidden until you add their URLs and enable them.</p>{role === 'super_admin' && <button className="boPrimaryBtn" disabled={loading || busy || !changed} onClick={save}><Save size={15}/>{busy ? 'Saving…' : 'Save social profiles'}</button>}</div>
  </section>;
}
