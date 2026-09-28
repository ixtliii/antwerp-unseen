export const MAP_W = 1344;
export const MAP_H = 666;

export interface MapLine {
    src: string;
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface MapImageLayer {
    src: string;
    left: number;
    top: number;
    width: number;
    height?: number;   // optional — layers without it auto-scale from aspect ratio
    depth: number;
    flipX?: boolean;
}
export interface Location {
    slug: string;
    name: string;
    coordinates: string;
    lat: number;
    lng: number;
    marker: { left: number; top: number };
    label: { left: number; top: number; align: 'left' | 'right' };
    line: MapLine;
    layers: MapImageLayer[];
}

const pct = (p: number) => (p / 100) * MAP_W;

export const LOCATIONS: Location[] = [
    {
        slug: 'het-steen-gardens',
        name: 'Het Steen Gardens',
        coordinates: '51.2233° N, 4.3975° E',
        lat: 51.2233,
        lng: 4.3975,
        marker: { left: pct(63.99), top: 600 },
        label: { left: pct(56.77), top: 624, align: 'left' },
        line: { src: '/locations/lines/line-sintanna.svg', left: 750, top: 263.5, width: 492, height: 237.5 },
        layers: [
            { src: '/locations/het-steen-gardens/treebehind.png', left: 816,  top: 354, width: 41,  height: 55,  depth: 0.4 },
            { src: '/locations/het-steen-gardens/castle.png',     left: 649,  top: 430, width: 76,  height: 80,  depth: 0.8 },
            { src: '/locations/het-steen-gardens/object.png',     left: 682,  top: 394, width: 147, height: 159, depth: 0.6 },
            { src: '/locations/het-steen-gardens/treeright.png',  left: 917,  top: 441, width: 120, height: 120, depth: 1.3 },
            { src: '/locations/het-steen-gardens/treefront.png',  left: 1005, top: 510, width: 137, height: 145, depth: 1.8 },
        ],
    },
    {
        slug: 'vlaaikensgang',
        name: 'Vlaaikensgang',
        coordinates: '51.2202° N, 4.4012° E',
        lat: 51.2202,
        lng: 4.4012,
        marker: { left: pct(5.58), top: 78 },
        label: { left: 0, top: 105, align: 'left' },
        line: { src: '/locations/lines/line-vlaaikensgang.svg', left: 88, top: 63.5, width: 477, height: 187.5 },
        layers: [
            { src: '/locations/vlaaikensgang.png', left: pct(13.54), top: 6, width: pct(15), depth: 0.8 },
        ],
    },
    {
        slug: 'borgerhout-backstreets',
        name: 'Borgerhout Backstreets',
        coordinates: '51.2122° N, 4.4380° E',
        lat: 51.2122,
        lng: 4.4380,
        marker: { left: pct(80.73), top: 56 },
        label: { left: pct(77.08), top: 0, align: 'left' },
        line: { src: '/locations/lines/line-borgerhout.svg', left: 708, top: 51, width: 378.5, height: 158.5 },
        layers: [
            { src: '/locations/borgerhout-backstreets.png', left: pct(59.08), top: 24, width: pct(17.7), depth: 0.8 },
        ],
    },
    {
        slug: 'sint-annatunnel-interior',
        name: 'Sint-Annatunnel Interior',
        coordinates: '51.2172° N, 4.4214° E',
        lat: 51.2172,
        lng: 4.4214,
        marker: { left: pct(92.04), top: 394 },
        label: { left: pct(88.76), top: 341, align: 'left' },
        line: { src: '/locations/lines/line-hetsteen.svg', left: 640.5, top: 349.5, width: 234, height: 250.5 },
        layers: [
            { src: '/locations/sint-annatunnel-interior.png', left: pct(76.04), top: 228, width: pct(13), depth: 0.8 },
        ],
    },
    {
        slug: 'zomerfabriek',
        name: 'Zomerfabriek',
        coordinates: '51.2089° N, 4.4501° E',
        lat: 51.2089,
        lng: 4.4501,
        marker: { left: pct(10.34), top: 499 },
        label: { left: pct(4.17), top: 518, align: 'left' },
        line: { src: '/locations/lines/line-zomerfabriek.svg', left: 69, top: 317, width: 514.5, height: 220.5 },
        layers: [
            { src: '/locations/zomerfabriek.png', left: pct(12.8), top: 300, width: pct(18.82), depth: 0.8 },
        ],
    },
];