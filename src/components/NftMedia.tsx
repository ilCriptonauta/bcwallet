import React from 'react';

type NftMediaProps = {
    src: string;
    alt: string;
    className?: string;
    mimeType?: string;
    loading?: "eager" | "lazy";
};

export const NftMedia: React.FC<NftMediaProps> = ({ src, alt, className, mimeType, loading = 'lazy' }) => {
    const isVideo = mimeType?.startsWith('video/') || src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.mov');

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
            />
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading={loading}
        />
    );
};
