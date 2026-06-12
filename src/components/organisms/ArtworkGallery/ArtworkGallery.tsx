import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Artwork } from '../../../types';
import { ArtworkCard } from '../../molecules/ArtworkCard/ArtworkCard';

interface ArtworkGalleryProps {
    artworks: Artwork[];
    onHover: (artwork: Artwork | null) => void;
}

export const ArtworkGallery = ({ artworks, onHover }: ArtworkGalleryProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const target = useRef({ x: 0, y: 0 });
    const current = useRef({ x: 0, y: 0 });

    const bounds = {
        minX: -(artworks.length * 24) + 24,
        maxX: 24,
        minY: -15,
        maxY: 15
    };

    useEffect(() => {
        let isDragging = false;
        let lastPos = { x: 0, y: 0 };

        const handleWheel = (e: WheelEvent) => {
            target.current.x -= e.deltaX * 0.08;
            target.current.y += e.deltaY * 0.08;
            target.current.x = Math.max(bounds.minX, Math.min(target.current.x, bounds.maxX));
            target.current.y = Math.max(bounds.minY, Math.min(target.current.y, bounds.maxY));
        };

        const handlePointerDown = (e: PointerEvent) => {
            isDragging = true;
            lastPos = { x: e.clientX, y: e.clientY };
            document.body.style.cursor = 'grabbing';
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!isDragging) return;
            const deltaX = e.clientX - lastPos.x;
            const deltaY = e.clientY - lastPos.y;
            target.current.x += deltaX * 0.12;
            target.current.y -= deltaY * 0.12;
            target.current.x = Math.max(bounds.minX, Math.min(target.current.x, bounds.maxX));
            target.current.y = Math.max(bounds.minY, Math.min(target.current.y, bounds.maxY));
            lastPos = { x: e.clientX, y: e.clientY };
        };

        const handlePointerUp = () => {
            isDragging = false;
            document.body.style.cursor = 'auto';
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        current.current.x = THREE.MathUtils.lerp(current.current.x, target.current.x, delta * 4);
        current.current.y = THREE.MathUtils.lerp(current.current.y, target.current.y, delta * 4);

        groupRef.current.position.x = current.current.x;
        groupRef.current.position.y = current.current.y;

        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, state.pointer.y * 0.12, delta * 2);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.12, delta * 2);
    });

    return (
        <group ref={groupRef}>
            {artworks.map((artwork, index) => (
                <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    index={index}
                    onHover={onHover}
                />
            ))}
        </group>
    );
};