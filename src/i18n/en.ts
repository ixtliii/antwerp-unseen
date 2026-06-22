const en = {
    nav: {
        home:         'Home',
        archive:      'Archive',
        artists: "Artists",
        installation: 'Installation',
        submit:       'Share',
    },
    hero: {
        eyebrow:  'The Living Archive',
        title:    'ANTWERP\nUNSEEN',
        concept:  'Motion-sensing screens in Antwerp\'s neighbourhoods capture anonymous silhouettes and invite community memories — building a living archive of what the street no longer shows.',
        cta:      'Explore the archive',
        loading:  'Connecting to Antwerp...',
        fallback: 'Live feed temporarily unavailable',
    },
    map: {
        eyebrow:  'Find the screens',
        title:    'Seven screens across\nAntwerp\'s neighbourhoods.',
        subtitle: 'Each screen captures a different corner of the city. Click a location to watch live.',
        back:     '← Back',
        next:     'Next location',
        prev:     'Previous location',
        cta:      'View live',
        noCamera: 'Live feed unavailable for this location',
    },
    artworks: {
        eyebrow:  'From the archive',
        title:    'Contributions\nfrom the street.',
        cta:      'See all',
    },
    share: {
        eyebrow:  'Add your story',
        title:    'What happened here that\nthe street doesn\'t show anymore?',
        prompt:   'Current prompt',
        cta:      'Share your story',
        note:     'No account required. Contributions are reviewed before being published.',
    },
    footer: {
        tagline:  'A living archive of Antwerp\'s invisible lives.',
        contact:  'contact@antwerp-unseen.be',
        rights:   '© 2026 Antwerp Unseen',
    },
    a11y: {
        navMenu:  'Main navigation',
        langSwitch: 'Switch language',
        closeDetail: 'Close location detail',
    },
};

// Recursively widen literal types to `string` so other language files can
// supply their own translations while still being checked for completeness
// (every key must exist, structure must match).
type DeepWiden<T> = {
    [K in keyof T]: T[K] extends string ? string : DeepWiden<T[K]>;
};

export type Translations = DeepWiden<typeof en>;
export default en;