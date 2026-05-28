import type { Cluster } from "../../types";
import TimeCluster from "../TimeCluster/TimeCluster.tsx";
import './scene.css';

interface SceneProps {
    clusters: Cluster[];
}

const Scene = ({ clusters }: SceneProps) => {
    return (
        <div className="scene">
            <div className="scene__world">
                {clusters.map((cluster, index) => (
                    <TimeCluster
                        key={cluster.id}
                        whenHappened={cluster.whenHappened}
                        photos={cluster.photos}
                        style={{
                            transform: `translate(${index * -18}px, ${index * 18}px) rotateY(-15deg) rotateX(2deg)`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Scene;