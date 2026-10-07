import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for serverless environment
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(clientIp: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(clientIp);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
        return true;
    }

    entry.count += 1;
    return false;
}

// Clean old rate limit entries periodically to prevent memory leaks
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of rateLimitMap.entries()) {
            if (now > data.resetTime) {
                rateLimitMap.delete(ip);
            }
        }
    }, 5 * 60 * 1000);
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/json'
]);

export async function POST(request: NextRequest) {
    try {
        // 1. Rate Limiting Check
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                         request.headers.get('x-real-ip') || 
                         'unknown';

        if (isRateLimited(clientIp)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait a minute before uploading again.' },
                { status: 429 }
            );
        }

        // 2. Parse Form Data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 3. File Size Check
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: `File size exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // 4. MIME Type Check
        if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
            return NextResponse.json(
                { error: `Unsupported file type (${file.type}). Allowed types: images, MP4/WebM videos, audio, JSON.` },
                { status: 400 }
            );
        }

        // 5. Check Server Environment Configuration
        const pinataJwt = process.env.PINATA_JWT;
        if (!pinataJwt) {
            console.error('SERVER ERROR: PINATA_JWT is missing in environment variables.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 6. Sanitize Filename & Prepare FormData for Pinata v3
        const safeFileName = (file.name || 'nft-upload').replace(/[^a-zA-Z0-9._-]/g, '_');
        const pinataFormData = new FormData();
        pinataFormData.append('file', file);
        pinataFormData.append('name', safeFileName);
        pinataFormData.append('network', 'public');

        const res = await fetch('https://uploads.pinata.cloud/v3/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${pinataJwt}` },
            body: pinataFormData,
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Pinata upload failed:', text);
            return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 502 });
        }

        const data = await res.json();
        const cid = data?.data?.cid ?? data?.IpfsHash;

        if (!cid) {
            return NextResponse.json({ error: 'Invalid response from Pinata' }, { status: 502 });
        }

        // Return the CID cleanly to the frontend
        return NextResponse.json({ cid });

    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

