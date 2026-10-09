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
  } catch (e) {}

  // Ensure default hero banner always exists
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
  } catch (e) {}
}

async function uploadBase64ToSupabaseStorage(
  dataUrl: string,
  bannerId: string
): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase || !dataUrl.startsWith('data:')) return null;

  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const mimeType = matches[1];
    const ext = mimeType.split('/')[1] || 'png';
    const fileName = `banners/banner-${bannerId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(matches[2], 'base64');

    const buckets = ['hero_banners', 'resources', 'public'];
    for (const bucket of buckets) {
      try {
        const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
          contentType: mimeType,
          cacheControl: '31536000',
          upsert: true,
        });

        if (!error) {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);
          if (pubData?.publicUrl) {
            return pubData.publicUrl;
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[Hero API] Error uploading base64 to Supabase Storage:', err);
  }
  return null;
}

export async function GET() {
  try {
    const { banners: diskBanners, activeId: diskActiveId, deletedIds } = readStoredBanners();
    const supabase = getSupabaseServerClient();

    if (supabase) {
      try {
        // 1. Fetch from Supabase hero_banners table
        const { data: supaBanners, error: supaErr } = await supabase
          .from('hero_banners')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!supaErr && supaBanners && supaBanners.length > 0) {
          const remoteList = supaBanners as HeroBannerModel[];
          const map = new Map<string, HeroBannerModel>();

          // Merge remote items (Supabase is source of truth)
          for (const item of remoteList) {
            if (item && item.id && !deletedIds.includes(item.id)) {
              map.set(item.id, item);
            }
          }

          // Ensure default banner exists
          if (!map.has('hero-default')) {
            map.set('hero-default', initialHeroBanners[0]);
          }

          const allBanners = Array.from(map.values());
          // Check which banner is active in Supabase
          const remoteActive = allBanners.find((b) => b.is_active);
          const activeId = remoteActive?.id || 'hero-default';

          const finalBanners = allBanners.map((b) => ({
            ...b,
            is_active: b.id === activeId,
          }));

          const activeBanner =
            finalBanners.find((b) => b.id === activeId) ||
            finalBanners.find((b) => b.is_default) ||
            initialHeroBanners[0];

          // Sync back to memory/disk
          writeStoredBanners(finalBanners, activeId, deletedIds);

          return NextResponse.json({
            success: true,
            activeId,
            activeBanner,
            banners: finalBanners,
          });
        }
      } catch (err) {
        console.warn('[Hero API] Supabase query notice, using disk fallback:', err);
      }
    }

    // Fallback to disk list
    const activeBanner =
      diskBanners.find((b) => b.is_active) ||
      diskBanners.find((b) => b.is_default || b.id === 'hero-default') ||
      initialHeroBanners[0];

    return NextResponse.json({
      success: true,
      activeId: diskActiveId,
      activeBanner,
      banners: diskBanners,
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
    const supabase = getSupabaseServerClient();

    if (action === 'set_active' && bannerIdToActivate) {
      updatedActiveId = bannerIdToActivate;
      updatedList = updatedList.map((b) => ({
        ...b,
        is_active: b.id === bannerIdToActivate,
        updated_at: b.id === bannerIdToActivate ? now : b.updated_at,
      }));
      targetSavedBanner = updatedList.find((b) => b.id === bannerIdToActivate) || null;

      // Sync active state to Supabase table
      if (supabase) {
        try {
          await supabase.from('hero_banners').update({ is_active: false }).neq('id', bannerIdToActivate);
          await supabase.from('hero_banners').update({ is_active: true, updated_at: now }).eq('id', bannerIdToActivate);
        } catch (sbErr) {
          console.warn('[Hero API] Supabase set_active notice:', sbErr);
        }
      }
    } else if (bannerData) {
      const isDefault = bannerData.is_default || bannerData.id === 'hero-default';
      const id = bannerData.id || `hero-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // If image_url is a base64 string, upload to Supabase Storage to get a clean permanent CDN URL
      let finalImageUrl = (bannerData.image_url || '/home/hero.png').trim();
      if (finalImageUrl.startsWith('data:')) {
        const uploadedUrl = await uploadBase64ToSupabaseStorage(finalImageUrl, id);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      updatedDeletedIds = updatedDeletedIds.filter((deletedId) => deletedId !== id);
      const existingIdx = updatedList.findIndex((b) => b.id === id);

      const newBanner: HeroBannerModel = {
        id,
        title: (bannerData.title || (isDefault ? 'Default Agency Showcase' : 'Special Promotion')).trim(),
        subtitle: (bannerData.subtitle || '').trim(),
        badge_text: (bannerData.badge_text || '').trim(),
        image_url: finalImageUrl,
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

      // Sync to Supabase table
      if (supabase) {
        try {
          if (newBanner.is_active) {
            await supabase.from('hero_banners').update({ is_active: false }).neq('id', newBanner.id);
          }
          await supabase.from('hero_banners').upsert({
            id: newBanner.id,
            title: newBanner.title,
            subtitle: newBanner.subtitle,
            badge_text: newBanner.badge_text,
            image_url: newBanner.image_url,
            link_url: newBanner.link_url,
            button_text: newBanner.button_text,
            aspect_ratio: newBanner.aspect_ratio,
            is_active: newBanner.is_active,
            is_default: newBanner.is_default,
            display_order: newBanner.display_order,
            updated_at: now,
          });
        } catch (sbErr) {
          console.warn('[Hero API] Supabase upsert notice:', sbErr);
        }
      }
    }

    writeStoredBanners(updatedList, updatedActiveId, updatedDeletedIds);

    const activeBanner =
      updatedList.find((b) => b.id === updatedActiveId) ||
      updatedList.find((b) => b.is_active) ||
      updatedList[0];

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
