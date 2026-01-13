import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Search, User, Briefcase, CheckSquare, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: documents } = trpc.documents.list.useQuery();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredClients = clients?.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.company || ""}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredProjects = projects?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredTasks = tasks?.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredDocuments = documents?.filter((d) =>
    d.number.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelect = (path: string) => {
    setOpen(false);
    setLocation(path);
    setSearch("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md hover:bg-muted transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Rechercher...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Rechercher clients, projets, tâches, documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              {!search && (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  Tapez pour rechercher...
                </Command.Empty>
              )}

              {search && filteredClients.length === 0 && filteredProjects.length === 0 && filteredTasks.length === 0 && filteredDocuments.length === 0 && (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  Aucun résultat trouvé.
                </Command.Empty>
              )}

              {filteredClients.length > 0 && (
                <Command.Group heading="Clients" className="mb-2">
                  {filteredClients.slice(0, 5).map((client) => (
                    <Command.Item
                      key={`client-${client.id}`}
                      onSelect={() => handleSelect("/clients")}
                      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent"
                    >
                      <User className="w-4 h-4" />
                      <span>{client.firstName} {client.lastName}</span>
                      {client.company && (
                        <span className="text-xs text-muted-foreground">({client.company})</span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {filteredProjects.length > 0 && (
                <Command.Group heading="Projets" className="mb-2">
                  {filteredProjects.slice(0, 5).map((project) => (
                    <Command.Item
                      key={`project-${project.id}`}
                      onSelect={() => handleSelect(`/projects/${project.id}`)}
                      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>{project.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{project.status}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {filteredTasks.length > 0 && (
                <Command.Group heading="Tâches" className="mb-2">
                  {filteredTasks.slice(0, 5).map((task) => (
                    <Command.Item
                      key={`task-${task.id}`}
                      onSelect={() => handleSelect("/tasks")}
                      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>{task.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{task.status}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {filteredDocuments.length > 0 && (
                <Command.Group heading="Documents" className="mb-2">
                  {filteredDocuments.slice(0, 5).map((doc) => (
                    <Command.Item
                      key={`doc-${doc.id}`}
                      onSelect={() => handleSelect("/documents")}
                      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{doc.number}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{doc.type}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
