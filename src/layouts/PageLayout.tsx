import type { ReactNode } from 'react';
import NavBar from '../components/molecules/NavBar/NavBar';
import Footer from '../components/molecules/Footer/Footer';

interface PageLayoutProps {
    children:    ReactNode;
    showFooter?: boolean;  // installation page doesn't need a footer
}

const PageLayout = ({ children, showFooter = true }: PageLayoutProps) => (
    <>
        <NavBar />
        <main style={{ paddingTop: '52px' }}>
            {children}
        </main>
        {showFooter && <Footer />}
    </>
);

export default PageLayout;