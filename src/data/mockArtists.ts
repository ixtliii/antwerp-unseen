import type { Artist } from '../types';

export const MOCK_ARTISTS: Artist[] = [
    {
        id: 'a1',
        name: 'Ronin De Goede',
        artworks: [
            { id: 'aw1', title: 'Forest Light', date: '2018-03-12', imageUrl: 'https://picsum.photos/seed/ronin1/1200/800' },
            { id: 'aw2', title: 'Quiet Streets', date: '2019-07-22', imageUrl: 'https://picsum.photos/seed/ronin2/1200/800' },
        ],
    },
    {
        id: 'a2',
        name: 'Michael de kok',
        artworks: [
            { id: 'aw3', title: 'Harbour Study', date: '2017-11-04', imageUrl: 'https://picsum.photos/seed/michael1/1200/800' },
        ],
    },
    {
        id: 'a3',
        name: 'Alexandre dagan',
        artworks: [
            { id: 'aw4', title: 'Name of artwork', date: '2015-12-20', imageUrl: 'https://picsum.photos/seed/alex1/1200/800' },
            { id: 'aw5', title: 'Tunnel', date: '2016-04-18', imageUrl: 'https://picsum.photos/seed/alex2/1200/800' },
        ],
    },
    {
        id: 'a4',
        name: 'Fik van gestel',
        artworks: [
            { id: 'aw6', title: 'Brushwork I', date: '2020-09-30', imageUrl: 'https://picsum.photos/seed/fik1/1200/800' },
        ],
    },
    {
        id: 'a5',
        name: 'Serge Vandercam',
        artworks: [
            { id: 'aw7', title: 'Untitled', date: '1964-05-10', imageUrl: 'https://picsum.photos/seed/serge1/1200/800' },
        ],
    },
    {
        id: 'a6',
        name: 'Jan Burssens',
        artworks: [
            { id: 'aw8', title: 'Figure', date: '1972-08-15', imageUrl: 'https://picsum.photos/seed/jan1/1200/800' },
        ],
    },
];