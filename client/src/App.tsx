import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import ProjectDetail from "./pages/ProjectDetail";
import TimeTracking from "./pages/TimeTracking";
import Messages from "./pages/Messages";
import Vault from "./pages/Vault";
import Requirements from "./pages/Requirements";
import Today from "./pages/Today";
import Leads from "./pages/Leads";
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientInvitation from "./pages/client/Invitation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/clients" component={Clients} />
      <Route path="/projects" component={Projects} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/documents" component={Documents} />
      <Route path="/settings" component={Settings} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/profile" component={Profile} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/time-tracking" component={TimeTracking} />
      <Route path="/messages" component={Messages} />
      <Route path="/vault" component={Vault} />
      <Route path="/requirements" component={Requirements} />
      <Route path="/today" component={Today} />
      <Route path="/leads" component={Leads} />
      
      {/* Routes espace client */}
      <Route path="/client/login" component={ClientLogin} />
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/invitation/:token" component={ClientInvitation} />
      <Route path="/client" component={ClientLogin} />
      
      <Route path="/404" component={NotFound} />
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
