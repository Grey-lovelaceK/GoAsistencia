import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-brand-navy flex items-center justify-center">
      <div className="text-white text-center space-y-4">
        <h1 className="text-7xl font-bold text-brand-mid">404</h1>
        <p className="text-white/60">Página no encontrada</p>
        <Link
          to="/login"
          className="inline-block text-brand-light hover:text-white underline text-sm transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
