import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
    let mimeType = 'image/png';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      const ext = file.name.split('.').pop() || 'png';
      fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      mimeType = file.type || 'image/png';
    } else {
      const body = await request.json();
      const dataUrl = body.dataUrl || body.image_url;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'No image data provided' }, { status: 400 });
      }

      if (dataUrl.startsWith('data:')) {
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          const ext = mimeType.split('/')[1] || 'png';
          fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
          fileBuffer = Buffer.from(matches[2], 'base64');
        } else {
          return NextResponse.json({ success: false, error: 'Invalid data URL' }, { status: 400 });
        }
      } else if (dataUrl.startsWith('http')) {
        // Already a valid URL
        return NextResponse.json({ success: true, url: dataUrl });
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ success: false, error: 'Could not process image buffer' }, { status: 400 });
    }

    // 1. Upload to Supabase Storage
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const bucketsToTry = ['hero_banners', 'resources', 'public'];
      for (const bucket of bucketsToTry) {
        try {
          const filePath = `banners/${fileName}`;
          let { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
              contentType: mimeType,
              cacheControl: '31536000',
              upsert: true,
            });

          // If bucket not found, try to create it (requires service role or permissions)
          if (uploadError && uploadError.message?.toLowerCase().includes('not found')) {
            try {
              await supabase.storage.createBucket(bucket, { public: true });
              const retry = await supabase.storage
                .from(bucket)
                .upload(filePath, fileBuffer, {
                  contentType: mimeType,
                  cacheControl: '31536000',
                  upsert: true,
                });
              uploadError = retry.error;
            } catch {}
          }

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              return NextResponse.json({ success: true, url: publicUrlData.publicUrl, bucket });
            }
          }
        } catch (err) {
          // Try next bucket
        }
      }
    }

    // 2. Fallback: Save to public uploads directory
    try {
      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }
      const localFilePath = path.join(publicUploadsDir, fileName);
      fs.writeFileSync(localFilePath, fileBuffer);
      return NextResponse.json({ success: true, url: `/uploads/hero/${fileName}` });
    } catch (e) {
      // Return base64 as emergency fallback if filesystem is read-only
      const base64Fallback = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      return NextResponse.json({ success: true, url: base64Fallback });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Image upload failed' }, { status: 500 });
  }
}
