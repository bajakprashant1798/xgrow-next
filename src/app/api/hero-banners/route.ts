import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { HeroBannerModel } from '@/lib/supabase/types';
import { initialHeroBanners } from '@/lib/seed-data';

const DATA_DIR = path.join(process.cwd(), '.data');
const HERO_BANNERS_FILE = path.join(DATA_DIR, 'hero_banners.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
  }
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey || !url.startsWith('http')) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function readStoredBanners(): { banners: HeroBannerModel[]; activeId: string } {
  ensureDataDir();
  let banners: HeroBannerModel[] = [...initialHeroBanners];
  let activeId = 'hero-default';

  try {
    if (fs.existsSync(HERO_BANNERS_FILE)) {
      const content = fs.readFileSync(HERO_BANNERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.banners) && parsed.banners.length > 0) {
        banners = parsed.banners;
        activeId = parsed.activeId || banners.find((b) => b.is_active)?.id || 'hero-default';
      }
    }
  } catch (e) {
    console.warn('[Hero API] Error reading disk hero banners:', e);
  }

  // Ensure default hero banner always exists
  if (!banners.some((b) => b.is_default || b.id === 'hero-default')) {
    banners.unshift(initialHeroBanners[0]);
  }

  // Enforce active banner
  const mappedBanners = banners.map((b) => ({
    ...b,
    is_active: b.id === activeId,
  }));

  return { banners: mappedBanners, activeId };
}

function writeStoredBanners(banners: HeroBannerModel[], activeId: string) {
  ensureDataDir();
  try {
    const dataToSave = {
      banners,
      activeId,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(HERO_BANNERS_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Hero API] Error writing disk hero banners:', e);
  }
}

export async function GET() {
  try {
    const { banners: diskBanners, activeId } = readStoredBanners();
    let finalList = diskBanners;

    // Optional Supabase fetch if available
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('hero_banners')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const map = new Map<string, HeroBannerModel>();
          for (const item of data as HeroBannerModel[]) {
            if (item && item.id) map.set(item.id, item);
          }
          for (const item of diskBanners) {
            if (item && item.id) map.set(item.id, item);
          }
          finalList = Array.from(map.values()).map((b) => ({
            ...b,
            is_active: b.id === activeId,
          }));
        }
      } catch (err) {
        // Fallback to disk list
      }
    }

    const activeBanner = finalList.find((b) => b.is_active) || finalList.find((b) => b.is_default) || initialHeroBanners[0];

    return NextResponse.json({
      success: true,
      activeId,
      activeBanner,
      banners: finalList,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching hero banners', activeBanner: initialHeroBanners[0], banners: initialHeroBanners },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'save'; // 'save' | 'set_active'
    const bannerData: Partial<HeroBannerModel> = body.banner || {};
    const bannerIdToActivate = body.bannerId;

    const { banners: currentBanners, activeId: currentActiveId } = readStoredBanners();
    let updatedActiveId = currentActiveId;
    let updatedList = [...currentBanners];
    let targetSavedBanner: HeroBannerModel | null = null;
    const now = new Date().toISOString();

    if (action === 'set_active' && bannerIdToActivate) {
      updatedActiveId = bannerIdToActivate;
      updatedList = updatedList.map((b) => ({
        ...b,
        is_active: b.id === bannerIdToActivate,
        updated_at: b.id === bannerIdToActivate ? now : b.updated_at,
      }));
      targetSavedBanner = updatedList.find((b) => b.id === bannerIdToActivate) || null;
    } else if (bannerData) {
      const isDefault = bannerData.is_default || bannerData.id === 'hero-default';
      const id = bannerData.id || `hero-${Date.now()}`;
      const existingIdx = updatedList.findIndex((b) => b.id === id);

      const newBanner: HeroBannerModel = {
        id,
        title: (bannerData.title || 'Special Promotion').trim(),
        subtitle: (bannerData.subtitle || '').trim(),
        badge_text: (bannerData.badge_text || '').trim(),
        image_url: (bannerData.image_url || '/home/hero.png').trim(),
        link_url: (bannerData.link_url || '').trim(),
        button_text: (bannerData.button_text || 'Claim Offer').trim(),
        aspect_ratio: bannerData.aspect_ratio || 'auto',
        is_active: bannerData.is_active ?? true,
        is_default: isDefault,
        display_order: bannerData.display_order ?? updatedList.length,
        created_at: bannerData.created_at || now,
        updated_at: now,
      };

      if (existingIdx >= 0) {
        updatedList[existingIdx] = newBanner;
      } else {
        updatedList.push(newBanner);
      }

      if (newBanner.is_active) {
        updatedActiveId = newBanner.id;
        updatedList = updatedList.map((b) => ({
          ...b,
          is_active: b.id === newBanner.id,
        }));
      }

      targetSavedBanner = newBanner;
    }

    // Save to disk
    writeStoredBanners(updatedList, updatedActiveId);

    // Sync to Supabase in background
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        if (targetSavedBanner) {
          if (targetSavedBanner.is_active) {
            await supabase.from('hero_banners').update({ is_active: false }).neq('id', targetSavedBanner.id);
          }
          await supabase.from('hero_banners').upsert({
            id: targetSavedBanner.id,
            title: targetSavedBanner.title,
            subtitle: targetSavedBanner.subtitle,
            badge_text: targetSavedBanner.badge_text,
            image_url: targetSavedBanner.image_url,
            link_url: targetSavedBanner.link_url,
            button_text: targetSavedBanner.button_text,
            aspect_ratio: targetSavedBanner.aspect_ratio,
            is_active: targetSavedBanner.is_active,
            is_default: targetSavedBanner.is_default,
            display_order: targetSavedBanner.display_order,
            updated_at: now,
          });
        }
      } catch (sbErr) {
        console.warn('[Hero API] Supabase sync notice:', sbErr);
      }
    }

    const activeBanner = updatedList.find((b) => b.is_active) || updatedList[0];

    return NextResponse.json({
      success: true,
      activeId: updatedActiveId,
      activeBanner,
      banners: updatedList,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error updating hero banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || id === 'hero-default') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default hero banner' },
        { status: 400 }
      );
    }

    const { banners: currentBanners, activeId: currentActiveId } = readStoredBanners();
    let updatedActiveId = currentActiveId;

    if (currentActiveId === id) {
      updatedActiveId = 'hero-default';
    }

    const updatedList = currentBanners
      .filter((b) => b.id !== id)
      .map((b) => ({
        ...b,
        is_active: b.id === updatedActiveId,
      }));

    writeStoredBanners(updatedList, updatedActiveId);

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('hero_banners').delete().eq('id', id);
        if (updatedActiveId === 'hero-default') {
          await supabase.from('hero_banners').update({ is_active: true }).eq('id', 'hero-default');
        }
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      activeId: updatedActiveId,
      banners: updatedList,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error deleting hero banner' },
      { status: 500 }
    );
  }
}
