type ISODateString = string;

export interface Tag {
    name: string;
    count: number;
}

export interface Photo {
    id: number;
    url:string;
    whenCreated:ISODateString;
    tags: Tag[];
}

export interface Cluster {
    id:string;
    whenHappened:ISODateString;
    photos:Photo[];
}
