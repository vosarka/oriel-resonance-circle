import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import BackgroundPattern from "./BackgroundPattern";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Pattern */}
      <BackgroundPattern />
      
      <Header />
      
      {/* Main content with padding for fixed header/footer */}
      <main className="pt-16 pb-20 min-h-screen relative z-10">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
