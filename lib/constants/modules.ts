import { Zap, Brain, Briefcase, Heart, Wallet, Home, type LucideIcon } from 'lucide-react'

export type ModuleId = 'body' | 'mind' | 'work' | 'relate' | 'wealth' | 'space'

export interface ModuleDef {
  id: ModuleId
  label: string
  icon: LucideIcon
  defaultRitual: string
  description: string
}

export const MODULES: ModuleDef[] = [
  { id: 'body', label: 'Body', icon: Zap, defaultRitual: 'Movimiento diario', description: 'Gym, sueño, nutrición, salud' },
  { id: 'mind', label: 'Mind', icon: Brain, defaultRitual: 'Lectura nocturna', description: 'Lectura, aprendizaje, reflexión' },
  { id: 'work', label: 'Work', icon: Briefcase, defaultRitual: 'Deep Work', description: 'Proyectos, carrera, ingresos, skills' },
  { id: 'relate', label: 'Relate', icon: Heart, defaultRitual: 'Conexión diaria', description: 'Familia, pareja, amigos, comunidad' },
  { id: 'wealth', label: 'Wealth', icon: Wallet, defaultRitual: 'Revisión semanal', description: 'Gastos, inversiones, ahorros' },
  { id: 'space', label: 'Space', icon: Home, defaultRitual: 'Orden', description: 'Hogar, organización, entorno' },
]

export const MODULE_MAP: Record<ModuleId, ModuleDef> = Object.fromEntries(
  MODULES.map((m) => [m.id, m])
) as Record<ModuleId, ModuleDef>
