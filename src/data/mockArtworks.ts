import type { Artwork } from '../types';

export const HARDCODED_ARTWORKS: Artwork[] = [
    {
        id: 'w1',
        artist_id: 'a1',
        name: 'Snow in the Park',
        description: 'Black and white photograph of a snowy bridge and trees at night with blurred snowflakes.',
        year: 2023,
        image_url: 'https://picsum.photos/seed/snow/800/1000',
        artist: { id: 'a1', name: 'Ronin De Goede', kind: 'Photographer' }
    },
    {
        id: 'w2',
        artist_id: 'a2',
        name: 'Green River',
        description: 'A muted, moody landscape painting of a green river and distant hills.',
        year: 2022,
        image_url: 'https://picsum.photos/seed/river/800/1000',
        artist: { id: 'a2', name: 'Michael de kok', kind: 'Painter' }
    },
    {
        id: 'w3',
        artist_id: 'a3',
        name: 'Golden Field Path',
        description: 'A scenic view of a dirt path running alongside a vibrant field and trees at sunset.',
        year: 2023,
        image_url: 'https://picsum.photos/seed/field/800/1000',
        artist: { id: 'a3', name: 'Colin waeghe', kind: 'Painter' }
    },
    {
        id: 'w4',
        artist_id: 'a4',
        name: 'Structure I',
        description: 'Abstract architectural charcoal drawing with heavy vertical textures.',
        year: 1970,
        image_url: 'https://picsum.photos/seed/structure/800/1000',
        artist: { id: 'a4', name: 'Jules lismonde', kind: 'Draftsman' }
    },
    {
        id: 'w5',
        artist_id: 'a5',
        name: 'Concrete Tower',
        description: 'A brutalist concrete block tower structure placed on a sandy beach.',
        year: 2021,
        image_url: 'https://picsum.photos/seed/tower/800/1000',
        artist: { id: 'a5', name: 'jef meyer', kind: 'Sculptor' }
    },
    {
        id: 'w6',
        artist_id: 'a1',
        name: 'Night Vines',
        description: 'High contrast black and white photo of ivy climbing trees in the dark.',
        year: 2023,
        image_url: 'https://picsum.photos/seed/vines/800/1000',
        artist: { id: 'a1', name: 'Ronin De Goede', kind: 'Photographer' }
    }
];