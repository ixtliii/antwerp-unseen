import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CHANNEL = 'installation-stream';
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

interface PublisherState {
    status: 'idle' | 'requesting' | 'live' | 'error';
    error: string | null;
}

export const useInstallationPublisher = (
    enabled: boolean,
    location: string
): PublisherState => {
    const [state, setState] = useState<PublisherState>({ status: 'idle', error: null });
    const streamRef = useRef<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        setState({ status: 'requesting', error: null });

        const channel = supabase.channel(CHANNEL, {
            config: { broadcast: { self: false } },
        });
        channelRef.current = channel;

        const createPeer = (stream: MediaStream) => {
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    channel.send({
                        type: 'broadcast',
                        event: 'ice-publisher',
                        payload: { candidate: e.candidate },
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') {
                    if (!cancelled) setState({ status: 'live', error: null });
                }
                if (
                    pc.connectionState === 'failed' ||
                    pc.connectionState === 'disconnected'
                ) {
                    if (!cancelled) setState({ status: 'requesting', error: null });
                }
            };

            return pc;
        };

        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;

                channel
                    .on('broadcast', { event: 'viewer-ready' }, async () => {
                        const pc = createPeer(stream);
                        pcRef.current = pc;
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        channel.send({
                            type: 'broadcast',
                            event: 'offer',
                            payload: { sdp: offer },
                        });
                    })
                    .on('broadcast', { event: 'answer' }, async (msg) => {
                        const pc = pcRef.current;
                        if (pc && !pc.currentRemoteDescription) {
                            await pc.setRemoteDescription(
                                new RTCSessionDescription(msg.payload.sdp)
                            );
                        }
                    })
                    .on('broadcast', { event: 'ice-viewer' }, async (msg) => {
                        const pc = pcRef.current;
                        if (pc && msg.payload.candidate) {
                            try {
                                await pc.addIceCandidate(msg.payload.candidate);
                            } catch {
                                /* ignore late candidates */
                            }
                        }
                    })
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            // announce presence; viewers waiting will react
                            channel.send({
                                type: 'broadcast',
                                event: 'publisher-online',
                                payload: { location },
                            });
                            if (!cancelled) setState({ status: 'requesting', error: null });
                        }
                    });

                // heartbeat so viewers know we're alive even if they join later
                const heartbeat = setInterval(() => {
                    channel.send({
                        type: 'broadcast',
                        event: 'publisher-online',
                        payload: { location },
                    });
                }, 3000);

                // store for cleanup
                (channel as any).__heartbeat = heartbeat;
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
            const hb = (channelRef.current as any)?.__heartbeat;
            if (hb) clearInterval(hb);
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'publisher-offline',
                    payload: {},
                });
                supabase.removeChannel(channelRef.current);
            }
            if (pcRef.current) pcRef.current.close();
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            setState({ status: 'idle', error: null });
        };
    }, [enabled, location]);

    return state;
};