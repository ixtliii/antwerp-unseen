import type { ReactNode } from 'react';
import NavBar from '../components/molecules/NavBar/NavBar';
import Footer from '../components/molecules/Footer/Footer';

interface PageLayoutProps {
    children: ReactNode;
    showFooter?: boolean;
    navLight?: boolean;
    noPadding?: boolean;
}

const PageLayout = ({
                        children,
                        showFooter = true,
                        navLight = false,
                        noPadding = false,
                    }: PageLayoutProps) => (
    <>
        <NavBar light={navLight} />
        <main style={noPadding ? undefined : { paddingTop: '64px' }}>
            {children}
        </main>
        {showFooter && <Footer light={navLight} />}
    </>
);

export default PageLayout;