import Installation from '../components/organisms/Installation/Installation';
import {useInstallationPublisher} from "../hooks/useInstallationPublisher.ts";


const InstallationPage = () => {
    useInstallationPublisher(true, 'Borgerhout');
    return <Installation />;
};

export default InstallationPage;