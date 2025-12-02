import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Grid background */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      
      {/* Noise overlay */}
      <div className="fixed inset-0 bg-noise opacity-5 pointer-events-none animate-noise" />
      
      <Header />
      
      {/* Main content with padding for fixed header/footer */}
      <main className="pt-16 pb-20 min-h-screen relative z-10">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
