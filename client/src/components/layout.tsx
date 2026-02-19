import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LogOut,
  User,
  Users,
  Shield,
  Flame,
  Menu,
  X,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Library,
  Bell,
  Heart,
  Globe,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ROLES } from "@shared/schema";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/historia", label: "Historia" },
  { href: "/equipo", label: "Equipo" },
  { href: "/eventos", label: "Eventos" },
  { href: "/capacitaciones", label: "Capacitaciones" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/oracion", label: "Oracion" },
  { href: "/regiones", label: "Regiones" },
  { href: "/iglesias", label: "Iglesias" },
  { href: "/en-vivo", label: "En Vivo" },
  { href: "/contacto", label: "Contacto" },
];

type Notification = {
  id: number;
  type: string;
  title: string;
  content: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function NotificationBell() {
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = countData?.count || 0;
  const recentNotifs = notifications.slice(0, 8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center" data-testid="badge-unread-count">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between gap-2 p-3 border-b">
          <p className="font-semibold text-sm">Notificaciones</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} data-testid="button-mark-all-read">
              Marcar leidas
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {recentNotifs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin notificaciones</p>
          ) : (
            recentNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b last:border-0 text-sm ${!n.isRead ? "bg-primary/5" : ""}`}
                data-testid={`notification-${n.id}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{n.content}</p>
                <p className="text-muted-foreground text-[10px] mt-1">
                  {new Date(n.createdAt).toLocaleDateString("es", { day: "numeric", month: "short" })}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLabel = user ? (ROLES[user.role as keyof typeof ROLES] || user.role) : "";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
          <Flame className="w-7 h-7 text-primary" />
          <span className="font-bold text-lg hidden sm:inline">Avivando el Fuego</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              <Button
                variant={location === l.href || (l.href !== "/" && location.startsWith(l.href)) ? "secondary" : "ghost"}
                size="sm"
                data-testid={`link-nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {l.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.displayName || user.username}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/perfil?tab=amigos" className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    Amigos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mis-capacitaciones" className="cursor-pointer">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Mis Capacitaciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/comunidad" className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comunidad
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mensajes" className="cursor-pointer">
                    <Mail className="mr-2 h-4 w-4" />
                    Mensajes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/biblioteca" className="cursor-pointer">
                    <Library className="mr-2 h-4 w-4" />
                    Biblioteca
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/oracion" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    Oracion
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/regiones" className="cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    Regiones
                  </Link>
                </DropdownMenuItem>
                {(user.role === "obrero" || user.role === "admin") && (
                  <DropdownMenuItem asChild>
                    <Link href="/maestro" className="cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Panel Maestro
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Panel Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="link-login">
                  Iniciar Sesion
                </Button>
              </Link>
              <Link href="/registro">
                <Button size="sm" data-testid="link-register">
                  <Flame className="w-4 h-4 mr-1" />
                  Unirse
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-background px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              <Button
                variant={location === l.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
              >
                {l.label}
              </Button>
            </Link>
          ))}
          <div className="border-t my-2" />
          {user ? (
            <>
              <Link href="/mis-capacitaciones" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-mis-capacitaciones">
                  <GraduationCap className="w-4 h-4 mr-1" /> Mis Capacitaciones
                </Button>
              </Link>
              {(user.role === "obrero" || user.role === "admin") && (
                <Link href="/maestro" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-maestro">
                    <BookOpen className="w-4 h-4 mr-1" /> Panel Maestro
                  </Button>
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start" size="sm" data-testid="link-mobile-admin">
                    <Shield className="w-4 h-4 mr-1" /> Panel Admin
                  </Button>
                </Link>
              )}
              <Link href="/comunidad" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-comunidad">
                  <MessageSquare className="w-4 h-4 mr-1" /> Comunidad
                </Button>
              </Link>
              <Link href="/mensajes" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-mensajes">
                  <Mail className="w-4 h-4 mr-1" /> Mensajes
                </Button>
              </Link>
              <Link href="/biblioteca" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-biblioteca">
                  <Library className="w-4 h-4 mr-1" /> Biblioteca
                </Button>
              </Link>
              <Link href="/oracion" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-oracion">
                  <Heart className="w-4 h-4 mr-1" /> Oracion
                </Button>
              </Link>
              <Link href="/regiones" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-regiones">
                  <Globe className="w-4 h-4 mr-1" /> Regiones
                </Button>
              </Link>
              <Link href="/perfil" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-perfil">
                  <User className="w-4 h-4 mr-1" /> Mi Perfil
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
                onClick={() => { logout(); setMenuOpen(false); }}
                data-testid="button-mobile-logout"
              >
                <LogOut className="w-4 h-4 mr-1" /> Cerrar Sesion
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="link-mobile-login">
                  Iniciar Sesion
                </Button>
              </Link>
              <Link href="/registro" onClick={() => setMenuOpen(false)}>
                <Button className="w-full" size="sm" data-testid="link-mobile-register">Unirse al Ministerio</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Avivando el Fuego</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ministerio evangelistico internacional. Desde 2017, Ciudad Bolivar, Venezuela.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Sede Principal</h4>
            <p className="text-sm text-muted-foreground">Austin, Texas, USA</p>
            <p className="text-sm text-muted-foreground">Iglesia Casa del Alfarero</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cobertura: Pastores Carlo y Trinibeth Chevez
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Presencia Internacional</h4>
            <p className="text-sm text-muted-foreground">Venezuela - Peru - USA</p>
            <p className="text-sm text-muted-foreground mt-2 italic">
              "No apagueis el Espiritu" - 1 Tesalonicenses 5:19
            </p>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Avivando el Fuego - Ministerio Evangelistico Internacional
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
