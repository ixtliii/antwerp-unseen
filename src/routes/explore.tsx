import {mockClusters} from "../data/mock.ts";
import Scene from "../components/Scene/Scene.tsx";

const Explore = () => {

    return (
        <div>
            <Scene clusters={mockClusters} />
        </div>
    );
};

export default Explore;