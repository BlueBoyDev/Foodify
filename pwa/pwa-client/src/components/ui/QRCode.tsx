interface QRProps {
  size?: number;
}

export function QRCode({ size = 80 }: QRProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" fill="white" rx="4"/>
      {/* Top-left finder */}
      <rect x="4"  y="4"  width="28" height="28" rx="3" fill="#1a1a1a"/>
      <rect x="8"  y="8"  width="20" height="20" fill="white"/>
      <rect x="12" y="12" width="12" height="12" fill="#1a1a1a"/>
      {/* Top-right finder */}
      <rect x="48" y="4"  width="28" height="28" rx="3" fill="#1a1a1a"/>
      <rect x="52" y="8"  width="20" height="20" fill="white"/>
      <rect x="56" y="12" width="12" height="12" fill="#1a1a1a"/>
      {/* Bottom-left finder */}
      <rect x="4"  y="48" width="28" height="28" rx="3" fill="#1a1a1a"/>
      <rect x="8"  y="52" width="20" height="20" fill="white"/>
      <rect x="12" y="56" width="12" height="12" fill="#1a1a1a"/>
      {/* Data modules */}
      <rect x="36" y="36" width="8" height="8" fill="#1a1a1a"/>
      <rect x="48" y="48" width="8" height="8" fill="#1a1a1a"/>
      <rect x="60" y="48" width="8" height="8" fill="#1a1a1a"/>
      <rect x="48" y="60" width="8" height="8" fill="#1a1a1a"/>
      <rect x="60" y="60" width="8" height="8" fill="#1a1a1a"/>
      <rect x="36" y="48" width="8" height="8" fill="#1a1a1a"/>
      <rect x="36" y="60" width="8" height="8" fill="#1a1a1a"/>
      <rect x="48" y="36" width="8" height="8" fill="#1a1a1a"/>
      <rect x="60" y="36" width="8" height="8" fill="#1a1a1a"/>
    </svg>
  );
}
