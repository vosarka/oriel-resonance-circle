import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import BackgroundPattern from "./BackgroundPattern";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export default function Layout({ children, hideFooter }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Pattern */}
      <BackgroundPattern />

      <Header />

      {/* Main content with padding for fixed header */}
      <main className={`pt-16 ${hideFooter ? "" : "pb-20"} min-h-screen relative z-10`}>
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
