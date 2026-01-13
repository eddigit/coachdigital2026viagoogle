import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Send, Paperclip, User } from "lucide-react";
import { toast } from "sonner";

interface ChatInterfaceProps {
  clientUserId: number;
  clientId: number;
  clientName: string;
  userType: "admin" | "client";
}

export default function ChatInterface({
  clientUserId,
  clientId,
  clientName,
  userType,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Charger la conversation
  const { data: conversation, isLoading } = trpc.messages.getConversation.useQuery(
    { clientUserId },
    {
      refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
    }
  );

  // Mutation pour envoyer un message
  const sendMessage = trpc.messages[
    userType === "admin" ? "sendFromAdmin" : "sendFromClient"
  ].useMutation({
    onSuccess: () => {
      setMessage("");
      utils.messages.getConversation.invalidate({ clientUserId });
      toast.success("Message envoyé");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Marquer comme lu
  const markAsRead = trpc.messages.markConversationAsRead.useMutation();

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Marquer les messages comme lus au chargement
  useEffect(() => {
    if (conversation && conversation.length > 0) {
      markAsRead.mutate({
        clientUserId,
        userType,
      });
    }
  }, [conversation?.length]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    sendMessage.mutate({
      clientUserId,
      clientId,
      content: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Conversation avec {userType === "admin" ? clientName : "Coach Digital"}
          </CardTitle>
          <Badge variant="outline">
            {conversation?.length || 0} message{(conversation?.length || 0) > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      {/* Zone de messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {!conversation || conversation.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun message pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Commencez la conversation en envoyant un message
            </p>
          </div>
        ) : (
          <>
            {conversation.map((msg) => {
              const isOwnMessage =
                (userType === "admin" && msg.senderType === "admin") ||
                (userType === "client" && msg.senderType === "client");

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.subject && (
                      <p className="font-semibold text-sm mb-1">{msg.subject}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.attachmentUrl && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline flex items-center gap-1"
                        >
                          <Paperclip className="h-3 w-3" />
                          {msg.attachmentName || "Pièce jointe"}
                        </a>
                      </div>
                    )}
                    <p
                      className={`text-xs mt-2 ${
                        isOwnMessage ? "opacity-80" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Zone de saisie */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez votre message... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
            className="min-h-[80px] resize-none"
            disabled={sendMessage.isPending}
          />
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={sendMessage.isPending || !message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
