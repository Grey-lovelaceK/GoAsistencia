import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import DesktopLogin from "./login/DesktopLogin";
import MobileLogin from "./login/MobileLogin";

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin" : "/punch", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated) return null;

  return isMobile ? <MobileLogin /> : <DesktopLogin />;
}
