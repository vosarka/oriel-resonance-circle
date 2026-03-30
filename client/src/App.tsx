import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Archive from "./pages/Archive";
import TransmissionDetail from "./pages/TransmissionDetail";
import OracleDetail from "./pages/OracleDetail";
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
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Admin from "./pages/Admin";
import OracleDetail from "./pages/OracleDetail";
<<<<<<< HEAD
<<<<<<< HEAD
import OrbPreview from "./pages/OrbPreview";
=======
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
=======
import OrbPreview from "./pages/OrbPreview";
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d

function Router() {
  return (
    <Switch>
      <Route path={"/orb-preview"} component={OrbPreview} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/auth"} component={Auth} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/"} component={Home} />
      <Route path={"/archive"} component={Archive} />
      <Route path={"/transmission/:id"} component={TransmissionDetail} />
      <Route path={"/oracle/:oracleId"} component={OracleDetail} />
      <Route path={"/artifacts"} component={Artifacts} />
      <Route path={"/protocol"} component={Protocol} />
      <Route path={"/conduit"} component={Conduit} />
      <Route path={"/codex"} component={Codex} />
      <Route path={"/codex/:id"} component={CodonDetail} />
      <Route path={"/carrierlock"} component={Carrierlock} />
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
