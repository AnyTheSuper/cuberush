import { getSupabase, isSupabaseConfigured } from './supabaseClient';

export type CloudPersisted = {
  dataVersion?: number;
  sessions: unknown[];
  currentSessionId: string;
  settings: unknown;
  multiSolve: unknown;
  scrambleByEvent: Record<string, string>;
  xp: unknown;
};

export async function loadUserState(
  userId: string,
): Promise<CloudPersisted | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('loadUserState:', error.message);
    return null;
  }
  if (!data?.data || typeof data.data !== 'object') return null;
  return data.data as CloudPersisted;
}

export async function saveUserState(
  userId: string,
  payload: CloudPersisted,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'Cloud sync is not configured.' };
  }

  const { error } = await supabase.from('user_state').upsert({
    user_id: userId,
    data: { ...payload, dataVersion: 2 },
    data_version: 2,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('saveUserState:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteUserState(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('user_state').delete().eq('user_id', userId);
}

export function canUseCloudSync(): boolean {
  return isSupabaseConfigured && getSupabase() != null;
}
