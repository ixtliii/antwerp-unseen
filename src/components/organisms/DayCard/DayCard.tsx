import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture, Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import type { Day } from '../../../types';

interface DayCardProps {
    day: Day;
    position: [number, number, number];
    isActive: boolean;
    onClick: () => void;
    velocityRef: React.MutableRefObject<number>;
    setHovered: (hovered: boolean) => void;
}

const DayCard = ({ day, position, isActive, onClick, velocityRef, setHovered }: DayCardProps) => {
    const texture = useTexture(day.silhouetteUrl);

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                map: { value: texture },
                velocity: { value: 0 },
                grayscale: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D map;
                uniform float velocity;
                uniform float grayscale;
                varying vec2 vUv;

                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                void main() {
                    float absVel = abs(velocity);
                    vec2 grid = vec2(120.0, 84.0);
                    vec2 blockUv = floor(vUv * grid) / grid;
                    float randX = random(blockUv) * 2.0 - 1.0;
                    float randY = random(blockUv + vec2(1.0, 0.0)) * 2.0 - 1.0;
                    vec2 finalUv = vUv + vec2(randX, randY) * absVel * 0.08;
                    float shift = velocity * 0.045;
                    float r = texture2D(map, clamp(finalUv + vec2(shift, 0.0), 0.0, 1.0)).r;
                    float g = texture2D(map, clamp(finalUv, 0.0, 1.0)).g;
                    float b = texture2D(map, clamp(finalUv - vec2(shift, 0.0), 0.0, 1.0)).b;
                    float alpha = 1.0;
                    if (finalUv.x < 0.0 || finalUv.x > 1.0 || finalUv.y < 0.0 || finalUv.y > 1.0) alpha = 0.0;
                    vec3 color = vec3(r, g, b);
                    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                    vec3 finalColor = mix(color, vec3(luminance), grayscale);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `
        });
    }, [texture]);

    // Fixed spring definition and usage
    const props = useSpring({
        from: { scale: 0, yLift: -0.5, grayscaleWeight: 1 },
        to: {
            scale: isActive ? 1.3 : 1,
            yLift: isActive ? 0.4 : 0,
            grayscaleWeight: isActive ? 0 : 1,
        },
        config: { tension: 160, friction: 20 }
    });

    useFrame(() => {
        material.uniforms.velocity.value = velocityRef.current;
        // Accessing the value correctly from the spring result
        material.uniforms.grayscale.value = props.grayscaleWeight.get();
    });

    const [{ tiltX, tiltY }, tiltApi] = useSpring(() => ({
        tiltX: 0,
        tiltY: 0,
        config: { tension: 300, friction: 20 }
    }));

    const handlePointerMove = (e: any) => {
        if (!isActive || !e.uv) return;
        const x = (e.uv.x - 0.5) * 2;
        const y = (e.uv.y - 0.5) * 2;
        tiltApi.start({ tiltX: y * 0.08, tiltY: x * 0.08 });
        document.body.style.cursor = 'none';
        setHovered(true);
    };

    const handlePointerLeave = () => {
        tiltApi.start({ tiltX: 0, tiltY: 0 });
        document.body.style.cursor = 'auto';
        setHovered(false);
    };

    return (
        <animated.group position-x={position[0]} position-y={props.yLift} position-z={position[2]}>
            <group rotation={[0, -Math.PI / 2, 0]}>
                <animated.group rotation-x={tiltX} rotation-y={tiltY}>
                    <animated.mesh
                        scale={props.scale}
                        onClick={onClick}
                        onPointerMove={handlePointerMove}
                        onPointerOut={handlePointerLeave}
                    >
                        <planeGeometry args={[2, 1.4]} />
                        <primitive object={material} attach="material" />
                    </animated.mesh>
                </animated.group>
            </group>
            <Text
                position={[0, -.5, 1.5]}
                rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
                fontSize={0.12}
                color="#cccccc"
                anchorX="left"
                anchorY="top"
            >
                {day.date}
            </Text>
        </animated.group>
    );
};

export default DayCard;