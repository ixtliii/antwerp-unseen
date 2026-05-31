import type { Day } from '../types';

const generateMockDays = (count: number): Day[] => {
    const days: Day[] = [];
    const startDate = new Date('2026-05-20T00:00:00Z');
    let contributionId = 1;

    const tagsList = ['morning', 'noon', 'evening', 'rain', 'wind', 'quiet', 'crowd', 'street'];

    for (let i = 0; i < count; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];

        const numContributions = Math.floor(Math.random() * 3) + 1;
        const contributions: Day['contributions'] = [];

        for (let j = 0; j < numContributions; j++) {
            const typeRoll = Math.random();
            let type: 'photo' | 'text' | 'voice' = 'photo';
            let content = `https://picsum.photos/seed/c${contributionId}/600/400`;

            if (typeRoll > 0.8) {
                type = 'text';
                content = `Generated text observation for ${dateString} at location ${j + 1}.`;
            } else if (typeRoll > 0.7) {
                type = 'voice';
                content = `https://example.com/voice/${contributionId}.mp3`;
            }

            const tag = tagsList[Math.floor(Math.random() * tagsList.length)];

            contributions.push({
                id: contributionId++,
                type,
                content,
                whenCreated: `${dateString}T${10 + j}:00:00Z`,
                tags: [{ name: tag, count: Math.floor(Math.random() * 15) + 1 }]
            });
        }

        const hasPhoto = contributions.some(c => c.type === 'photo');
        if (!hasPhoto) {
            contributions.push({
                id: contributionId++,
                type: 'photo',
                content: `https://picsum.photos/seed/c${contributionId}/600/400`,
                whenCreated: `${dateString}T15:00:00Z`,
                tags: [{ name: 'auto-photo', count: 1 }]
            });
        }

        days.push({
            date: dateString,
            silhouetteUrl: `https://picsum.photos/seed/day${i + 1}/800/600`,
            contributions,
        });
    }

    return days;
};

export const mockDays: Day[] = generateMockDays(100);