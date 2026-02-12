import express from 'express'
import cors from 'cors'

interface TeamMember {
  id: number
  name: string
  role: string
  description?: string
  verse?: string
  initials?: string
}

interface ContactMessage {
  name: string
  email: string
  subject: 'unirse' | 'oracion' | 'invitar' | 'otro'
  content: string
}

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 3000

// In-memory storage
let teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Pastor Principal',
    role: 'Lider del Ministerio',
    description: 'Fundador y visionario del ministerio Avivando el Fuego',
    verse: 'Yo soy la luz del mundo - Juan 8:12',
    initials: 'PP',
  },
  {
    id: 2,
    name: 'Pastora Asociada',
    role: 'Directora de Alcance',
    description: 'Coordinadora de actividades nacionales e internacionales',
    verse: 'Vayan y hagan discipulos - Mateo 28:19',
    initials: 'PA',
  },
]
let nextTeamMemberId = 3
const contactMessages: ContactMessage[] = []

app.use(cors())
app.use(express.json())

app.get('/api/hello', (_req, res) => {
  res.json({ message: '¡Hola desde el servidor!' })
})

app.post('/api/message', (req, res) => {
  const { text } = req.body || {}
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" is required' })
  }

  const response = {
    received: text,
    echo: `Servidor recibió: ${text}`,
    timestamp: new Date().toISOString()
  }

  res.json(response)
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Team Members Endpoints
app.get('/api/team-members', (_req, res) => {
  res.json(teamMembers)
})

app.post('/api/team-members', (req, res) => {
  const { name, role, description, verse, initials } = req.body

  if (!name || !role) {
    return res.status(400).json({ error: 'name and role are required' })
  }

  const newMember: TeamMember = {
    id: nextTeamMemberId++,
    name,
    role,
    description,
    verse,
    initials,
  }

  teamMembers.push(newMember)
  res.status(201).json(newMember)
})

app.patch('/api/team-members/:id', (req, res) => {
  const id = Number(req.params.id)
  const { name, role, description, verse, initials } = req.body

  const member = teamMembers.find((m) => m.id === id)
  if (!member) {
    return res.status(404).json({ error: 'Team member not found' })
  }

  if (name) member.name = name
  if (role) member.role = role
  if (typeof description !== 'undefined') member.description = description
  if (typeof verse !== 'undefined') member.verse = verse
  if (typeof initials !== 'undefined') member.initials = initials

  res.json(member)
})

app.delete('/api/team-members/:id', (req, res) => {
  const id = Number(req.params.id)
  const index = teamMembers.findIndex((m) => m.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Team member not found' })
  }

  const deleted = teamMembers.splice(index, 1)[0]
  res.json(deleted)
})

// Contact Form Endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, subject, content } = req.body

  if (!name || !email || !subject || !content) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const message: ContactMessage = {
    name,
    email,
    subject,
    content,
  }

  contactMessages.push(message)
  console.log('New contact message:', message)

  res.status(201).json({
    success: true,
    message: 'Mensaje recibido correctamente. Nos pondremos en contacto pronto.',
  })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})
