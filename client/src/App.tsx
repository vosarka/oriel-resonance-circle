import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Archive from "./pages/Archive";
import Artifacts from "./pages/Artifacts";
import Tiers from "./pages/Tiers";
import Protocol from "./pages/Protocol";
import Conduit from "./pages/Conduit";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/archive"} component={Archive} />
      <Route path={"/artifacts"} component={Artifacts} />
      <Route path={"/tiers"} component={Tiers} />
      <Route path={"/protocol"} component={Protocol} />
      <Route path={"/conduit"} component={Conduit} />
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
