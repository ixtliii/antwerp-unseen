import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

const CameraLogger = () => {
    const { camera } = useThree();

    useEffect(() => {
        const interval = setInterval(() => {
            console.log('position:', camera.position);
            console.log('rotation:', camera.rotation);
        }, 1000);
        return () => clearInterval(interval);
    }, [camera]);

    return null;
};

export default CameraLogger;