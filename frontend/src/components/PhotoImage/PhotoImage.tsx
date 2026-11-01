import { useEffect, useState } from "react";
import type { Photo } from "../../types/api";
import { api } from "../../api/client";

interface Props {
  photo: Photo;
  alt: string;
  className?: string;
}

/** Jedno zdjęcie: plik wymaga nagłówka X-User-Id, więc fetch → blob → URL.createObjectURL */
export default function PhotoImage({ photo, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    api
      .getBlob(photo.file_url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        // zostaje szare pole – błąd jednego zdjęcia nie psuje reszty
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.file_url]);

  return src ? <img src={src} alt={alt} className={className} /> : <div className={className} aria-hidden="true" />;
}
