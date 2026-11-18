// Browser-side timing policy for the weareailabs organizer back office.
// This coordinates UI session handling. API authorization must still be enforced server-side.
export const SESSION_START_KEY='ai_lab_bo_session_start';
export const LAST_ACTIVITY_KEY='ai_lab_bo_last_activity';
export const INACTIVITY_MS=30*60*1000;
export const ABSOLUTE_SESSION_MS=8*60*60*1000;

export function clearAdminSessionClock(){
  if(typeof window==='undefined')return;
  localStorage.removeItem(SESSION_START_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function startAdminSessionClock(){
  const now=String(Date.now());
  localStorage.setItem(SESSION_START_KEY,now);
  localStorage.setItem(LAST_ACTIVITY_KEY,now);
}

export function adminSessionClockValid(now=Date.now()){
  if(typeof window==='undefined')return false;
  const started=Number(localStorage.getItem(SESSION_START_KEY));
  const last=Number(localStorage.getItem(LAST_ACTIVITY_KEY));
  // Fail closed for missing, corrupted, or future timestamps.
  return Number.isFinite(started)&&Number.isFinite(last)&&
    started>0&&last>=started&&last<=now&&started<=now&&
    now-last<INACTIVITY_MS&&now-started<ABSOLUTE_SESSION_MS;
}

export function recordAdminActivity(now=Date.now()){
  // Never revive a session that has already expired.
  if(!adminSessionClockValid(now))return false;
  localStorage.setItem(LAST_ACTIVITY_KEY,String(now));
  return true;
}

export async function endAdminSession(supabase){
  clearAdminSessionClock();
  await supabase.auth.signOut();
}
