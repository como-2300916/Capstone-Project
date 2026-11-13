import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.length < 32) return json({ error: 'Missing device credential' }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Expected a JSON body' }, 400);
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return json({ error: 'Expected a JSON object' }, 400);
  }
  const payload = body as Record<string, unknown>;

  const bandId = typeof payload.band_id === 'string' ? payload.band_id.trim() : '';
  const zone = payload.zone;
  const pulse = payload.pulse_bpm;
  const battery = payload.battery_percent;
  const latitude = payload.latitude;
  const longitude = payload.longitude;
  const sos = payload.sos_pressed ?? false;
  const recordedAt = payload.recorded_at ?? new Date().toISOString();

  if (!bandId || !['green', 'yellow', 'red', 'unknown'].includes(String(zone))) {
    return json({ error: 'band_id and a valid zone are required' }, 400);
  }
  if (pulse != null && (!Number.isInteger(pulse) || Number(pulse) < 20 || Number(pulse) > 240)) {
    return json({ error: 'pulse_bpm must be an integer from 20 to 240' }, 400);
  }
  if (battery != null && (!Number.isInteger(battery) || Number(battery) < 0 || Number(battery) > 100)) {
    return json({ error: 'battery_percent must be an integer from 0 to 100' }, 400);
  }
  if (typeof sos !== 'boolean' || (latitude != null && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) || (longitude != null && (typeof longitude !== 'number' || longitude < -180 || longitude > 180))) {
    return json({ error: 'Invalid SOS or location values' }, 400);
  }
  if (Number.isNaN(Date.parse(String(recordedAt)))) return json({ error: 'recorded_at must be an ISO date' }, 400);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const tokenHash = await sha256(token);
  const { data: device, error: deviceError } = await supabase
    .from('device_credentials')
    .select('band_id')
    .eq('band_id', bandId)
    .eq('token_sha256', tokenHash)
    .eq('enabled', true)
    .maybeSingle();

  if (deviceError || !device) return json({ error: 'Invalid device credential' }, 401);

  const { data, error } = await supabase.from('monitoring_records').insert({
    band_id: device.band_id,
    zone,
    pulse_bpm: pulse ?? null,
    battery_percent: battery ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    sos_pressed: sos,
    recorded_at: recordedAt,
  }).select('id, recorded_at').single();

  if (error) return json({ error: 'Could not save telemetry' }, 500);
  return json({ accepted: true, record_id: data.id, recorded_at: data.recorded_at }, 201);
});
