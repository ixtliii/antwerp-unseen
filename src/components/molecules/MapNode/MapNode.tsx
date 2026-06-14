import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Location } from '../../../data/locations';
import './mapNode.css';

interface MapNodeProps {
    location: Location;
    index: number;
    mouse: React.RefObject<{ x: number; y: number }>;
    onSelect: (slug: string) => void;
}

const MapNode = ({ location, index, mouse, onSelect }: MapNodeProps) => {
    const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tick = () => {
                const m = mouse.current;
                if (!m) return;
                layerRefs.current.forEach((layer, i) => {
                    if (!layer) return;
                    const depth = location.layers[i].depth;
                    // small, bounded parallax — deeper layers shift a little more
                    gsap.to(layer, {
                        x: m.x * 10 * depth,
                        y: m.y * 6 * depth,
                        duration: 1.4,
                        ease: 'power2.out',
                        overwrite: 'auto',
                    });
                });
            };
            gsap.ticker.add(tick);
            return () => gsap.ticker.remove(tick);
        });
        return () => ctx.revert();
    }, [location, index, mouse]);

    return (
        <div className="map-node">
            {location.layers.map((layer, i) => (
                <button
                    key={i}
                    type="button"
                    ref={(el) => { layerRefs.current[i] = el as unknown as HTMLDivElement; }}
                    className="map-node__layer-wrap"
                    onClick={() => onSelect(location.slug)}
                    aria-label={location.name}
                    style={{
                        left: layer.left,
                        top: layer.top,
                        width: layer.width,
                        height: layer.height,
                        zIndex: i + 1,
                    }}
                >
                    <img
                        src={layer.src}
                        alt=""
                        className="map-node__layer"
                        loading="lazy"
                        style={{ transform: layer.flipX ? 'scaleX(-1)' : undefined }}
                    />
                </button>
            ))}
        </div>
    );
};

export default MapNode;