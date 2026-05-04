import { Outlet, useLocation } from "react-router";
import { AppLayout } from "./AppLayout";

const authPages = ["/", "/login", "/signup"];

export function RootLayout() {
  const location = useLocation();
  const isAuthPage = authPages.includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="h-screen w-full overflow-y-auto bg-background">
        <Outlet />
      </div>
    );
  }

  return <AppLayout />;
}
