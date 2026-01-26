"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type RenderImageProps = {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
  className?: string;
  size?: number;
};

export const RenderImage = ({
  src,
  alt = "image",
  fallbackSrc = "/image-not-found.jpg",
  className = "",
  size = 40,
}: RenderImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  // If no image at all → show fallback avatar
  if (!imgSrc) {
    return (
      <Avatar className={className} style={{ width: size, height: size }}>
        <AvatarFallback>
          <Image
            src={fallbackSrc}
            alt={alt}
            width={size}
            height={size}
          />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      <Image
        src={imgSrc}
        alt={alt}
        width={size}
        height={size}
        className="object-cover rounded-full"
        onError={() => setImgSrc(undefined)}
      />
    </Avatar>
  );
};
