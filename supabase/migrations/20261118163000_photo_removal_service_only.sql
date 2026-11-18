-- Restrict removal RPC to the controlled Edge Function after Storage API deletion.
-- Prevents direct browser calls clearing the photo reference while leaving the object.
GRANT EXECUTE ON FUNCTION public.remove_volunteer_photo(uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.remove_volunteer_photo(uuid,text) FROM anon, authenticated;
