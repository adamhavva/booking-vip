/**
 * Gradient placeholder that stands in for a photo.
 * `tone` is a Tailwind gradient stop pair, e.g. "from-sky-400 to-blue-600".
 */
export default function Thumb({
  tone,
  className = "",
}: {
  tone: string;
  className?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${tone} ${className}`} aria-hidden />
  );
}