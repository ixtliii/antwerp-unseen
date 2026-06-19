export type Step = 'prompt' | 'format' | 'input' | 'confirm' | 'success';
export type Format = 'text' | 'voice' | 'image' | 'video';
export type UserType = 'local' | 'tourist';

export interface Prompt {
    id: number;
    text: string;
}

export const PROMPTS: Prompt[] = [
    { id: 1, text: 'When was the last time you felt alive in the city?' },
    { id: 2, text: "What happened here that the street doesn't show anymore?" },
    { id: 3, text: 'What keeps you moving on through here everyday?' },
];