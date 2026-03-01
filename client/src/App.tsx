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
import Artifacts from "./pages/Artifacts";
import Conduit from "./pages/Conduit";
import Protocol from "./pages/Protocol";
import Codex from "./pages/Codex";
import CodonDetail from "./pages/CodonDetail";
import Carrierlock from "./pages/Carrierlock";
import Reading from "./pages/Reading";
import Readings from "./pages/Readings";
import StaticReading from "./pages/StaticReading";
import Auth from "./pages/Auth";

function Router() {
  return (
    <Switch>
      <Route path={"/auth"} component={Auth} />
      <Route path={"/"} component={Home} />
      <Route path={"/archive"} component={Archive} />
      <Route path={"/transmission/:id"} component={TransmissionDetail} />
      <Route path={"/artifacts"} component={Artifacts} />
      <Route path={"/protocol"} component={Protocol} />
      <Route path={"/conduit"} component={Conduit} />
      <Route path={"/codex"} component={Codex} />
      <Route path={"/codex/:id"} component={CodonDetail} />
      <Route path={"/carrierlock"} component={Carrierlock} />
      <Route path={"/readings"} component={Readings} />
      <Route path={"/reading/static/:readingId"} component={StaticReading} />
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
