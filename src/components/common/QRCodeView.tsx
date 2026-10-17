import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeViewProps {
  value?: string;
  url?: string;
  size?: number;
  className?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  url,
  size = 180,
  className = '',
  level = 'M',
}) => {
  const qrValue = value || url || '';
  if (!qrValue) return null;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-3 bg-sand-50 border-2 border-ink-950 rounded-tactile shadow-tactile ${className}`}
    >
      <div className="bg-sand-50 p-1.5 rounded-md border border-sand-300">
        <QRCodeSVG
          value={qrValue}
          size={size}
          level={level}
          bgColor="#FAF8F5"
          fgColor="#1A1917"
          includeMargin={false}
        />
      </div>
    </div>
  );
};
