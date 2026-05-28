import Card from "../Card/Card.tsx";
import type {Photo} from "../../types";
import * as React from "react";
import './timeCluster.css';

interface ClusterProps {
    whenHappened: string;
    photos: Photo[];
    style?: React.CSSProperties;
}

const TimeCluster = ({ whenHappened, photos, style} : ClusterProps) => {

    return (
        <div className="cluster" style={style}>
            {photos.map((photo, index) =>(
                <Card key={photo.id} url={photo.url} index={index} />
            ))}
            <span className="cluster__timestamp">{whenHappened}</span>
        </div>
    );
};

export default TimeCluster;
