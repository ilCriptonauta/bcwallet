import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const pinataJwt = process.env.PINATA_JWT;

        if (!pinataJwt) {
            console.error('SERVER ERROR: PINATA_JWT is missing in environment variables.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Prepare FormData for Pinata v3
        const pinataFormData = new FormData();
        pinataFormData.append('file', file);
        pinataFormData.append('name', file.name || 'nft-upload');
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
