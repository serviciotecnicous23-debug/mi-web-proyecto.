import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Layout } from '../components/Header'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { apiRequest } from '../lib/queryClient'
import { useToast } from '../hooks/use-toast'
import { MapPin, Mail, Loader2, MessageCircle } from 'lucide-react'

const contactSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'Ingresa un email valido' }),
  subject: z.enum(['unirse', 'oracion', 'invitar', 'otro'], {
    errorMap: () => ({ message: 'Selecciona un asunto valido' }),
  }),
  content: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres' }),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function Contacto() {
  const { toast } = useToast()
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: 'otro',
      content: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await apiRequest('POST', '/api/contact', data)
    },
    onSuccess: () => {
      toast({
        title: 'Mensaje enviado exitosamente',
        description: 'Nos pondremos en contacto pronto.',
      })
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al enviar mensaje',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  function onSubmit(data: ContactFormData) {
    mutation.mutate(data)
  }

  return (
    <Layout>
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-medium mb-2">Ponte en Contacto</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Hablemos Aun que sea de lejos
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Eres parte de nuestro ministerio, tengas dudas, sugerencias o quieras compartir tu testimonio, estamos aqu para escucharte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card className="p-6 text-center flex flex-col items-center">
              <MapPin className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Sede Principal</h3>
              <p className="text-sm text-muted-foreground">
                Austin, Texas
                <br />
                USA
              </p>
            </Card>

            <Card className="p-6 text-center flex flex-col items-center">
              <MessageCircle className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Alcance Internacional</h3>
              <p className="text-sm text-muted-foreground">
                Presente en 3 paises
                <br />
                Trabajando por el mundo
              </p>
            </Card>

            <Card className="p-6 text-center flex flex-col items-center">
              <Mail className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Cobertura Espiritual</h3>
              <p className="text-sm text-muted-foreground">
                Orando todos los dias
                <br />
                Por nuestros hermanos
              </p>
            </Card>
          </div>

          <Card className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre completo" {...field} />
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
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unirse">Quiero Unirme</SelectItem>
                          <SelectItem value="oracion">Solicitud de Oracion</SelectItem>
                          <SelectItem value="invitar">Quiero Invitar</SelectItem>
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
                          placeholder="Escriba tu mensaje aqui..."
                          className="resize-none h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mutation.isPending ? 'Enviando...' : 'Enviar Mensaje'}
                </Button>
              </form>
            </Form>
          </Card>
        </div>
      </section>
    </Layout>
  )
}
