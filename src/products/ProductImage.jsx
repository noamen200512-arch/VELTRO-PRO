
import React from "react";
import { Package } from "lucide-react";

export default function ProductImage({
  src,
  size = 35,
  radius = 9,
  background = "rgba(53,214,208,0.07)",
  color = "#35D6D0",
  alt = "",
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background,
        color,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <Package size={Math.max(16, Math.round(size * 0.48))} />
      )}
    </div>
  );
}
