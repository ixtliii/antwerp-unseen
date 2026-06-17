export interface MapPin {
    slug: string;
    name: string;
    coord: string;
    lat: number;
    lng: number;
    description: string;
    image: string;
    x: number;
    z: number;
}

export const OUTLINE: [number, number][] = [
    [-3.2,-2.6],[-0.6,-3.0],[1.4,-2.4],[3.4,-2.9],[4.6,-1.2],[4.2,0.6],
    [4.9,2.2],[3.2,3.4],[1.0,3.8],[-1.0,3.3],[-2.8,3.6],[-3.9,1.6],[-3.3,-0.4],[-4.1,-1.6],
];

export const PINS: MapPin[] = [
    { slug:'het-steen-gardens', name:'Het Steen Gardens', coord:'51.2233°N 4.3975°E', lat:51.2233, lng:4.3975,
        description:'A medieval fortress on the Scheldt, its gardens hold quiet corners the city forgot.', image:'/locations/het-steen-gardens/castle.png', x:-1.6, z:0.4 },
    { slug:'vlaaikensgang', name:'Vlaaikensgang', coord:'51.2202°N 4.4012°E', lat:51.2202, lng:4.4012,
        description:'A hidden 16th-century alley, cobblestones worn smooth by centuries of footsteps.', image:'/locations/vlaaikensgang.png', x:-0.2, z:-1.4 },
    { slug:'borgerhout-backstreets', name:'Borgerhout Backstreets', coord:'51.2122°N 4.4380°E', lat:51.2122, lng:4.4380,
        description:'Where the city sheds its postcard face and shows its working heart.', image:'/locations/borgerhout-backstreets.png', x:2.6, z:-0.6 },
    { slug:'sint-annatunnel-interior', name:'Sint-Annatunnel Interior', coord:'51.2172°N 4.4214°E', lat:51.2172, lng:4.4214,
        description:'Wooden escalators descend into a tunnel beneath the river, humming with passing strangers.', image:'/locations/sint-annatunnel-interior.png', x:-2.2, z:2.2 },
    { slug:'zomerfabriek', name:'Zomerfabriek', coord:'51.2089°N 4.4501°E', lat:51.2089, lng:4.4501,
        description:'A former factory turned summer stage, echoing with what was made here.', image:'/locations/zomerfabriek.png', x:1.8, z:2.2 },
];

export const ROUTE_ORDER = [0, 1, 2, 4, 3];

export const mapsUrl = (p: MapPin) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;