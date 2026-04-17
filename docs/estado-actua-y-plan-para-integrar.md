# FIJA — Resumen detallado del estado actual del frontend

## 1. Objetivo del producto

FIJA es una app móvil educativa gamificada para postulantes preuniversitarios de Cusco, enfocada en la preparación para el examen de admisión de la UNSAAC 2026.

La experiencia visual está pensada como un producto:

- oscuro,
- futurista,
- minimalista,
- con glassmorphism,
- y detalles neon de alta tecnología.

El objetivo funcional es que el estudiante:

1. se registre o se identifique,
2. elija su grupo académico,
3. vea su ruta de aprendizaje,
4. resuelva lecciones,
5. reciba feedback inmediato,
6. consulte ranking,
7. y vea su perfil/progreso.

---

## 2. Stack actual del frontend

El proyecto está construido sobre:

- **Expo 54**
- **React Native 0.81**
- **React 19**
- **React Navigation**
- **Zustand**
- **AsyncStorage**
- **Zod**
- **React Native Reanimated**
- **react-native-svg**
- **lucide-react-native**
- **nativewind**
- **Safe Area Context**

También incluye soporte para experiencia visual avanzada:

- `@react-three/fiber`
- `@react-three/drei`
- `three`
- `expo-gl`

### Lectura técnica

Esto significa que la base actual ya permite:

- navegación tipada,
- persistencia local,
- animación fluida,
- validación de datos,
- UI visualmente rica,
- y potencial integración 3D ligera.

---

## 3. Arquitectura general actual

La app ya está separada por dominios funcionales:

- `features/onboarding`
- `features/content`
- `features/challenge`
- `features/explanation-ia`
- `features/ranking`
- `features/profile`

Además hay módulos compartidos:

- `components/ui`
- `components/icons`
- `hooks`
- `navigation`
- `data`
- `types`

### Lectura de ingeniería

La organización es buena para escalar porque separa:

- UI por feature,
- lógica de navegación,
- estado local,
- y contratos de tipos.

---

## 4. Navegación actual

### Archivos clave

- `navigation/types.ts`
- `navigation/app-navigator.tsx`
- `hooks/use-app-navigation.ts`
- `navigation/index.tsx`
- `App.tsx`

### Rutas definidas

En `navigation/types.ts` están registradas:

- `Onboarding`
- `Home`
- `Lesson`
- `Insight`
- `Ranking`
- `Profile`

### Comportamiento del navigator

En `navigation/app-navigator.tsx`:

- si `groupId` no existe, muestra `Onboarding`
- si `groupId` existe, muestra el stack principal

### Stack actual

- `Home`
- `Lesson`
- `Insight`
- `Ranking`
- `Profile`

### Observación

La navegación ya está lista para un backend, pero hoy depende de:

- estado local persistido,
- y algunos valores hardcodeados.

---

## 5. Estado global y persistencia local

### Archivo principal

- `features/onboarding/stores/use-app-store.ts`

### Qué guarda

El store persistido contiene:

- `formData`
- `groupId`
- `username`
- `birthDate`
- `points`
- `completedLessons`
- `streak`

### Qué hace bien

- Usa `zustand`
- Persiste con `AsyncStorage`
- Tiene validación con `Zod`
- Conserva el onboarding aunque la app se cierre

### Lectura técnica

Hoy el store funciona como:

- caché local,
- estado de UI,
- y persistencia del progreso básico.

Pero todavía **no es source of truth** del backend.

---

## 6. Onboarding actual

### Archivos

- `features/onboarding/screens/onboarding-screen.tsx`
- `features/onboarding/layouts/onboarding-layout.tsx`
- `features/onboarding/components/welcome-step.tsx`
- `features/onboarding/components/user-data-step.tsx`
- `features/onboarding/components/group-selection-step.tsx`

### Flujo

El onboarding tiene 3 pasos:

1. **WelcomeStep**
2. **UserDataStep**
3. **GroupSelectionStep**

### Qué hace hoy

- muestra un layout visual consistente,
- usa animaciones,
- pide nombre y fecha de nacimiento,
- permite elegir grupo A/B/C/D,
- guarda parte de la información en Zustand.

### Qué ocurre al finalizar

En `OnboardingFlow`, al terminar el flujo, se navega actualmente a:

- `Lesson` con datos hardcodeados

### Observación crítica

Hoy el onboarding **no termina en Home**, sino en una lección fija:

- `lessonId: '123'`
- `lessonTitle: 'Bohr'`

Eso indica que todavía falta conectar el flujo real con backend y con la pantalla principal.

---

## 7. Pantalla Home / Roadmap

### Archivos

- `features/content/screens/screen-content.tsx`
- `features/content/hooks/use-roadmap-data.ts`
- `data/mockRoadmap.ts`
- `features/content/components/RoadmapHeader.tsx`
- `features/content/components/RoadmapNode.tsx`
- `features/content/components/RoadmapDock.tsx`
- `features/content/components/NodeStatusIcon.tsx`
- `components/ui/BackgroundDecor.tsx`

### Qué representa

Esta pantalla es el “mapa de aprendizaje” de la app.  
Visualmente funciona como una ruta vertical con:

- nodos completados,
- nodo actual,
- nodos bloqueados,
- checkpoints,
- y dock inferior.

### Datos actuales

`data/mockRoadmap.ts` contiene la información simulada por grupo:

- `a` → Ingenierías
- `b` → Medicina / Salud
- `c` → Derecho / Sociales
- `d` → Educación / Humanidades

Cada grupo incluye:

- `label`
- `career`
- `streak`
- `coins`
- `nodes[]`

### Tipos de nodos

- `completed`
- `current`
- `locked`
- `checkpoint`

---

## 8. Hook de roadmap actual

### Archivo

- `features/content/hooks/use-roadmap-data.ts`

### Qué hace

- lee el `groupId` desde el store
- usa fallback a `'a'`
- devuelve el roadmap del grupo desde `MOCK_ROADMAP_BY_GROUP`

### Lectura técnica

Este hook ya está perfectamente alineado para ser reemplazado luego por:

- request remoto,
- cache local,
- loading state,
- error state,
- y fallback offline.

---

## 9. ScreenContent actual

### Archivo

- `features/content/screens/screen-content.tsx`

### Estructura de la pantalla

Renderiza:

- fondo oscuro,
- decoraciones ambientales,
- header del roadmap,
- lista vertical de nodos,
- dock inferior.

### Conexión actual

- consume `useRoadmapData`
- usa `groupRoadmap.nodes`
- cada nodo navega a `Lesson`

### Observación

Aquí todavía hay hardcodes visibles:

- `groupLetter={'A'}`
- `hearts={17}`
- `xp={212}`

Mientras tanto, el roadmap sí aporta:

- `streak`
- `coins`

### Conclusión

La pantalla Home ya está montada visualmente y estructuralmente, pero aún necesita un contrato real con backend para:

- grupo real,
- recursos reales,
- progreso real,
- y estados reales por nodo.

---

## 10. Componentes visuales del roadmap

### 10.1 `RoadmapHeader`
Muestra:

- grupo
- XP
- hearts
- streak

Tiene estilo glassmorphism oscuro y una estructura clara de HUD.

### 10.2 `RoadmapNodeItem`
Renderiza cada nodo y distingue:

- `completed`
- `current`
- `locked`
- `checkpoint`

Usa:

- `PulsingNode`
- `NodeStatusIcon`

### 10.3 `RoadmapDock`
Dock flotante con navegación a:

- Aprender
- Ranking
- Perfil

### 10.4 `NodeStatusIcon`
Usa visualizaciones 3D o íconos especializados para:

- completado
- actual
- checkpoint
- bloqueado

### 10.5 `BackgroundDecor`
Agrega decoraciones suaves al fondo para reforzar la estética futurista.

---

## 11. Pantalla de reto / lección

### Archivo

- `features/challenge/screens/challenge-screen.tsx`

### Qué hace hoy

Tiene la estructura principal del modo reto:

- barra de progreso
- timer
- pregunta
- opciones
- selección de respuesta
- feedback correcto/incorrecto
- acceso a explicación IA

### Estado actual

Todo el contenido principal está aún hardcodeado:

- pregunta
- opciones
- respuesta correcta
- tiempo total

### Qué sí está bien diseñado

- selección de opción
- bloqueo después de responder
- feedback visual diferenciado
- navegación a `Insight`
- manejo de timeout

### Observación importante

Hay una discrepancia entre la intención visual y el código actual:

- el código define `correctOption = "a"`
- el ejemplo de la experiencia sugiere que la correcta debería ser otra opción según el contenido

Esto será importante al conectar preguntas reales desde backend.

---

## 12. Pantalla de explicación IA

### Archivo

- `features/explanation-ia/screens/explanation-ia-screen.tsx`

### Qué hace

Muestra una pantalla de explicación con:

- header de error,
- indicador IA animado,
- resumen del problema,
- pasos de resolución,
- campo “Chat with IA”,
- botón de “Siguiente Pregunta”.

### Estado actual

La explicación está construida con texto fijo.  
No está conectada a una respuesta IA real.

### Qué está listo para backend

La UI ya espera naturalmente un objeto del tipo:

- `attemptId`
- `questionId`
- `wrongOptionId`
- `steps[]`

### Conclusión

La pantalla ya está visualmente lista.  
Lo que falta es un contrato backend que devuelva una explicación estructurada y breve.

---

## 13. Pantalla de ranking

### Archivos

- `features/ranking/screens/ranking-screen.tsx`
- `features/ranking/hooks/use-ranking.ts`
- `features/ranking/types/index.ts`

### Qué muestra

- top 3
- lista general
- posición del usuario
- tarjeta flotante con su ranking

### Qué hace el hook

`useRanking(groupId)` hoy retorna datos simulados:

- `topThree`
- `others`
- `myRank`

### Observación

Aunque recibe `groupId`, actualmente no filtra realmente la data por grupo.  
Es un mock estático.

### Conclusión

La pantalla ya está preparada visualmente para consumir un ranking real por grupo y por período.

---

## 14. Pantalla de perfil

### Archivos

- `features/profile/screens/profile-screen.tsx`
- `features/profile/hooks/use-profile.ts`
- `features/profile/components/stat-card.tsx`

### Qué muestra

- nombre
- grupo
- nivel
- estadísticas
- cumpleaños
- opción de cerrar sesión

### Cómo calcula el hook

`useProfile()` toma datos del store y deriva:

- `level`
- stats:
    - lecciones
    - puntos
    - racha

### Conclusión

El perfil está funcional como vista local, pero todavía necesita datos remotos si se quiere considerar “source of truth”.

---

## 15. Tipos y contratos internos

### Tipos existentes

- `GroupId`
- `GroupCardData`
- `OptionId`
- `ResultState`
- `LessonOption`
- `ChallengeQuestion`
- `RankUser`
- `RootStackParamList`

### Valor técnico

Esto ya da una base sólida para migrar a backend sin rehacer la app.

---

## 16. Mocks actuales

### Datos mockeados

- `data/mockRoadmap.ts`
- `features/ranking/hooks/use-ranking.ts`
- `features/challenge/screens/challenge-screen.tsx`
- `features/explanation-ia/screens/explanation-ia-screen.tsx`

### Estado local que sigue siendo mock funcional

- parte del perfil
- parte del onboarding
- parte del progreso

### Lectura de ingeniería

Hoy la app está en una fase donde:

- la UI está avanzada,
- pero la data todavía no viene de backend.

---

## 17. Documento de backend ya existente

### Archivo

- `docs/backend-step-by-step-plan.md`

Ese documento ya define:

- objetivo de backend,
- stack recomendado,
- arquitectura funcional,
- modelo de datos,
- API contracts,
- seguridad,
- fases de implementación,
- integración con frontend,
- CI/CD,
- riesgos,
- definition of done.

### Implicación

No empezamos desde cero.  
Ya existe una guía de backend lista para convertir en plan de integración por endpoints.

---

## 18. Qué está listo para migrar a backend

### 18.1 Onboarding
Se puede migrar:

- username
- birthDate
- groupId

### 18.2 Home / Roadmap
Se puede migrar:

- header de progreso
- nodos
- streak
- coins
- estado del roadmap

### 18.3 Challenge
Se puede migrar:

- obtener pregunta
- registrar respuesta
- calcular correcto/incorrecto
- devolver XP/coins
- decidir si mostrar insight

### 18.4 Insight IA
Se puede migrar:

- explicación en pasos
- fórmula
- resumen
- chat asistido

### 18.5 Ranking
Se puede migrar:

- ranking por grupo
- ranking global
- posición del usuario

### 18.6 Perfil
Se puede migrar:

- nombre
- grupo
- progreso
- nivel
- estadísticas

---

## 19. Principales gaps antes de consumir endpoints

### A. Estado local vs source of truth
Actualmente Zustand y AsyncStorage conservan datos, pero el backend deberá ser la fuente real.

### B. Contratos API todavía no implementados
Se necesita definir respuestas claras para:

- roadmap
- question
- answer
- insight
- ranking
- profile

### C. Estados de red
Faltan:

- loading
- error
- retry
- empty state
- fallback offline

### D. Hardcodes a eliminar
Ejemplos:

- `groupLetter='A'`
- `hearts={17}`
- `xp={212}`
- `lessonId: '123'`
- `lessonTitle: 'Bohr'`
- respuestas fijas de quiz

---

## 20. Lectura de arquitectura actual

La app hoy puede entenderse en 5 capas:

### Capa 1 — UI
Pantallas y componentes ya construidos.

### Capa 2 — Estado local
Zustand + AsyncStorage para persistencia básica.

### Capa 3 — Datos mock
Roadmap, ranking, challenge y explicación IA.

### Capa 4 — Navegación
Stack principal + onboarding gate.

### Capa 5 — Backend por conectar
Ya documentado, pero aún no consumido.

---

## 21. Conclusión ejecutiva

El frontend de FIJA ya está bastante avanzado en términos de:

- diseño visual,
- estructura de pantallas,
- navegación,
- tipado,
- y estado local.

Lo que todavía falta es:

1. reemplazar mocks,
2. conectar endpoints reales,
3. normalizar contratos,
4. manejar loading/error,
5. y convertir el estado local en una capa secundaria y no en la fuente principal.

---

## 22. Orden recomendado para el siguiente plan de integración

El orden más lógico para conectar backend es:

1. **Auth / onboarding**
2. **Roadmap / home**
3. **Challenge / answer**
4. **Insight IA**
5. **Ranking**
6. **Profile**
7. **Offline cache y fallback**
8. **Observabilidad y optimización**

---

## 23. Resumen final

Hoy FIJA ya tiene:

- navegación,
- pantallas clave,
- diseño visual,
- modelos de datos básicos,
- persistencia local,
- y una guía backend inicial.

No falta rehacer la app.  
Lo que falta es **empezar a consumir backend con una estrategia ordenada y por dominios**.

---

# PLAN DE INTEGRACIÓN: Backend API v1 → FIJA Mobile App

## Fase 0: Contexto y Diagnóstico

### Estado Actual del Frontend

**Pantallas Implementadas:**
- ✅ Onboarding (3 pasos: Welcome, UserData, GroupSelection)
- ✅ Home/Roadmap (visualización de nodos, progreso)
- ✅ Challenge/Lesson (preguntas con timer)
- ✅ Explanation IA (explicación interactiva)
- ✅ Ranking (top 3 + lista general)
- ✅ Profile (estadísticas de usuario)

**Qué está listo:**
- UI completamente diseñada
- Navegación tipada
- Estructuras de componentes
- Persistencia local
- Estados y animaciones

**Qué falta:**
- Consumir endpoints reales del backend
- Reemplazar datos hardcodeados con API
- Manejar estados de red (loading, error, retry)
- Conectar autenticación real
- Implementar offline cache

### Backend Disponible

Se completó la implementación de **17 endpoints** en Next.js:
- 5 endpoints de Auth
- 2 endpoints de Onboarding
- 2 endpoints de Roadmap
- 4 endpoints de Lessons
- 1 endpoint de Insight IA
- 1 endpoint de Ranking
- 2 endpoints de Profile

### Objetivo de Integración

Migrar FIJA de mocks locales a consumir API real de forma **gradual, segura e incremental** en 6 semanas.

---

## Fase 1: Arquitectura de Integración (SEMANA 1)

### 1.1 Crear API Client Centralizado

**Ubicación:** `src/lib/api/index.ts`

**Paso 1: Instalación de dependencias**

```bash
npm install axios
npm install zustand@latest
npm install @react-native-async-storage/async-storage@latest
```

**Paso 2: Crear archivo base de API**

```typescript
import axios, { AxiosInstance } from 'axios'
import { tokenStorage } from './storage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

class ApiClient {
  private instance: AxiosInstance
  
  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await tokenStorage.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      }
    )
    
    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await tokenStorage.clearToken()
        }
        return Promise.reject(error)
      }
    )
  }
  
  async get<T>(url: string, config?: any) {
    return this.instance.get<ApiResponse<T>>(url, config)
  }
  
  async post<T>(url: string, data?: any, config?: any) {
    return this.instance.post<ApiResponse<T>>(url, data, config)
  }
  
  async patch<T>(url: string, data?: any, config?: any) {
    return this.instance.patch<ApiResponse<T>>(url, data, config)
  }
  
  async delete<T>(url: string, config?: any) {
    return this.instance.delete<ApiResponse<T>>(url, config)
  }
}

export const apiClient = new ApiClient()
```

### 1.2 Crear Tipos Compartidos

**Ubicación:** `src/types/api.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface User {
  id: string
  email: string
  username: string
  fullName: string
  groupId?: string
  birthDate?: string
  isActive: boolean
}

export interface Session {
  token: string
  expiresAt: string
}

export interface Group {
  id: string
  name: string
  description?: string
}

export interface RoadmapNode {
  id: string
  lessonId: string
  lessonTitle: string
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'
  orderIndex: number
  progressPercent: number
}

export interface RoadmapSummary {
  points: number
  coins: number
  streakDays: number
  completedLessons: number
}

export interface RoadmapResponse {
  group: Group
  summary: RoadmapSummary
  nodes: RoadmapNode[]
}

// ... más tipos según necesidad
```

### 1.3 Crear Sistema de Almacenamiento de Token

**Ubicación:** `src/lib/api/storage.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '@/types/api'

const TOKEN_KEY = '@fija_auth_token'
const USER_KEY = '@fija_user'

export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },
  
  setToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token)
    } catch (error) {
      console.error('Error setting token:', error)
    }
  },
  
  clearToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error clearing token:', error)
    }
  },
  
  getUser: async (): Promise<User | null> => {
    try {
      const user = await AsyncStorage.getItem(USER_KEY)
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  },
  
  setUser: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('Error setting user:', error)
    }
  },
  
  clearAll: async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ])
    } catch (error) {
      console.error('Error clearing auth storage:', error)
    }
  },
}
```

### 1.4 Crear Estructura de Endpoints

**Ubicación:** `src/lib/api/endpoints/auth.ts`

```typescript
import { apiClient } from '../index'
import { AuthResponse } from '@/types/api'

export const authApi = {
  register: async (data: {
    email: string
    password: string
    username: string
    fullName: string
  }) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },
  
  login: async (email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })
    return response.data
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },
  
  getMe: async () => {
    const response = await apiClient.get('/me')
    return response.data
  },
}
```

---

## Fase 2: Integración Auth (SEMANA 1-2)

### 2.1 Crear Hook useAuth

**Ubicación:** `src/hooks/use-auth.ts`

```typescript
import { useState, useEffect } from 'react'
import { authApi } from '@/lib/api/endpoints'
import { tokenStorage } from '@/lib/api/storage'
import { User, Session } from '@/types/api'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })
  
  useEffect(() => {
    restoreSession()
  }, [])
  
  const restoreSession = async () => {
    try {
      const token = await tokenStorage.getToken()
      const user = await tokenStorage.getUser()
      
      if (token && user) {
        setState({
          user,
          session: { token, expiresAt: new Date().toISOString() },
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }
  
  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))
      const response = await authApi.login(email, password)
      
      if (response.success && response.data) {
        const { user, session } = response.data
        await tokenStorage.setToken(session.token)
        await tokenStorage.setUser(user)
        
        setState({
          user,
          session,
          isLoading: false,
          isAuthenticated: true,
        })
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }
  
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      await tokenStorage.clearAll()
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }
  
  return { ...state, login, logout }
}
```

### 2.2 Actualizar AppNavigator

**Ubicación:** `navigation/app-navigator.tsx`

```typescript
import { NavigationContainer } from '@react-navigation/native'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/hooks/use-auth'

export function AppNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth()
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ff" />
      </View>
    )
  }
  
  return (
    <NavigationContainer>
      {isAuthenticated ? (
        user?.groupId ? (
          <MainStack />
        ) : (
          <OnboardingStack />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  )
}
```

---

## Fase 3: Integración Onboarding (SEMANA 2)

### 3.1 Crear Endpoints para Onboarding

**Ubicación:** `src/lib/api/endpoints/onboarding.ts`

```typescript
import { apiClient } from '../index'
import { Group } from '@/types/api'

export const onboardingApi = {
  getGroups: async () => {
    const response = await apiClient.get<Group[]>('/onboarding/groups')
    return response.data
  },
  
  completeOnboarding: async (data: {
    groupId: string
    username: string
    birthDate: string
  }) => {
    const response = await apiClient.post('/onboarding/complete', data)
    return response.data
  },
}
```

### 3.2 Crear Hook useOnboarding

**Ubicación:** `features/onboarding/hooks/use-onboarding.ts`

```typescript
import { useState } from 'react'
import { onboardingApi } from '@/lib/api/endpoints'
import { useAppStore } from '../stores/use-app-store'
import { Group } from '@/types/api'

export const useOnboarding = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { setGroupId } = useAppStore()
  
  const loadGroups = async () => {
    try {
      setLoading(true)
      const response = await onboardingApi.getGroups()
      if (response.success && response.data) {
        setGroups(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading groups')
    } finally {
      setLoading(false)
    }
  }
  
  const completeOnboarding = async (data: {
    groupId: string
    username: string
    birthDate: string
  }) => {
    try {
      setLoading(true)
      const response = await onboardingApi.completeOnboarding(data)
      
      if (response.success && response.data) {
        setGroupId(data.groupId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error completing onboarding')
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  return { groups, loading, error, loadGroups, completeOnboarding }
}
```

---

## Fase 4: Integración Roadmap (SEMANA 2-3)

### 4.1 Crear Endpoints para Roadmap

**Ubicación:** `src/lib/api/endpoints/roadmap.ts`

```typescript
import { apiClient } from '../index'
import { RoadmapResponse } from '@/types/api'

export const roadmapApi = {
  getRoadmap: async (groupId: string) => {
    const response = await apiClient.get<RoadmapResponse>(
      `/roadmap?groupId=${groupId}`
    )
    return response.data
  },
}
```

### 4.2 Crear Hook useRoadmap

**Ubicación:** `features/content/hooks/use-roadmap.ts`

```typescript
import { useState, useEffect } from 'react'
import { roadmapApi } from '@/lib/api/endpoints'
import { RoadmapResponse } from '@/types/api'

export const useRoadmap = (groupId?: string) => {
  const [data, setData] = useState<RoadmapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (groupId) {
      loadRoadmap()
    }
  }, [groupId])
  
  const loadRoadmap = async () => {
    if (!groupId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await roadmapApi.getRoadmap(groupId)
      
      if (response.success && response.data) {
        setData(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading roadmap')
    } finally {
      setLoading(false)
    }
  }
  
  return { data, loading, error, refetch: loadRoadmap }
}
```

---

## Fase 5: Integración Lessons (SEMANA 3)

### 5.1 Crear Endpoints para Lecciones

**Ubicación:** `src/lib/api/endpoints/lessons.ts`

```typescript
import { apiClient } from '../index'
import { Lesson, Question, SubmitAnswerResponse } from '@/types/api'

export const lessonsApi = {
  getLesson: async (lessonId: string) => {
    const response = await apiClient.get<Lesson>(`/lessons/${lessonId}`)
    return response.data
  },
  
  getQuestion: async (lessonId: string) => {
    const response = await apiClient.get<Question>(`/lessons/${lessonId}/question`)
    return response.data
  },
  
  submitAnswer: async (lessonId: string, data: {
    questionId: string
    selectedOptionId: string
    timeSpentSeconds: number
  }) => {
    const response = await apiClient.post<SubmitAnswerResponse>(
      `/lessons/${lessonId}/answer`,
      data
    )
    return response.data
  },
}
```

### 5.2 Crear Hook useChallenge

**Ubicación:** `features/challenge/hooks/use-challenge.ts`

```typescript
import { useState, useEffect } from 'react'
import { lessonsApi } from '@/lib/api/endpoints'
import { Question, SubmitAnswerResponse } from '@/types/api'

export const useChallenge = (lessonId: string) => {
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null)
  
  useEffect(() => {
    loadQuestion()
  }, [lessonId])
  
  const loadQuestion = async () => {
    try {
      setLoading(true)
      const response = await lessonsApi.getQuestion(lessonId)
      
      if (response.success && response.data) {
        setQuestion(response.data)
      }
    } catch (err) {
      console.error('Error loading question:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const submitAnswer = async (
    selectedOptionId: string,
    timeSpent: number
  ): Promise<SubmitAnswerResponse | null> => {
    if (!question) return null
    
    try {
      setSubmitting(true)
      
      const response = await lessonsApi.submitAnswer(lessonId, {
        questionId: question.questionId,
        selectedOptionId,
        timeSpentSeconds: timeSpent,
      })
      
      if (response.success && response.data) {
        setResult(response.data)
        return response.data
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
    } finally {
      setSubmitting(false)
    }
    
    return null
  }
  
  return { question, result, loading, submitting, submitAnswer, loadNextQuestion: loadQuestion }
}
```

---

## Fase 6: Integración Insight IA (SEMANA 3)

### 6.1 Crear Endpoint para Insight

**Ubicación:** `src/lib/api/endpoints/insight.ts`

```typescript
import { apiClient } from '../index'
import { InsightResponse } from '@/types/api'

export const insightApi = {
  generateExplanation: async (attemptId: string) => {
    const response = await apiClient.post<InsightResponse>(
      '/insight/generate',
      { attemptId }
    )
    return response.data
  },
}
```

### 6.2 Crear Hook useInsight

**Ubicación:** `features/explanation-ia/hooks/use-insight.ts`

```typescript
import { useState } from 'react'
import { insightApi } from '@/lib/api/endpoints'
import { InsightResponse } from '@/types/api'

export const useInsight = () => {
  const [insight, setInsight] = useState<InsightResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const generateExplanation = async (
    attemptId: string
  ): Promise<InsightResponse | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await insightApi.generateExplanation(attemptId)
      
      if (response.success && response.data) {
        setInsight(response.data)
        return response.data
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating insight')
      return null
    } finally {
      setLoading(false)
    }
  }
  
  return { insight, loading, error, generateExplanation }
}
```

---

## Fase 7: Integración Ranking (SEMANA 4)

### 7.1 Crear Endpoint para Ranking

**Ubicación:** `src/lib/api/endpoints/ranking.ts`

```typescript
import { apiClient } from '../index'
import { RankingResponse } from '@/types/api'

export const rankingApi = {
  getRanking: async (params: {
    groupId?: string
    period?: 'daily' | 'weekly' | 'all'
  }) => {
    const response = await apiClient.get<RankingResponse>(
      '/ranking',
      { params }
    )
    return response.data
  },
}
```

### 7.2 Crear Hook useRanking

**Ubicación:** `features/ranking/hooks/use-ranking.ts`

```typescript
import { useState, useEffect } from 'react'
import { rankingApi } from '@/lib/api/endpoints'
import { RankingResponse } from '@/types/api'

export const useRanking = (
  groupId?: string,
  period: 'daily' | 'weekly' | 'all' = 'daily'
) => {
  const [data, setData] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadRanking()
  }, [groupId, period])
  
  const loadRanking = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await rankingApi.getRanking({ groupId, period })
      
      if (response.success && response.data) {
        setData(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading ranking')
    } finally {
      setLoading(false)
    }
  }
  
  return { data, loading, error, refetch: loadRanking }
}
```

---

## Fase 8: Integración Profile (SEMANA 4)

### 8.1 Crear Endpoints para Profile

**Ubicación:** `src/lib/api/endpoints/profile.ts`

```typescript
import { apiClient } from '../index'
import { ProfileStats, ProfileActivity } from '@/types/api'

export const profileApi = {
  getStats: async () => {
    const response = await apiClient.get<ProfileStats>('/profile/stats')
    return response.data
  },
  
  getActivity: async () => {
    const response = await apiClient.get<ProfileActivity>('/profile/activity')
    return response.data
  },
}
```

### 8.2 Crear Hook useProfile

**Ubicación:** `features/profile/hooks/use-profile.ts`

```typescript
import { useState, useEffect } from 'react'
import { profileApi } from '@/lib/api/endpoints'
import { ProfileStats, ProfileActivity } from '@/types/api'

export const useProfile = () => {
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [activity, setActivity] = useState<ProfileActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadProfile()
  }, [])
  
  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [statsRes, activityRes] = await Promise.all([
        profileApi.getStats(),
        profileApi.getActivity(),
      ])
      
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
      
      if (activityRes.success && activityRes.data) {
        setActivity(activityRes.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }
  
  return { stats, activity, loading, error, refetch: loadProfile }
}
```

---

## Cronograma de Implementación

| Semana | Fase | Status |
|--------|------|--------|
| 1 | Arquitectura + Auth | ⏳ Listo para iniciar |
| 1-2 | Auth Completo | ⏳ Listo para iniciar |
| 2 | Onboarding | ⏳ Listo para iniciar |
| 2-3 | Roadmap | ⏳ Listo para iniciar |
| 3 | Lessons | ⏳ Listo para iniciar |
| 3 | Insight IA | ⏳ Listo para iniciar |
| 4 | Ranking | ⏳ Listo para iniciar |
| 4 | Profile | ⏳ Listo para iniciar |

---

## Checklist de Validación

### Semana 1-2:
- [ ] API Client configurado y funcional
- [ ] Tipos compartidos creados
- [ ] Token storage implementado
- [ ] Auth hooks funcionando
- [ ] Login/Register probados manualmente

### Semana 2-3:
- [ ] Onboarding consumiendo endpoints reales
- [ ] Roadmap mostrando datos del API
- [ ] Ningún mock hardcodeado

### Semana 3:
- [ ] Challenge/Answer funciona completamente
- [ ] Insight genera explicaciones correctamente

### Semana 4:
- [ ] Ranking muestra datos correctos
- [ ] Profile stats actualizados

---

## Success Criteria

1. ✅ Todos los endpoints consumidos correctamente
2. ✅ 0 mocks hardcodeados en código de producción
3. ✅ 100% de features funcionando con backend real
4. ✅ Loading states consistentes
5. ✅ Error handling funcional
6. ✅ Cero auth errors en users reales

---

## Conclusión

Este plan permite migrar FIJA de mocks a backend real de forma **gradual, segura e incremental** en 6 semanas.

**Tiempo total estimado:** 6 semanas  
**Esfuerzo:** 1 developer full-time  
**Risk Level:** Bajo (cambios incrementales)
