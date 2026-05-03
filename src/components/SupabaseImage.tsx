import React, { useEffect, useState } from 'react';
import { getVehiclePhotoUrl } from '../lib/imageUpload';

type SupabaseImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallback?: React.ReactNode;
};

export function SupabaseImage({ src, alt = '', fallback = null, ...props }: SupabaseImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState('');

  useEffect(() => {
    let active = true;
    setResolvedSrc('');

    if (!src) return () => {
      active = false;
    };

    void getVehiclePhotoUrl(src)
      .then(url => {
        if (active) setResolvedSrc(url);
      })
      .catch(error => {
        console.error('Vehicle photo load failed', error);
        if (active) setResolvedSrc('');
      });

    return () => {
      active = false;
    };
  }, [src]);

  if (!resolvedSrc) return <>{fallback}</>;

  return <img src={resolvedSrc} alt={alt} {...props} />;
}
