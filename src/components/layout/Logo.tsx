export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center text-2xl font-extrabold tracking-tight ${
        dark ? "text-ink" : "text-white"
      }`}
    >
      <span>Our</span>
      <span className="mx-0.5 inline-block h-4 w-4 rounded-full bg-accent" />
      <span>Vacation</span>
    </span>
  );
}