export interface ImageTransform {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
}

export const transformedImageUrl = (
    publicUrl: string | null | undefined,
    opts: ImageTransform = {}
): string => {
    if (!publicUrl) return '/silhouette-default.jpg';
    if (!publicUrl.includes('/storage/v1/object/public/')) return publicUrl;

    const rendered = publicUrl.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
    );

    const params = new URLSearchParams();
    if (opts.width) params.set('width', String(opts.width));
    if (opts.height) params.set('height', String(opts.height));
    params.set('quality', String(opts.quality ?? 70));
    if (opts.resize) params.set('resize', opts.resize);

    return `${rendered}?${params.toString()}`;
};