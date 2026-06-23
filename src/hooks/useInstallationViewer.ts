import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CHANNEL = 'installation-stream';
const PRESENCE_TIMEOUT = 4000;

interface ViewerState {
    isLive: boolean;
    location: string | null;
    frame: string | null;
}

export const useInstallationViewer = (): ViewerState => {
    const [isLive, setIsLive] = useState(false);
    const [location, setLocation] = useState<string | null>(null);
    const [frame, setFrame] = useState<string | null>(null);
    const lastSeenRef = useRef<number>(0);

    useEffect(() => {
        const channel = supabase.channel(CHANNEL, {
            config: { broadcast: { self: false } },
        });

        channel
            .on('broadcast', { event: 'frame' }, (msg) => {
                lastSeenRef.current = Date.now();
                setIsLive(true);
                if (msg.payload?.location) setLocation(msg.payload.location);
                if (msg.payload?.img) setFrame(msg.payload.img);
            })
            .on('broadcast', { event: 'publisher-offline' }, () => {
                setIsLive(false);
                setFrame(null);
            })
            .subscribe();

        const presenceCheck = setInterval(() => {
            if (lastSeenRef.current && Date.now() - lastSeenRef.current > PRESENCE_TIMEOUT) {
                setIsLive(false);
                setFrame(null);
            }
        }, 1000);

        return () => {
            clearInterval(presenceCheck);
            supabase.removeChannel(channel);
        };
    }, []);

    return { isLive, location, frame };
};