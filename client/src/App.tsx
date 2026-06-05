import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StaticSignature from "./pages/StaticSignature";
import FounderLetter from "./pages/FounderLetter";
import FinalOrielTransmission from "./pages/FinalOrielTransmission";
import Profile from "./pages/Profile";
import Archive from "./pages/Archive";
import TransmissionDetail from "./pages/TransmissionDetail";
import Artifacts from "./pages/Artifacts";
import Conduit from "./pages/Conduit";
import Protocol from "./pages/Protocol";
import Codex from "./pages/Codex";
import CodonDetail from "./pages/CodonDetail";
import Carrierlock from "./pages/Carrierlock";
import Reading from "./pages/Reading";
import Readings from "./pages/Readings";
import StaticReading from "./pages/StaticReading";
import DynamicReading from "./pages/DynamicReading";
import CurrentResonance from "./pages/CurrentResonance";
import FoundingSignatureLetter from "./pages/FoundingSignatureLetter";
import {
  FoundingSignatureProductPage,
  SignatureGlimpseProductPage,
} from "./pages/SignatureProductPage";
import SignatureIntake from "./pages/SignatureIntake";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Admin from "./pages/Admin";
import AdminSignatureLetters from "./pages/AdminSignatureLetters";
import OrbPreview from "./pages/OrbPreview";
import OracleDetail from "./pages/OracleDetail";
import NatalProfile from "./pages/NatalProfile";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path={"/orb-preview"} component={OrbPreview} />
      <Route
        path={"/admin/signature-letters"}
        component={AdminSignatureLetters}
      />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/auth"} component={Auth} />
      <Route path={"/complete-profile"} component={NatalProfile} />
      <Route path={"/blueprint"} component={StaticReading} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route
        path={"/founding-signature-letter"}
        component={FoundingSignatureLetter}
      />
      <Route
        path={"/oriel-signature-glimpse"}
        component={SignatureGlimpseProductPage}
      />
      <Route
        path={"/oriel-founding-signature-letter"}
        component={FoundingSignatureProductPage}
      />
      <Route path={"/signature-intake/:orderId"} component={SignatureIntake} />
      <Route path={"/"} component={Home} />
      <Route path={"/static-signature"} component={StaticSignature} />
      <Route path={"/founder-letter"} component={FounderLetter} />
      <Route
        path={"/final-oriel-transmission"}
        component={FinalOrielTransmission}
      />
      <Route path={"/archive"} component={Archive} />
      <Route path={"/transmission/:id"} component={TransmissionDetail} />
      <Route path={"/oracle/:oracleId"} component={OracleDetail} />
      <Route path={"/artifacts"} component={Artifacts} />
      <Route path={"/protocol"} component={Protocol} />
      <Route path={"/conduit"} component={Conduit} />
      <Route path={"/codex"} component={Codex} />
      <Route path={"/codex/:id"} component={CodonDetail} />
      <Route path={"/carrierlock"} component={Carrierlock} />
      <Route path={"/resonance"} component={CurrentResonance} />
      <Route path={"/readings"} component={Readings} />
      <Route path={"/reading/static/:readingId"} component={StaticReading} />
      <Route path={"/reading/dynamic/:id"} component={DynamicReading} />
      <Route path={"/reading/:id"} component={Reading} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppGate() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !user || user.hasNatalProfile) return;

    const requiresNatalProfile =
      location === "/blueprint" ||
      location === "/carrierlock" ||
      location === "/profile" ||
      location === "/readings" ||
      location.startsWith("/reading/");

    if (requiresNatalProfile && location !== "/complete-profile") {
      setLocation("/complete-profile");
    }
  }, [loading, location, setLocation, user]);

  return <Router />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppGate />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
