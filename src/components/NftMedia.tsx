import React, { useState } from 'react';

type NftMediaProps = {
    src: string;
    alt: string;
    className?: string;
    mimeType?: string;
    loading?: "eager" | "lazy";
    thumbnailFallback?: string;
};

export const NftMedia: React.FC<NftMediaProps> = ({ src, alt, className, mimeType, loading = 'lazy', thumbnailFallback }) => {
    const [videoError, setVideoError] = useState(false);

    const isVideo = !videoError && (
        mimeType?.startsWith('video/') ||
        /\.(mp4|webm|mov|ogv)(\?|$)/i.test(src)
    );

    const isGif = mimeType === 'image/gif' || /\.gif(\?|$)/i.test(src);
    const isSvg = mimeType === 'image/svg+xml' || /\.svg(\?|$)/i.test(src);

    if (isVideo) {
        return (
            <video
                src={src}
                className={className}
                autoPlay
                loop
                muted
                playsInline
                title={alt}
                onError={() => setVideoError(true)}
                crossOrigin="anonymous"
            />
        );
    }

    if (isSvg) {
        return (
            <object
                data={src}
                type="image/svg+xml"
                className={className}
                title={alt}
            >
                <img
                    src={thumbnailFallback || src}
                    alt={alt}
                    className={className}
                    loading={loading}
                    onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (thumbnailFallback && target.src !== thumbnailFallback) {
                            target.src = thumbnailFallback;
                        } else {
                            target.src = `https://picsum.photos/seed/${alt.replace(/\s/g, '').toLowerCase()}/400/400`;
                        }
                    }}
                />
            </object>
        );
    }

    return (
        <img
            src={videoError && thumbnailFallback ? thumbnailFallback : src}
            alt={alt}
            className={className}
            loading={loading}
            onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!videoError && thumbnailFallback && target.src !== thumbnailFallback) {
                    target.src = thumbnailFallback;
                } else {
                    target.src = `https://picsum.photos/seed/${alt.replace(/\s/g, '').toLowerCase()}/400/400`;
                }
            }}
        />
    );
};
