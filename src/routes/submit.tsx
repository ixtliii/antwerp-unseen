import PageLayout from '../layouts/PageLayout';
import SubmitFlow from '../components/organisms/SubmitFlow/SubmitFlow';

const Submit = () => {
    return (
        <PageLayout noPadding showFooter={false}>
            <SubmitFlow />
        </PageLayout>
    );
};

export default Submit;