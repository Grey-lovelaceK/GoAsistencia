import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard, AdminGuard } from "@/components/auth/AuthGuard";
import LoginPage from "@/pages/LoginPage";
import PunchPage from "@/pages/punch/PunchPage";
import AdminPage from "@/pages/admin/AdminPage";
import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <AuthGuard />,
    children: [
      { path: "/punch", element: <PunchPage /> },
    ],
  },
  {
    element: <AdminGuard />,
    children: [
      { path: "/admin/*", element: <AdminPage /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
