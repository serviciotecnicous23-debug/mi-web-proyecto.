import { Switch, Route } from 'wouter'
import { queryClient } from './lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/toaster'
import { TooltipProvider } from './components/ui/tooltip'
import NotFound from './pages/not-found'
import Home from './pages/home'
import Historia from './pages/historia'
import Equipo from './pages/equipo'
import EnVivo from './pages/en-vivo'
import Contacto from './pages/contacto'
import Eventos from './pages/eventos'
import { LoginPage, RegisterPage } from './pages/auth'
import Profile from './pages/profile'
import AdminDashboard from './pages/admin'
import Comunidad from './pages/comunidad'
import Capacitaciones from './pages/capacitaciones'
import CursoDetalle from './pages/curso-detalle'
import MisCapacitaciones from './pages/mis-capacitaciones'
import MaestroPanel from './pages/maestro'
import AulaVirtual from './pages/aula'
import BibliotecaPage from './pages/biblioteca'
import OracionPage from './pages/oracion'
import RegionesPage from './pages/regiones'
import JuegoPage from './pages/juego'

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/historia" component={Historia} />
      <Route path="/equipo" component={Equipo} />
      <Route path="/en-vivo" component={EnVivo} />
      <Route path="/eventos" component={Eventos} />
      <Route path="/capacitaciones" component={Capacitaciones} />
      <Route path="/capacitaciones/:id" component={CursoDetalle} />
      <Route path="/aula/:id" component={AulaVirtual} />
      <Route path="/contacto" component={Contacto} />
      <Route path="/login" component={LoginPage} />
      <Route path="/registro" component={RegisterPage} />
      <Route path="/perfil" component={Profile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/comunidad" component={Comunidad} />
      <Route path="/mis-capacitaciones" component={MisCapacitaciones} />
      <Route path="/maestro" component={MaestroPanel} />
      <Route path="/biblioteca" component={BibliotecaPage} />
      <Route path="/oracion" component={OracionPage} />
      <Route path="/regiones" component={RegionesPage} />
      <Route path="/juego" component={JuegoPage} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
