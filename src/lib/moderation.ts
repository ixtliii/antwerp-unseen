import { supabase } from './supabaseClient';

export interface ModerationResult {
    ok: boolean;
    flagged?: boolean;
    categories?: string[];
}

// Basic profanity list — extend as you like. Matched as whole words,
// case-insensitive, with light obfuscation handling.
const PROFANITY = [
    'bitch', 'fuck', 'shit', 'asshole', 'cunt', 'dick', 'bastard',
    'slut', 'whore', 'nigger', 'faggot', 'retard',
];

const containsProfanity = (text: string): boolean => {
    // normalise: lowercase, collapse common letter-substitutions and spacing
    const normalised = text
        .toLowerCase()
        .replace(/[\s._\-*]+/g, '')      // strip spaces/punctuation used to evade
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's');

    return PROFANITY.some((word) => normalised.includes(word));
};

export const moderateText = async (text: string): Promise<ModerationResult> => {
    if (!text || text.trim().length === 0) return { ok: true };

    // 1) local profanity filter (catches casual swearing the AI ignores)
    if (containsProfanity(text)) {
        return { ok: false, flagged: true, categories: ['profanity'] };
    }

    // 2) AI moderation for genuinely harmful content
    try {
        const { data, error } = await supabase.functions.invoke('moderate-text', {
            body: { text },
        });
        if (error) return { ok: true };
        return data as ModerationResult;
    } catch {
        return { ok: true };
    }
};