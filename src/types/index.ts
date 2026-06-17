export type ISODateString = string;

export interface Tag {
    name: string;
    count: number;
}

export interface Contribution {
    id: number;
    type: 'photo' | 'text' | 'voice';
    content: string;
    whenCreated: ISODateString;
    tags: Tag[];
}

export interface Day {
    date: ISODateString;
    silhouetteUrl: string;
    contributions: Contribution[];
}

export interface Artist {
    id: string;
    name: string;
    kind: string;
}

export interface Artwork {
    id: string;
    artist_id: string;
    name: string;
    description: string;
    year: number;
    image_url: string;
    artist: Artist;
}
export interface WindowMemory {
    slug: string;
    location: string;
    videoSrc: string;
    poster?: string;
}