import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { HeroBannerModel } from '@/lib/supabase/types';
import { initialHeroBanners } from '@/lib/seed-data';

let inMemoryData: StoredData | null = null;

function getStorageFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'hero_banners.json');
  } catch {
    // Vercel serverless read-only filesystem fallback
    return path.join('/tmp', 'hero_banners.json');
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

interface StoredData {
  banners: HeroBannerModel[];
  activeId: string;
  deletedIds?: string[];
  updated_at?: string;
}

function readStoredBanners(): { banners: HeroBannerModel[]; activeId: string; deletedIds: string[] } {
  let banners: HeroBannerModel[] = inMemoryData?.banners ? [...inMemoryData.banners] : [...initialHeroBanners];
  let activeId = inMemoryData?.activeId || 'hero-default';
  let deletedIds: string[] = inMemoryData?.deletedIds || [];

  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as StoredData;
      if (parsed) {
        if (Array.isArray(parsed.deletedIds)) {
          deletedIds = parsed.deletedIds;
        }
        if (Array.isArray(parsed.banners) && parsed.banners.length > 0) {
          banners = parsed.banners.filter((b) => b && b.id && !deletedIds.includes(b.id));
          activeId = parsed.activeId || banners.find((b) => b.is_active)?.id || 'hero-default';
        }
      }
    }
  } catch (e) {
    // Use inMemoryData if file read failed
  }

  // Ensure default hero banner always exists and can never be removed
  const defaultHeroIndex = banners.findIndex((b) => b.is_default || b.id === 'hero-default');
  if (defaultHeroIndex === -1) {
    banners.unshift(initialHeroBanners[0]);
  } else {
    banners[defaultHeroIndex] = {
      ...initialHeroBanners[0],
      ...banners[defaultHeroIndex],
      id: 'hero-default',
      is_default: true,
      image_url: banners[defaultHeroIndex].image_url || '/home/hero.png',
    };
  }

  // Enforce active banner
  if (!banners.some((b) => b.id === activeId)) {
    activeId = 'hero-default';
  }

  const mappedBanners = banners.map((b) => ({
    ...b,
    is_active: b.id === activeId,
  }));

  return { banners: mappedBanners, activeId, deletedIds };
}

function writeStoredBanners(banners: HeroBannerModel[], activeId: string, deletedIds: string[] = []) {
  const dataToSave: StoredData = {
    banners,
    activeId,
    deletedIds,
    updated_at: new Date().toISOString(),
  };
  inMemoryData = dataToSave;

  const filePath = getStorageFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (e) {
    // Silent in-memory fallback
  }
}

export async function GET() {
  try {
    const { banners: diskBanners, activeId, deletedIds } = readStoredBanners();
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

          // Add disk banners first (our local authority)
          for (const item of diskBanners) {
            if (item && item.id) map.set(item.id, item);
          }

          // Add remote items ONLY if they were not deleted
          for (const item of data as HeroBannerModel[]) {
            if (item && item.id && !deletedIds.includes(item.id) && !map.has(item.id)) {
              map.set(item.id, item);
            }
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

    const activeBanner =
      finalList.find((b) => b.is_active) ||
      finalList.find((b) => b.is_default || b.id === 'hero-default') ||
      initialHeroBanners[0];

    return NextResponse.json({
      success: true,
      activeId,
      activeBanner,
      banners: finalList,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error fetching hero banners',
        activeBanner: initialHeroBanners[0],
        banners: initialHeroBanners,
      },
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

    const { banners: currentBanners, activeId: currentActiveId, deletedIds: currentDeletedIds } = readStoredBanners();
    let updatedActiveId = currentActiveId;
    let updatedList = [...currentBanners];
    let updatedDeletedIds = [...currentDeletedIds];
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
      
      // Remove from deleted IDs if re-saved
      updatedDeletedIds = updatedDeletedIds.filter((deletedId) => deletedId !== id);

      const existingIdx = updatedList.findIndex((b) => b.id === id);

      const newBanner: HeroBannerModel = {
        id,
        title: (bannerData.title || (isDefault ? 'Default Agency Showcase' : 'Special Promotion')).trim(),
        subtitle: (bannerData.subtitle || '').trim(),
        badge_text: (bannerData.badge_text || '').trim(),
        image_url: (bannerData.image_url || '/home/hero.png').trim(),
        link_url: (bannerData.link_url || '').trim(),
        button_text: (bannerData.button_text || 'Claim Offer').trim(),
        aspect_ratio: bannerData.aspect_ratio || 'auto',
        is_active: bannerData.is_active ?? (existingIdx >= 0 ? updatedList[existingIdx].is_active : true),
        is_default: isDefault,
        display_order: bannerData.display_order ?? (existingIdx >= 0 ? updatedList[existingIdx].display_order : updatedList.length),
        created_at: (existingIdx >= 0 ? updatedList[existingIdx].created_at : bannerData.created_at) || now,
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
    writeStoredBanners(updatedList, updatedActiveId, updatedDeletedIds);

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
        { success: false, error: 'Cannot delete the default hero banner.' },
        { status: 400 }
      );
    }

    const { banners: currentBanners, activeId: currentActiveId, deletedIds: currentDeletedIds } = readStoredBanners();
    
    // Ensure default hero banner cannot be deleted
    const targetBanner = currentBanners.find((b) => b.id === id);
    if (targetBanner?.is_default) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default hero banner.' },
        { status: 400 }
      );
    }

    let updatedActiveId = currentActiveId;
    if (currentActiveId === id) {
      updatedActiveId = 'hero-default';
    }

    const updatedDeletedIds = Array.from(new Set([...currentDeletedIds, id]));
    const updatedList = currentBanners
      .filter((b) => b.id !== id)
      .map((b) => ({
        ...b,
        is_active: b.id === updatedActiveId,
      }));

    writeStoredBanners(updatedList, updatedActiveId, updatedDeletedIds);

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('hero_banners').delete().eq('id', id);
        if (updatedActiveId === 'hero-default') {
          await supabase.from('hero_banners').update({ is_active: true }).eq('id', 'hero-default');
        }
      } catch (e) {
        console.warn('[Hero API] Supabase delete notice:', e);
      }
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
