import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Globe, Heart, Loader2 } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email invalido"),
  subject: z.string().min(1, "Selecciona un asunto"),
  content: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contacto() {
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", content: "" },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al enviar mensaje");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mensaje enviado", description: "Nos pondremos en contacto contigo pronto." });
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo enviar el mensaje. Intenta de nuevo.", variant: "destructive" });
    },
  });

  function onSubmit(data: ContactForm) {
    sendMutation.mutate(data);
  }

  return (
    <Layout>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-medium mb-2">Contacto</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-contact-title">
              Conecta con Nosotros
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Queremos escucharte. Ya sea que desees unirte al ministerio, solicitar oracion o invitarnos a tu ciudad.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Sede Principal</h3>
                    <p className="text-sm text-muted-foreground">Austin, Texas, USA</p>
                    <p className="text-sm text-muted-foreground">Iglesia Casa del Alfarero</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Presencia Internacional</h3>
                    <p className="text-sm text-muted-foreground">Venezuela - Peru - USA</p>
                    <p className="text-sm text-muted-foreground">Expansion continua</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Cobertura Espiritual</h3>
                    <p className="text-sm text-muted-foreground">Pastores Carlo y Trinibeth Chevez</p>
                    <p className="text-sm text-muted-foreground">Mision Peru</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-2 p-6">
              <h2 className="font-bold text-lg mb-4">Envianos un Mensaje</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="tu@email.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asunto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subject">
                              <SelectValue placeholder="Selecciona un asunto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unirse">Quiero unirme al ministerio</SelectItem>
                            <SelectItem value="oracion">Solicitud de oracion</SelectItem>
                            <SelectItem value="invitar">Invitar a mi ciudad/iglesia</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe tu mensaje aqui..."
                            className="resize-none min-h-[120px]"
                            {...field}
                            data-testid="textarea-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Enviar Mensaje
                  </Button>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
