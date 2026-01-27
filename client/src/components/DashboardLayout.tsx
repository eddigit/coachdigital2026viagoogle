import { useFirebaseAuth } from "@/_core/hooks/useFirebaseAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Briefcase, CheckSquare, FileText, Calendar, Clock, MessageSquare, Lock, Settings, FileCheck, User, Sun, TrendingUp, StickyNote, Mail, Star, FileCode, UserPlus, Target, Plus } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationsBell from "@/components/NotificationsBell";
import { CSSProperties, useEffect, useRef, useState } from "react";

import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type MenuItem = {
  icon: any;
  label: string;
  path: string;
};

type MenuGroup = {
  label?: string;
  items: MenuItem[];
  adminOnly?: boolean;
};

const menuGroups: MenuGroup[] = [
  {
    items: [
      { icon: Sun, label: "Aujourd'hui", path: "/today" },
    ],
  },
  {
    label: "ACTIVITE",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Briefcase, label: "Projets", path: "/projects" },
      { icon: FileCheck, label: "Cahier des charges", path: "/requirements" },
      { icon: CheckSquare, label: "Tâches", path: "/tasks" },
      { icon: Clock, label: "Suivi Temps", path: "/time-tracking" },
    ],
  },
  {
    label: "CRM & BUSINESS",
    items: [
      { icon: Users, label: "Clients", path: "/clients" },
      { icon: Target, label: "Portefeuille", path: "/portfolio" },
      { icon: FileText, label: "Documents", path: "/documents" },
      { icon: MessageSquare, label: "Messages", path: "/messages" },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { icon: UserPlus, label: "Base de Leads", path: "/leads-base" },
      { icon: Mail, label: "Campagnes Emails", path: "/email-campaigns" },
      { icon: MessageSquare, label: "Messages", path: "/messages" },
      { icon: Star, label: "Avis Clients", path: "/reviews" },
    ],
  },
  {
    label: "OUTILS",
    items: [
      { icon: Calendar, label: "Calendrier", path: "/calendar" },
      { icon: StickyNote, label: "Notes", path: "/notes" },
      { icon: FileCode, label: "Templates Emails", path: "/email-templates" },
      { icon: Lock, label: "Coffre-fort", path: "/vault" },
    ],
  },
  {
    label: "ADMIN",
    adminOnly: true,
    items: [
      { icon: Settings, label: "Paramètres", path: "/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              setLocation("/login");
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useFirebaseAuth();
  const { data: company } = trpc.company.get.useQuery();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const allMenuItems = menuGroups.flatMap(group => group.items);
  const activeMenuItem = allMenuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  // Note dialog state
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: "yellow" as "yellow" | "blue" | "green" | "red" | "purple" | "orange",
  });

  const utils = trpc.useUtils();
  const createNoteMutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate();
      setIsNoteDialogOpen(false);
      setNewNote({ title: "", content: "", color: "yellow" });
      toast.success("Note créée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la création de la note");
    }
  });

  const handleCreateNote = () => {
    if (!newNote.title || !newNote.content) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    createNoteMutation.mutate({
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      pinned: false,
    });
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  {company?.appLogo ? (
                    <img
                      src={company.appLogo}
                      alt="Logo"
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <>
                      <div className="w-8 h-8 border-2 border-primary rounded-sm flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-lg">G</span>
                      </div>
                      <span className="font-semibold tracking-tight truncate">
                        Coach Digital
                      </span>
                    </>
                  )}
                </div>
              ) : (
                company?.appLogo ? (
                  <img
                    src={company.appLogo}
                    alt="Logo"
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 border-2 border-primary rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-lg">G</span>
                  </div>
                )
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {menuGroups.map((group, index) => {
              if (group.adminOnly) { // TODO: Implement admin role check with custom claims
                return null;
              }

              return (
                <SidebarGroup key={index} className="py-2">
                  {group.label && (
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map(item => {
                        const isActive = location === item.path;
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => setLocation(item.path)}
                              tooltip={item.label}
                              className={`h-10 transition-all font-normal`}
                            >
                              <item.icon
                                className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                              />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>


        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="overflow-x-hidden max-w-full">
        {/* Header avec profil en haut à droite */}
        <div className="flex h-14 items-center justify-between bg-background/95 px-3 sm:px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40 max-w-full">
          <div className="flex items-center gap-4 flex-1">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="tracking-tight text-foreground font-medium">
                  {activeMenuItem?.label ?? "Dashboard"}
                </span>
              </div>
            </div>
            <div className="flex-1 max-w-md hidden sm:block">
              <GlobalSearch />
            </div>
          </div>

          {/* Notifications et Profil */}
          <div className="flex items-center gap-2">

            {/* Bouton Nouvelle Note */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground"
                  title="Nouvelle note"
                >
                  <StickyNote className="h-5 w-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="note-title">Titre</Label>
                    <Input
                      id="note-title"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      placeholder="Titre de la note"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note-content">Contenu</Label>
                    <Textarea
                      id="note-content"
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="Contenu de la note..."
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="note-color">Couleur</Label>
                    <Select
                      value={newNote.color}
                      onValueChange={(value: any) => setNewNote({ ...newNote, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yellow">🟡 Jaune</SelectItem>
                        <SelectItem value="blue">🔵 Bleu</SelectItem>
                        <SelectItem value="green">🟢 Vert</SelectItem>
                        <SelectItem value="red">🔴 Rouge</SelectItem>
                        <SelectItem value="purple">🟣 Violet</SelectItem>
                        <SelectItem value="orange">🟠 Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateNote} className="w-full" disabled={createNoteMutation.isPending}>
                    {createNoteMutation.isPending ? "Création..." : "Créer la note"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <NotificationsBell />
            {/* Widget Profil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ""} className="object-cover" />
                    ) : (
                      <AvatarFallback className="text-xs font-medium">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left hidden md:block">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.displayName || user?.email || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Mon Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden max-w-full">{children}</main>
      </SidebarInset>
    </>
  );
}
