import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CHANNEL = 'installation-stream';
const FRAME_INTERVAL = 1000;
const FRAME_WIDTH = 480;
const JPEG_QUALITY = 0.5;

interface PublisherState {
    status: 'idle' | 'requesting' | 'live' | 'error';
    error: string | null;
}

export const useInstallationPublisher = (
    enabled: boolean,
    location: string
): PublisherState => {
    const [state, setState] = useState<PublisherState>({ status: 'idle', error: null });

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        let stream: MediaStream | null = null;
        let frameTimer: ReturnType<typeof setInterval> | null = null;

        setState({ status: 'requesting', error: null });

        const channel = supabase.channel(CHANNEL, {
            config: { broadcast: { self: false } },
        });

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const sendFrame = () => {
            if (!ctx || video.readyState < 2) return;
            const ratio = video.videoHeight / video.videoWidth || 0.75;
            canvas.width = FRAME_WIDTH;
            canvas.height = Math.round(FRAME_WIDTH * ratio);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
            channel.send({
                type: 'broadcast',
                event: 'frame',
                payload: { img: dataUrl, location },
            });
        };

        const start = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                video.srcObject = stream;
                await video.play();

                channel.subscribe((status) => {
                    if (status === 'SUBSCRIBED' && !cancelled) {
                        setState({ status: 'live', error: null });
                        sendFrame();
                        frameTimer = setInterval(sendFrame, FRAME_INTERVAL);
                    }
                });
            } catch (err) {
                if (!cancelled) {
                    setState({
                        status: 'error',
                        error: err instanceof Error ? err.message : 'Camera access denied',
                    });
                }
            }
        };

        start();

        return () => {
            cancelled = true;
            if (frameTimer) clearInterval(frameTimer);
            channel.send({ type: 'broadcast', event: 'publisher-offline', payload: {} });
            supabase.removeChannel(channel);
            if (stream) stream.getTracks().forEach((t) => t.stop());
            video.srcObject = null;
            setState({ status: 'idle', error: null });
        };
    }, [enabled, location]);

    return state;
};