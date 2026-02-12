import { useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient, apiRequest } from '../lib/queryClient'
import type { TeamMember } from '../types/schema'
import { Layout } from '../components/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Link } from 'wouter'
import { Settings, Pencil, Trash2, Plus, Loader2, Save, Users } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

const emptyForm = { name: '', role: '', description: '', verse: '', initials: '' }

export default function Equipo() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === 'admin'

  const [managementMode, setManagementMode] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      await apiRequest('POST', '/api/team-members', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] })
      setDialogOpen(false)
      setForm(emptyForm)
      toast({ title: 'Miembro agregado exitosamente' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error al agregar miembro', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof emptyForm }) => {
      await apiRequest('PATCH', `/api/team-members/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] })
      setDialogOpen(false)
      setEditingMember(null)
      setForm(emptyForm)
      toast({ title: 'Miembro actualizado exitosamente' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error al actualizar miembro', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/team-members/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] })
      setDeleteConfirmId(null)
      toast({ title: 'Miembro eliminado exitosamente' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error al eliminar miembro', description: error.message, variant: 'destructive' })
    },
  })

  function openAddDialog() {
    setEditingMember(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(member: TeamMember) {
    setEditingMember(member)
    setForm({
      name: member.name,
      role: member.role,
      description: member.description || '',
      verse: member.verse || '',
      initials: member.initials || '',
    })
    setDialogOpen(true)
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.role.trim()) return
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Layout>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-medium mb-2">Nuestro Equipo</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Lideres con Vision y Pasion
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Un equipo unido por el mismo llamado: encender el fuego del avivamiento en cada rincon del mundo.
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <Button
                variant={managementMode ? 'default' : 'outline'}
                onClick={() => setManagementMode(!managementMode)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Gestionar Equipo
              </Button>
              {managementMode && (
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Miembro
                </Button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !teamMembers || teamMembers.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay miembros del equipo</h3>
              <p className="text-muted-foreground">
                {isAdmin
                  ? 'Activa el modo de gestion para agregar miembros al equipo.'
                  : 'El equipo se esta conformando. Vuelve pronto.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamMembers.map((member) => (
                <Card key={member.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {member.initials || member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-sm text-primary font-medium">{member.role}</p>
                        </div>
                        {managementMode && isAdmin && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(member)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {member.description && (
                        <p className="text-sm text-muted-foreground mt-2">{member.description}</p>
                      )}
                      {member.verse && (
                        <p className="text-xs text-muted-foreground mt-2 italic">"{member.verse}"</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-12 p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Sientes el llamado?</h2>
            <p className="text-muted-foreground mb-6">
              Estamos buscando obreros apasionados que quieran unirse a esta vision de llevar el fuego del evangelio a las naciones.
            </p>
            <Link href="/registro">
              <Button>Ser Parte del Equipo</Button>
            </Link>
          </Card>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Editar Miembro' : 'Agregar Miembro'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Nombre</Label>
              <Input
                id="member-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Rol</Label>
              <Input
                id="member-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Ej: Director del Ministerio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-description">Descripcion</Label>
              <Textarea
                id="member-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripcion del miembro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-verse">Versiculo</Label>
              <Input
                id="member-verse"
                value={form.verse}
                onChange={(e) => setForm({ ...form, verse: e.target.value })}
                placeholder="Ej: 1 Timoteo 4:12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-initials">Iniciales</Label>
              <Input
                id="member-initials"
                value={form.initials}
                onChange={(e) => setForm({ ...form, initials: e.target.value })}
                placeholder="Ej: LR"
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim() || !form.role.trim()}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingMember ? 'Guardar Cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminacion</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-4">
            Esta seguro de que desea eliminar este miembro del equipo? Esta accion no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
