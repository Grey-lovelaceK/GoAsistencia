const G = { btn: "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)" } as const;

export default function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
      style={{ background: G.btn, boxShadow: "0 4px 14px rgba(41,137,216,0.3)" }}
    >
      {children}
    </button>
  );
}
