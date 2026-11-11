import Image from "next/image";

/**
 * The photo of a card — falls back to the gradient placeholder when the row
 * has no image yet.
 */
export default function CardImage({
  src,
  tone,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 320px",
}: {
  src?: string | null;
  tone: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (!src) {
    return (
      <div
        className={`bg-gradient-to-br ${tone} ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
