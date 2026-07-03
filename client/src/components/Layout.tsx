import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import BackgroundPattern from "./BackgroundPattern";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
  noBackground?: boolean;
  overlayHeader?: boolean;
}

export default function Layout({
  children,
  hideFooter,
  hideHeader,
  noBackground,
  overlayHeader,
}: LayoutProps) {
  return (
    <div className="oriel-shell">
      {!noBackground && <BackgroundPattern />}

      {!hideHeader && <Header />}

      <main
        className={`oriel-main ${overlayHeader ? "oriel-main--overlay" : "oriel-main--padded"} ${hideFooter ? "" : "pb-20"}`}
      >
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
