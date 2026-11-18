export async function submitAttendeeApplication(data, { endpoint, fetcher = fetch }) {
  const response = await fetcher(endpoint + '/submit-attendee-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, form_version: 'one_page_apply_20261118_v2', _website: '' }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok || !result.id) {
    throw new Error(result.error || 'Could not save your application');
  }
  return { full_name: data.full_name, email: data.email || '', reference: result.id, existing: !!result.already_paid };
}
