export type ISODateString = string;

export interface Tag {
    name: string;
    count: number;
}

export interface Contribution {
    id: string;                          // uuid from Supabase
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

export interface Submission {
    id: string;
    created_at: string;
    location: string | null;
    prompt_id: number;
    prompt_text: string;
    format: 'text' | 'voice' | 'image' | 'video';
    user_type: 'local' | 'tourist';
    content_text: string | null;
    file_url: string | null;
    file_name: string | null;
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