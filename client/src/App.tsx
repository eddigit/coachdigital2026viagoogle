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
import LeadsBase from "./pages/LeadsBase";
import Portfolio from "./pages/Portfolio";
import Notes from "./pages/Notes";
import EmailCampaigns from "./pages/EmailCampaigns";
import EmailTemplates from "./pages/EmailTemplates";
import Reviews from "./pages/Reviews";
import Prospection from "./pages/Prospection";
import Blog from "./pages/Blog";
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientInvitation from "./pages/client/Invitation";
import SignDocument from "./pages/SignDocument";
import ViewDocument from "./pages/ViewDocument";
import MentionsLegales from "./pages/MentionsLegales";
import CGV from "./pages/CGV";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import { usePWA } from "./hooks/usePWA";
import InstallPWABanner from "./components/InstallPWABanner";
import NotificationPermissionPrompt from "./components/NotificationPermissionPrompt";

import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
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
      <Route path="/leads-base" component={LeadsBase} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/notes" component={Notes} />
      <Route path="/email-campaigns" component={EmailCampaigns} />
      <Route path="/email-templates" component={EmailTemplates} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/prospection" component={Prospection} />
      <Route path="/blog" component={Blog} />

      {/* Routes espace client */}
      <Route path="/client/login" component={ClientLogin} />
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/invitation/:token" component={ClientInvitation} />
      <Route path="/client" component={ClientLogin} />

      {/* Routes documents publiques */}
      <Route path="/sign/:token" component={SignDocument} />
      <Route path="/view/:token" component={ViewDocument} />

      {/* Pages légales */}
      <Route path="/mentions-legales" component={MentionsLegales} />
      <Route path="/cgv" component={CGV} />
      <Route path="/politique-confidentialite" component={PolitiqueConfidentialite} />
      <Route path="/confidentialite" component={PolitiqueConfidentialite} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialiser PWA
  usePWA();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <InstallPWABanner />
          <NotificationPermissionPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
