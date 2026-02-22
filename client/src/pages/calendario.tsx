import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, BookOpen, Heart, PartyPopper } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_ICONS: Record<string, any> = {
  evento: PartyPopper,
  sesion: BookOpen,
  oracion: Heart,
};

const TYPE_COLORS: Record<string, string> = {
  evento: "bg-blue-500",
  sesion: "bg-green-500",
  oracion: "bg-purple-500",
};

const TYPE_LABELS: Record<string, string> = {
  evento: "Evento",
  sesion: "Sesión de Curso",
  oracion: "Oración",
};

export default function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState("all");

  const { data: calendarItems = [] } = useQuery<any[]>({
    queryKey: ["/api/calendar/events"],
  });

  const filteredItems = useMemo(() => {
    let items = calendarItems;
    if (filterType !== "all") items = items.filter(i => i.type === filterType);
    return items;
  }, [calendarItems, filterType]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fill leading empty days (to start week on Monday)
  const startDayOfWeek = monthStart.getDay(); // 0=Sun
  const leadingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const getEventsForDay = (date: Date) => {
    return filteredItems.filter(item => {
      const itemDate = item.date ? new Date(item.date) : null;
      return itemDate && isSameDay(itemDate, date);
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Upcoming events (next 7 days from today)
  const upcoming = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return filteredItems.filter(item => {
      const d = item.date ? new Date(item.date) : null;
      return d && d >= now && d <= weekFromNow;
    }).slice(0, 10);
  }, [filteredItems]);

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-orange-600 flex items-center gap-2"><CalendarIcon className="h-8 w-8" /> Calendario Unificado</h1>
            <p className="text-muted-foreground">Todos los eventos del ministerio en un solo lugar</p>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="evento">Eventos</SelectItem>
              <SelectItem value="sesion">Sesiones de Curso</SelectItem>
              <SelectItem value="oracion">Oración</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <CardTitle className="text-lg">{format(currentMonth, "MMMM yyyy", { locale: es })}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                  ))}
                  {Array.from({ length: leadingDays }).map((_, i) => <div key={`empty-${i}`} />)}
                  {days.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`relative p-2 text-center rounded-lg transition-colors min-h-[60px] ${isToday ? "bg-orange-100 dark:bg-orange-900/30 font-bold" : ""} ${isSelected ? "ring-2 ring-orange-500" : ""} ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/50" : ""} hover:bg-muted`}
                      >
                        <span className="text-sm">{format(day, "d")}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 justify-center mt-1 flex-wrap">
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[e.type] || "bg-gray-400"}`} />
                            ))}
                            {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-4 justify-center text-xs">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[k]}`} />
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Day Events */}
            {selectedDate && (
              <Card>
                <CardHeader><CardTitle className="text-base">{format(selectedDate, "EEEE dd MMMM", { locale: es })}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {selectedDayEvents.length === 0 && <p className="text-sm text-muted-foreground">No hay actividades este día</p>}
                  {selectedDayEvents.map((e, i) => {
                    const Icon = TYPE_ICONS[e.type] || CalendarIcon;
                    return (
                      <a key={i} href={e.link || "#"} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                        <Icon className="h-4 w-4 mt-0.5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">{e.title}</p>
                          <div className="flex gap-1 items-center">
                            <Badge variant="secondary" className="text-[10px]">{TYPE_LABELS[e.type]}</Badge>
                            {e.date && <span className="text-[10px] text-muted-foreground">{format(new Date(e.date), "HH:mm")}</span>}
                          </div>
                          {e.location && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                        </div>
                      </a>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Upcoming */}
            <Card>
              <CardHeader><CardTitle className="text-base">Próximos 7 días</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No hay actividades próximas</p>}
                {upcoming.map((e, i) => {
                  const Icon = TYPE_ICONS[e.type] || CalendarIcon;
                  return (
                    <a key={i} href={e.link || "#"} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                      <Icon className="h-4 w-4 mt-0.5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{e.title}</p>
                        <span className="text-[10px] text-muted-foreground">{e.date ? format(new Date(e.date), "EEE dd MMM, HH:mm", { locale: es }) : ""}</span>
                        <Badge variant="secondary" className="text-[10px] ml-1">{TYPE_LABELS[e.type]}</Badge>
                      </div>
                    </a>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
