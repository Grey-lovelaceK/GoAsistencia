const G = { soft: "linear-gradient(135deg, #2989d8 0%, #7db9e8 100%)" } as const;

export default function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("");
  const s = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: G.soft }}
    >
      {initials}
    </div>
  );
}
