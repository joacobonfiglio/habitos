-- Device tokens use the anonymous client exclusively. Authenticated sessions do not need RPC execution.
revoke all on function public.personal_ingest_phone_usage(text,jsonb) from authenticated;
