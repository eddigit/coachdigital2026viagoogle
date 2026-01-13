import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import ChatInterface from "@/components/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MessageCircle, User } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [selectedClientUserId, setSelectedClientUserId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<number>(0);

  // Récupérer tous les messages pour l'admin
  const { data: allMessages, isLoading } = trpc.messages.listForAdmin.useQuery();

  // Compter les messages non lus
  const { data: unreadData } = trpc.messages.countUnread.useQuery({
    userId: 1, // Admin ID
    userType: "admin",
  });

  // Grouper les messages par client
  const clientConversations = allMessages?.reduce((acc, msg) => {
    // Identifier le client (soit sender soit recipient)
    const clientUserId = msg.senderType === "client" ? msg.senderId : msg.recipientId;
    
    if (!acc[clientUserId]) {
      acc[clientUserId] = {
        clientUserId,
        messages: [],
        lastMessage: msg,
        unreadCount: 0,
      };
    }
    
    acc[clientUserId].messages.push(msg);
    
    // Compter les non lus (messages envoyés par le client)
    if (msg.senderType === "client" && !msg.isRead) {
      acc[clientUserId].unreadCount++;
    }
    
    // Garder le dernier message
    if (new Date(msg.createdAt) > new Date(acc[clientUserId].lastMessage.createdAt)) {
      acc[clientUserId].lastMessage = msg;
    }
    
    return acc;
  }, {} as Record<number, { clientUserId: number; messages: any[]; lastMessage: any; unreadCount: number }>);

  // Récupérer les infos des clients
  const { data: clients } = trpc.clients.list.useQuery();

  // Récupérer les clientUsers pour faire le lien
  const { data: clientUsers } = trpc.clients.list.useQuery(); // On utilisera clientId directement depuis les messages

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Messages</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Conversations avec vos clients
            </p>
          </div>
          {unreadData && unreadData.count > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {unreadData.count} non lu{unreadData.count > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des conversations */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!clientConversations || Object.keys(clientConversations).length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>Aucune conversation</p>
                </div>
              ) : (
                <div className="divide-y">
                  {Object.values(clientConversations)
                    .sort((a, b) => 
                      new Date(b.lastMessage.createdAt).getTime() - 
                      new Date(a.lastMessage.createdAt).getTime()
                    )
                    .map((conv) => {
                      // Récupérer le clientId depuis le message
                      const clientId = conv.lastMessage.clientId;
                      const client = clients?.find((c) => c.id === clientId);

                      if (!client) return null;

                      const isSelected = selectedClientUserId === conv.clientUserId;

                      return (
                        <Button
                          key={conv.clientUserId}
                          variant="ghost"
                          className={`w-full justify-start p-4 h-auto ${
                            isSelected ? "bg-muted" : ""
                          }`}
                          onClick={() => {
                            setSelectedClientUserId(conv.clientUserId);
                            setSelectedClientName(`${client.firstName} ${client.lastName}`);
                            setSelectedClientId(client.id);
                          }}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <User className="h-10 w-10 p-2 rounded-full bg-primary/10 text-primary flex-shrink-0" />
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium truncate">
                                  {client.firstName} {client.lastName}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage.content.substring(0, 50)}
                                {conv.lastMessage.content.length > 50 ? "..." : ""}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(conv.lastMessage.createdAt).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zone de chat */}
          <div className="lg:col-span-2">
            {selectedClientUserId ? (
              <ChatInterface
                clientUserId={selectedClientUserId}
                clientId={selectedClientId}
                clientName={selectedClientName}
                userType="admin"
              />
            ) : (
              <Card>
                <CardContent className="py-24 text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Sélectionnez une conversation pour commencer
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
