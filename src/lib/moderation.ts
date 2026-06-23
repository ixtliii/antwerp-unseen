import { supabase } from './supabaseClient';

export interface ModerationResult {
    ok: boolean;
    flagged?: boolean;
    categories?: string[];
}

export const moderateText = async (text: string): Promise<ModerationResult> => {
    if (!text || text.trim().length === 0) return { ok: true };

    try {
        const { data, error } = await supabase.functions.invoke('moderate-text', {
            body: { text },
        });

        if (error) {
            console.error('Moderation invoke error:', error);
            return { ok: true };
        }

        return data as ModerationResult;
    } catch (e) {
        console.error('Moderation threw:', e);
        return { ok: true };
    }
};