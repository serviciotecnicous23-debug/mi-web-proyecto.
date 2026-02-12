import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMemberPosts, useCreateMemberPost, useDeleteMemberPost } from "@/hooks/use-users";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Flame, Trash2, MessageSquare } from "lucide-react";

export default function Comunidad() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: posts, isLoading: isLoadingPosts } = useMemberPosts();
  const createPost = useCreateMemberPost();
  const deletePost = useDeleteMemberPost();
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    createPost.mutate(newMessage.trim(), {
      onSuccess: () => setNewMessage(""),
    });
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-community-title">
            <MessageSquare className="h-8 w-8 text-primary" />
            Comunidad
          </h1>
          <p className="text-muted-foreground mt-1">
            Comparte mensajes, testimonios y palabras de aliento con los demas miembros del ministerio.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 mt-1">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Comparte un mensaje, testimonio o palabra de aliento..."
                    className="resize-none min-h-[100px]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    data-testid="textarea-new-post"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={createPost.isPending || !newMessage.trim()} data-testid="button-publish-post">
                  {createPost.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Publicar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoadingPosts ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !posts?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">Sin publicaciones aun</h3>
              <p className="text-muted-foreground">Se el primero en compartir un mensaje con la comunidad.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Card key={post.id} data-testid={`card-community-post-${post.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {post.user?.avatarUrl && <AvatarImage src={post.user.avatarUrl} alt={post.user.displayName || post.user.username} />}
                      <AvatarFallback className="bg-primary/5 text-primary text-sm">
                        {(post.user?.displayName || post.user?.username || '??').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">
                          {post.user?.displayName || post.user?.username || 'Usuario'}
                        </span>
                        {post.user?.cargo && <Badge variant="outline" className="text-[10px] py-0">{post.user.cargo}</Badge>}
                        {post.user?.country && <span className="text-[10px] text-muted-foreground">{post.user.country}</span>}
                        <span className="text-xs text-muted-foreground">
                          @{post.user?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {post.createdAt ? new Date(post.createdAt).toLocaleString('es-ES') : ''}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
                        {post.content}
                      </p>
                    </div>
                    {user.role === "admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePost.mutate(post.id)}
                        data-testid={`button-delete-community-post-${post.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
