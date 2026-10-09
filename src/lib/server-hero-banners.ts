import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { HeroBannerModel } from '@/lib/supabase/types';
import { initialHeroBanners } from '@/lib/seed-data';

function getStorageFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'hero_banners.json');
  } catch {
    return path.join('/tmp', 'hero_banners.json');
  }
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key || !url.startsWith('http')) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getServerActiveHeroBanner(): Promise<HeroBannerModel> {
  // 1. Primary: Direct Supabase database fetch at SSR time
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const remoteList = data as HeroBannerModel[];
        const active = remoteList.find((b) => b.is_active);
        if (active) return active;
        const defaultBanner = remoteList.find((b) => b.is_default || b.id === 'hero-default');
        if (defaultBanner) return defaultBanner;
        return remoteList[0];
      }
    } catch (e) {
      console.warn('[Server Hero Banner] Supabase query notice:', e);
    }
  }

  // 2. Secondary: Read from server disk storage file
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.banners) && parsed.banners.length > 0) {
        const deletedIds: string[] = Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [];
        const validBanners = (parsed.banners as HeroBannerModel[]).filter(
          (b) => b && b.id && !deletedIds.includes(b.id)
        );
        const activeId = parsed.activeId;
        const active =
          validBanners.find((b) => b.id === activeId) ||
          validBanners.find((b) => b.is_active);
        if (active) return active;
        const defaultBanner = validBanners.find((b) => b.is_default || b.id === 'hero-default');
        if (defaultBanner) return defaultBanner;
        if (validBanners.length > 0) return validBanners[0];
      }
    }
  } catch (e) {
    console.warn('[Server Hero Banner] Disk storage notice:', e);
  }

  // 3. Fallback: Seed data default
  return initialHeroBanners[0];
}
