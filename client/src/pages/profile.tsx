import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema, MINISTRY_COUNTRIES, ROLES } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const updateMutation = useUpdateUser();
  const formInitialized = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { displayName: "", bio: "", country: "", phone: "", email: "" },
  });

  useEffect(() => {
    if (user && !formInitialized.current) {
      formInitialized.current = true;
      form.reset({
        displayName: user.displayName || "",
        bio: user.bio || "",
        country: user.country || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    } else if (!isLoading && !user) {
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

  function onSubmit(data: z.infer<typeof updateUserSchema>) {
    if (user) {
      updateMutation.mutate({ id: user.id, updates: data });
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Solo se permiten imagenes.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen no debe superar 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir imagen");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Foto actualizada", description: "Tu foto de perfil ha sido actualizada." });
    } catch {
      toast({ title: "Error", description: "No se pudo subir la imagen.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-profile-title">Mi Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="h-fit">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 relative group">
                <Avatar className="h-24 w-24">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="button-change-avatar"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  data-testid="input-avatar-file"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-2">Haz clic en la foto para cambiarla</p>
              <CardTitle data-testid="text-profile-name">{user.displayName || user.username}</CardTitle>
              <CardDescription>@{user.username}</CardDescription>
              {user.country && (
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-profile-country">{user.country}</p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {ROLES[user.role as keyof typeof ROLES] || user.role}
                </Badge>
                <Badge variant={user.isActive ? "outline" : "destructive"}>
                  {user.isActive ? "Aprobado" : "Pre-aprobado"}
                </Badge>
              </div>
              {(user.email || user.phone) && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  {user.email && <p data-testid="text-profile-email">{user.email}</p>}
                  {user.phone && <p data-testid="text-profile-phone">{user.phone}</p>}
                </div>
              )}
            </CardHeader>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informacion Personal</CardTitle>
              <CardDescription>Actualiza los datos de tu perfil.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre para Mostrar</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tu nombre completo"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-display-name"
                          />
                        </FormControl>
                        <FormDescription>Este nombre se mostrara en tu perfil.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biografia</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cuentanos sobre ti y tu llamado..."
                            className="resize-none min-h-[120px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-bio"
                          />
                        </FormControl>
                        <FormDescription>Breve descripcion para tu perfil.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pais</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-profile-country">
                              <SelectValue placeholder="Selecciona tu pais" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MINISTRY_COUNTRIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Tu pais se mostrara en tu perfil.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electronico</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@correo.com" {...field} value={field.value || ""} data-testid="input-profile-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 234 567 8900" {...field} value={field.value || ""} data-testid="input-profile-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-profile">
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
