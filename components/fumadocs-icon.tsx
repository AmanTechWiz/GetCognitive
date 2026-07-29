'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type FumadocsIconProps = {
  className?: string;
  alt?: string;
};

export function FumadocsIcon({ className, alt = 'Cognitive' }: FumadocsIconProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const theme = mounted ? resolvedTheme : 'light';
  const src = theme === 'dark' ? '/cognitive-icon-dark.png' : '/cognitive-icon-light.png';

  return <Image src={src} alt={alt} width={80} height={80} className={className} priority />;
}
