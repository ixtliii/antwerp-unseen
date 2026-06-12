import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import type { Artwork } from '../../../types';

interface ArtworkCardProps {
    artwork: Artwork;
    index: number;
    onHover: (artwork: Artwork | null) => void;
}

export const ArtworkCard = ({ artwork, index, onHover }: ArtworkCardProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const scaleGroupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    const basePosition = useMemo(() => {
        const x = index * 26;
        const y = (index % 3 === 0 ? 0 : index % 2 === 0 ? 1 : -1) * (Math.random() * 14 + 10);
        const z = (Math.random() - 0.5) * 40;
        return new THREE.Vector3(x, y, z);
    }, [index]);

    useFrame((state, delta) => {
        if (!groupRef.current || !scaleGroupRef.current) return;

        const targetScale = hovered ? 1.05 : 1.0;
        scaleGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), delta * 6);

        const targetZ = hovered ? basePosition.z + 8 : basePosition.z;
        const targetRotX = hovered ? 0 : Math.sin(state.clock.elapsedTime * 0.2 + index) * 0.05;
        const targetRotY = hovered ? 0 : Math.cos(state.clock.elapsedTime * 0.3 + index) * 0.05;
        const targetY = hovered ? basePosition.y : basePosition.y + Math.sin(state.clock.elapsedTime * 0.4 + index) * 1.5;

        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 5);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 4);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 5);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 5);
    });

    return (
        <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
            <group ref={scaleGroupRef}>
                <Image
                    url={artwork.image_url}
                    transparent
                    opacity={1}
                    scale={[12, 12]}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        setHovered(true);
                        onHover(artwork);
                        document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={(e) => {
                        e.stopPropagation();
                        setHovered(false);
                        onHover(null);
                        document.body.style.cursor = 'auto';
                    }}
                />
            </group>
        </group>
    );
};