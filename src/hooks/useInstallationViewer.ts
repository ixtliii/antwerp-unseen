import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CHANNEL = 'installation-stream';
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const PRESENCE_TIMEOUT = 8000;

interface ViewerState {
    isLive: boolean;
    location: string | null;
    stream: MediaStream | null;
}

export const useInstallationViewer = (): ViewerState => {
    const [isLive, setIsLive] = useState(false);
    const [location, setLocation] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const lastSeenRef = useRef<number>(0);

    useEffect(() => {
        const channel = supabase.channel(CHANNEL, {
            config: { broadcast: { self: false } },
        });
        channelRef.current = channel;

        const createPeer = () => {
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

            pc.ontrack = (e) => {
                setStream(e.streams[0]);
            };

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    channel.send({
                        type: 'broadcast',
                        event: 'ice-viewer',
                        payload: { candidate: e.candidate },
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                if (
                    pc.connectionState === 'failed' ||
                    pc.connectionState === 'disconnected' ||
                    pc.connectionState === 'closed'
                ) {
                    setStream(null);
                }
            };

            return pc;
        };

        channel
            .on('broadcast', { event: 'publisher-online' }, (msg) => {
                lastSeenRef.current = Date.now();
                setLocation(msg.payload?.location ?? null);
                setIsLive(true);
                // ask publisher to (re)offer if we don't have a connection yet
                if (!pcRef.current) {
                    channel.send({ type: 'broadcast', event: 'viewer-ready', payload: {} });
                }
            })
            .on('broadcast', { event: 'publisher-offline' }, () => {
                setIsLive(false);
                setStream(null);
                if (pcRef.current) {
                    pcRef.current.close();
                    pcRef.current = null;
                }
            })
            .on('broadcast', { event: 'offer' }, async (msg) => {
                if (pcRef.current) pcRef.current.close();
                const pc = createPeer();
                pcRef.current = pc;
                await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                channel.send({
                    type: 'broadcast',
                    event: 'answer',
                    payload: { sdp: answer },
                });
            })
            .on('broadcast', { event: 'ice-publisher' }, async (msg) => {
                const pc = pcRef.current;
                if (pc && msg.payload.candidate) {
                    try {
                        await pc.addIceCandidate(msg.payload.candidate);
                    } catch {
                        /* ignore */
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    channel.send({ type: 'broadcast', event: 'viewer-ready', payload: {} });
                }
            });

        // presence timeout: if no heartbeat within window, mark offline
        const presenceCheck = setInterval(() => {
            if (lastSeenRef.current && Date.now() - lastSeenRef.current > PRESENCE_TIMEOUT) {
                setIsLive(false);
                setStream(null);
                if (pcRef.current) {
                    pcRef.current.close();
                    pcRef.current = null;
                }
            }
        }, 2000);

        return () => {
            clearInterval(presenceCheck);
            if (pcRef.current) pcRef.current.close();
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, []);

    return { isLive, location, stream };
};