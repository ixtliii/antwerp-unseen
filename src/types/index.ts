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

export interface Artwork {
    id: string;
    title: string;
    date: ISODateString;
    imageUrl: string;
}

export interface Artist {
    id: string;
    name: string;
    artworks: Artwork[];
}