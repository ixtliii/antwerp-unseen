import { QRCodeSVG } from 'qrcode.react';
import './installationQR.css';

interface InstallationQRProps {
    url: string;
}

const InstallationQR = ({ url }: InstallationQRProps) => (
    <div className="installation__qr">
        <div className="installation__qr-frame">
            <QRCodeSVG
                value={url}
                size={132}
                bgColor="transparent"
                fgColor="#f0ede8"
                level="M"
                marginSize={0}
            />
            <span className="installation__qr-scanline" aria-hidden />
            <span className="installation__qr-corner installation__qr-corner--tl" aria-hidden />
            <span className="installation__qr-corner installation__qr-corner--tr" aria-hidden />
            <span className="installation__qr-corner installation__qr-corner--bl" aria-hidden />
            <span className="installation__qr-corner installation__qr-corner--br" aria-hidden />
        </div>
        <span className="installation__qr-label">
            scan to share<br />your answer
        </span>
    </div>
);

export default InstallationQR;