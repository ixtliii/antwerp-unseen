import type { Submission } from '../types';

/**
 * Simulated submissions, shown on the archive page only when there is no
 * database connection. They exist purely to illustrate the visuals.
 * Media points at files that ship in /public so it works fully offline.
 */

const daysAgo = (days: number, hour = 14): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, 12, 0, 0);
    return d.toISOString();
};

const PROMPTS = [
    'What do you hear when the city goes quiet?',
    'Describe the last thing that made you stop walking.',
    'Which corner of Antwerp belongs to you?',
    'What would you tell the person who walks here tomorrow?',
];

export const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: 'mock-1',
        created_at: daysAgo(0, 16),
        location: 'Het Steen',
        prompt_id: 1,
        prompt_text: PROMPTS[0],
        format: 'text',
        user_type: 'local',
        content_text: 'Church bells, a bicycle chain somewhere behind me, and the river pretending it is not there.',
        file_url: null,
        file_name: null,
    },
    {
        id: 'mock-2',
        created_at: daysAgo(1, 9),
        location: 'Borgerhout',
        prompt_id: 2,
        prompt_text: PROMPTS[1],
        format: 'image',
        user_type: 'local',
        content_text: null,
        file_url: '/locations/borgerhout-backstreets.webp',
        file_name: 'borgerhout-backstreets.webp',
    },
    {
        id: 'mock-3',
        created_at: daysAgo(2, 20),
        location: 'Sint-Annatunnel',
        prompt_id: 1,
        prompt_text: PROMPTS[0],
        format: 'voice',
        user_type: 'tourist',
        content_text: 'It echoes so much down here. Everyone whispers without noticing.',
        file_url: null,
        file_name: null,
    },
    {
        id: 'mock-4',
        created_at: daysAgo(4, 11),
        location: 'Vlaaikensgang',
        prompt_id: 3,
        prompt_text: PROMPTS[2],
        format: 'image',
        user_type: 'tourist',
        content_text: null,
        file_url: '/locations/vlaaikensgang.webp',
        file_name: 'vlaaikensgang.webp',
    },
    {
        id: 'mock-5',
        created_at: daysAgo(6, 18),
        location: 'Zomerfabriek',
        prompt_id: 4,
        prompt_text: PROMPTS[3],
        format: 'text',
        user_type: 'local',
        content_text: 'Look up. Nobody ever looks up here, and the light is best right before you turn the corner.',
        file_url: null,
        file_name: null,
    },
    {
        id: 'mock-6',
        created_at: daysAgo(9, 22),
        location: 'Het Steen',
        prompt_id: 2,
        prompt_text: PROMPTS[1],
        format: 'video',
        user_type: 'tourist',
        content_text: null,
        file_url: '/videos/moon.mp4',
        file_name: 'moon.mp4',
    },
    {
        id: 'mock-7',
        created_at: daysAgo(15, 13),
        location: 'Borgerhout',
        prompt_id: 3,
        prompt_text: PROMPTS[2],
        format: 'voice',
        user_type: 'local',
        content_text: 'The bakery on the corner. You can smell it from the tram stop.',
        file_url: null,
        file_name: null,
    },
    {
        id: 'mock-8',
        created_at: daysAgo(40, 10),
        location: 'Sint-Annatunnel',
        prompt_id: 4,
        prompt_text: PROMPTS[3],
        format: 'text',
        user_type: 'tourist',
        content_text: 'Take the long way. The short way is for people who are late.',
        file_url: null,
        file_name: null,
    },
];
