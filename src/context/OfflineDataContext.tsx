'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { offlineDB } from '@/lib/indexeddb'
import { useDatabaseAuthSafe } from './DatabaseAuthContext'
import type { User, Project, Location, AnchorPoint, AnchorTest, AnchorTestResult, MarkerShape, UserRole, FloorPlan } from '@/types'

interface OfflineDataContextType {
  // Data state
  users: User[]
  projects: Project[]
  locations: Location[]
  floorPlans: FloorPlan[]
  points: AnchorPoint[]
  tests: AnchorTest[]
  
  // Current selections
  currentProject: Project | null
  currentLocation: Location | null
  currentFloorPlan: FloorPlan | null
  testPointId: string | null
  currentUser: User | null
  
  // Form persistence state
  lastSelectedLocation: string | null
  lastInstallationDate: Date | null
  
  // UI/Map state
  showArchived: boolean
  lineToolMode: boolean
  lineToolStartPointId: string | null
  lineToolEndPointId: string | null
  lineToolPreviewPoints: { x: number; y: number }[]
  inspectionFlags: string[]
  allPointsForProject: AnchorPoint[]
  
  // Actions
  setCurrentProject: (project: Project | null) => void
  setCurrentLocation: (location: Location | null) => void
  setCurrentFloorPlan: (floorPlan: FloorPlan | null) => void
  setTestPointId: (pointId: string | null) => void
  
  // Map tool actions
  setLineToolStartPoint: (pointId: string | null) => void
  setLineToolEndPoint: (pointId: string | null) => void
  setShowArchived: (show: boolean) => void
  
  // Data methods
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (project: Project) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  
  createUser: (user: Omit<User, 'id'>) => Promise<User>
  updateUser: (user: User) => Promise<void>
  addUser: (name: string, role: UserRole) => Promise<User>
  deleteUser: (userId: string) => Promise<void>
  
  createLocation: (location: Omit<Location, 'id'>) => Promise<Location>
  updateLocation: (location: Location) => Promise<void>
  updateLocationShape: (locationId: string, shape: MarkerShape) => Promise<void>
  deleteLocation: (locationId: string) => Promise<void>

  createFloorPlan: (name: string, image: string, order: number) => Promise<FloorPlan | null>
  updateFloorPlan: (id: string, name: string, order: number) => Promise<FloorPlan | null>
  deleteFloorPlan: (id: string) => Promise<boolean>
  toggleFloorPlanActive: (id: string, active: boolean) => Promise<FloorPlan | null>

  createPoint: (point: Omit<AnchorPoint, 'id' | 'dataHora'>) => Promise<AnchorPoint>
  updatePoint: (point: AnchorPoint) => Promise<void>
  deletePoint: (pointId: string) => Promise<void>
  unarchivePoint: (pointId: string) => Promise<void>
  
  createTest: (test: Omit<AnchorTest, 'id' | 'dataHora'>) => Promise<AnchorTest>
  updatePointsAndAddTest: (pontoId: string, testData: Omit<AnchorTestResult, 'id' | 'dataHora' | 'pontoId' | 'createdByUserId'>, pointUpdates: Partial<AnchorPoint>) => void
  
  // Getters
  getProjectById: (id: string) => Project | null
  getUsersForCompany: () => User[]
  getProjectsForCompany: () => Project[]
  getLocationsForCompany: () => Location[]
  getPointsByProject: (projectId: string) => AnchorPoint[]
  getTestsByPoint: (pointId: string) => AnchorTest[]
  getPointById: (id: string) => AnchorPoint | null
  
  // UI state
  activeTab: string
  setActiveTab: (tab: string) => void
  
  // Loading/sync state
  isLoading: boolean
  refreshData: () => Promise<void>
  
  // Form persistence actions
  setLastSelectedLocation: (location: string | null) => void
  setLastInstallationDate: (date: Date | null) => void
}

const OfflineDataContext = createContext<OfflineDataContextType | null>(null)

export function OfflineDataProvider({ children }: { children: ReactNode }) {
  const { user: currentUser, company: currentCompany, isAuthenticated } = useDatabaseAuthSafe()
  
  // Data state
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([])
  const [points, setPoints] = useState<AnchorPoint[]>([])
  const [tests, setTests] = useState<AnchorTest[]>([])
  
  // Current selections
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [currentFloorPlan, setCurrentFloorPlan] = useState<FloorPlan | null>(null)
  const [testPointId, setTestPointId] = useState<string | null>(null)
  
  // Form persistence state
  const [lastSelectedLocation, setLastSelectedLocation] = useState<string | null>(null)
  const [lastInstallationDate, setLastInstallationDate] = useState<Date | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  
  // Map UI state
  const [showArchived, setShowArchived] = useState(false)
  const [lineToolMode, setLineToolMode] = useState(false)
  const [lineToolStartPointId, setLineToolStartPointId] = useState<string | null>(null)
  const [lineToolEndPointId, setLineToolEndPointId] = useState<string | null>(null)
  const [lineToolPreviewPoints, setLineToolPreviewPoints] = useState<{ x: number; y: number }[]>([])
  const [inspectionFlags, setInspectionFlags] = useState<string[]>([])
  
  // Define getter functions first
  const getPointsByProject = (projectId: string): AnchorPoint[] => {
    // Return ALL points for the project, including archived ones
    // The filtering by archived status should be done in the UI components
    return points.filter(p => p.projectId === projectId)
  }

  // Computed values - allPointsForProject includes archived points
  const allPointsForProject = currentProject ? points.filter(p => p.projectId === currentProject.id) : []
  
  // Current active points for the project (excluding archived)
  const currentProjectPoints = currentProject ? getPointsByProject(currentProject.id) : []

  // Load data when authentication changes
  useEffect(() => {
    if (isAuthenticated && currentCompany) {
      refreshData()
    } else {
      // Clear data when logged out
      setUsers([])
      setProjects([])
      setLocations([])
      setPoints([])
      setTests([])
      setCurrentProject(null)
      setCurrentLocation(null)
    }
  }, [isAuthenticated, currentCompany])

  // Persist current project selection
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('anchorViewCurrentProject', JSON.stringify(currentProject))
    }
  }, [currentProject])

  // Persist showArchived setting
  useEffect(() => {
    localStorage.setItem('anchorViewShowArchived', JSON.stringify(showArchived))
  }, [showArchived])

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('anchorViewActiveTab', activeTab)
  }, [activeTab])

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const savedShowArchived = localStorage.getItem('anchorViewShowArchived')
      if (savedShowArchived) {
        setShowArchived(JSON.parse(savedShowArchived))
      }
      
      const savedActiveTab = localStorage.getItem('anchorViewActiveTab')
      if (savedActiveTab) {
        setActiveTab(savedActiveTab)
      }
    } catch (error) {
      console.warn('Failed to load persisted settings:', error)
    }
  }, [])

  const refreshData = async (): Promise<void> => {
    if (!currentCompany || !currentUser) return

    setIsLoading(true)

    try {
      console.log('🔄 Loading data from database...')

      // Import server actions
      const { getProjectsForUser, getProjectsForCompany } = await import('@/app/actions/project-actions')

      // Load projects using new function that considers team permissions
      let loadedProjects: Project[]
      if (currentUser.role === 'superadmin' || currentUser.role === 'company_admin') {
        // Superadmin and company_admin see all company projects
        const rawProjects = await getProjectsForCompany(currentCompany.id)
        loadedProjects = rawProjects.map((p: any) => ({
          ...p,
          createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
          updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt
        }))
      } else {
        // team_admin and technician see own projects + assigned projects
        const rawProjects = await getProjectsForUser(currentUser.id, currentCompany.id)
        loadedProjects = rawProjects.map((p: any) => ({
          ...p,
          createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
          updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt
        }))
      }

      // Load other data in parallel
      const [
        loadedUsers,
        loadedLocations,
        loadedPoints,
        loadedTests
      ] = await Promise.all([
        offlineDB.getUsersByCompany(currentCompany.id),
        offlineDB.getLocationsByCompany(currentCompany.id),
        currentProject ? offlineDB.getPointsByProject(currentProject.id) : offlineDB.getAll('anchor_points'),
        offlineDB.getAll('anchor_tests')
      ])

      setUsers(loadedUsers)
      setProjects(loadedProjects)
      setLocations(loadedLocations)
      setPoints(loadedPoints)
      setTests(loadedTests)

      // Load floor plans for current project
      if (currentProject) {
        try {
          const { getFloorPlansForProject } = await import('@/app/actions/floorplan-actions')
          const loadedFloorPlans = await getFloorPlansForProject(currentProject.id)
          // Convert Date objects to strings for FloorPlan type
          const convertedFloorPlans: FloorPlan[] = loadedFloorPlans.map(fp => ({
            id: fp.id,
            projectId: fp.projectId,
            name: fp.name,
            image: fp.image,
            order: fp.order,
            active: fp.active,
            createdAt: new Date(fp.createdAt).toISOString(),
            updatedAt: new Date(fp.updatedAt).toISOString(),
            anchorPoints: []
          }))
          setFloorPlans(convertedFloorPlans)
        } catch (error) {
          console.error('Error loading floor plans:', error)
          setFloorPlans([])
        }
      } else {
        setFloorPlans([])
      }
      
      // Set default project if none selected
      if (!currentProject && loadedProjects.length > 0) {
        // Try to restore previously selected project
        try {
          const savedProjectStr = localStorage.getItem('anchorViewCurrentProject')
          if (savedProjectStr) {
            const savedProject = JSON.parse(savedProjectStr)
            const foundProject = loadedProjects.find(p => p.id === savedProject.id)
            if (foundProject) {
              setCurrentProject(foundProject)
            } else {
              setCurrentProject(loadedProjects[0])
            }
          } else {
            setCurrentProject(loadedProjects[0])
          }
        } catch (error) {
          console.warn('Failed to restore project selection:', error)
          setCurrentProject(loadedProjects[0])
        }
      }
      
      console.log(`✅ Data loaded: ${loadedUsers.length} users, ${loadedProjects.length} projects, ${loadedPoints.length} points`)

      // Try to sync in background
      // syncNow() // TODO: Implement sync functionality

    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Project methods
  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    if (!currentUser || !currentCompany) throw new Error('Not authenticated')

    // Import server action dynamically
    const { addProject } = await import('@/app/actions/project-actions')

    try {
      // Try to save to database first
      console.log('[DEBUG] Attempting to save project to database...')
      const savedProject = await addProject({
        ...projectData,
        companyId: currentCompany.id,
        createdByUserId: projectData.createdByUserId || currentUser.id
      } as any)

      if (savedProject) {
        console.log('✅ Project created in database:', savedProject.id)

        // Convert Prisma project to app Project type (Date -> string)
        const projectForApp: Project = {
          ...savedProject,
          createdAt: savedProject.createdAt?.toISOString(),
          updatedAt: savedProject.updatedAt?.toISOString()
        }

        // Also save to IndexedDB for offline access
        await offlineDB.createProject(projectForApp)

        // Update local state
        setProjects(prev => [...prev, projectForApp])

        return projectForApp
      }

      throw new Error('Failed to save project to database')

    } catch (error) {
      console.warn('[WARN] Database save failed, using IndexedDB fallback:', error)

      // Fallback to IndexedDB only
      const project: any = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...projectData,
        companyId: currentCompany.id,
        createdByUserId: currentUser.id,
        deleted: false
      }

      await offlineDB.createProject(project)

      // Update local state
      setProjects(prev => [...prev, project])

      console.log('✅ Project created offline (fallback):', project.name)

      return project
    }
  }

  const updateProject = async (project: Project): Promise<void> => {
    const updatedProject = {
      ...project,
      updatedAt: new Date()
    } as any

    await offlineDB.put('projects', updatedProject)

    // Update local state
    setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p))

    console.log('✅ Project updated offline:', project.name)
  }

  const deleteProject = async (projectId: string): Promise<void> => {
    // Soft delete
    const project = projects.find(p => p.id === projectId)
    if (project) {
      await updateProject({ ...project, deleted: true } as any)
    }
    
    // Update local state
    setProjects(prev => prev.filter(p => p.id !== projectId))
    
    console.log('✅ Project deleted offline:', projectId)
  }

  // User methods
  const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    if (!currentCompany) throw new Error('Not authenticated')
    
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      companyId: currentCompany.id,
      active: true
    }
    
    await offlineDB.put('users', user)
    
    // Update local state
    setUsers(prev => [...prev, user])
    
    console.log('✅ User created offline:', user.name)
    
    return user
  }

  const updateUser = async (user: User): Promise<void> => {
    await offlineDB.put('users', user)
    
    // Update local state
    setUsers(prev => prev.map(u => u.id === user.id ? user : u))
    
    console.log('✅ User updated offline:', user.name)
  }

  const addUser = async (name: string, role: UserRole): Promise<User> => {
    if (!currentCompany) throw new Error('Not authenticated')
    
    // For simple local users, we don't need email/password
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      role,
      companyId: currentCompany.id,
      active: true
    }
    
    await offlineDB.put('users', user)
    
    // Update local state
    setUsers(prev => [...prev, user])
    
    console.log('✅ Simple user added offline:', user.name)
    
    return user
  }

  const deleteUser = async (userId: string): Promise<void> => {
    await offlineDB.delete('users', userId)
    
    // Update local state
    setUsers(prev => prev.filter(u => u.id !== userId))
    
    console.log('✅ User deleted offline:', userId)
  }

  // Location methods
  const createLocation = async (locationData: Omit<Location, 'id'>): Promise<Location> => {
    if (!currentCompany) throw new Error('Not authenticated')
    if (!currentProject) throw new Error('No project selected')
    
    const location: Location = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...locationData,
      companyId: currentCompany.id,
      projectId: currentProject.id // Associate location with current project
    }
    
    await offlineDB.put('locations', location)
    
    // Update local state
    setLocations(prev => [...prev, location])
    
    console.log('✅ Location created offline:', location.name)
    
    return location
  }

  const updateLocation = async (location: Location): Promise<void> => {
    await offlineDB.put('locations', location)
    
    // Update local state
    setLocations(prev => prev.map(l => l.id === location.id ? location : l))
    
    console.log('✅ Location updated offline:', location.name)
  }

  const updateLocationShape = async (locationId: string, shape: MarkerShape): Promise<void> => {
    console.log('🔄 updateLocationShape called:', { locationId, shape })
    
    try {
      // Try server action first
      const { updateLocationShape: updateLocationShapeAction } = await import('@/app/actions/project-actions')
      const updatedLocation = await updateLocationShapeAction(locationId, shape)
      
      if (updatedLocation) {
        // Update local state with server response
        setLocations(prev => prev.map(l => l.id === locationId ? (updatedLocation as any) : l))
        console.log('✅ Location shape updated via server:', updatedLocation.name, shape)
        return
      }
    } catch (error) {
      console.warn('🚨 Server update failed, using offline fallback:', error)
    }
    
    // Fallback to offline update
    const location = locations.find(l => l.id === locationId)
    if (!location) {
      console.error('❌ Location not found:', locationId)
      return
    }
    
    const updatedLocation = { ...location, markerShape: shape }
    await offlineDB.put('locations', updatedLocation)
    
    // Update local state
    setLocations(prev => prev.map(l => l.id === locationId ? updatedLocation : l))
    
    console.log('✅ Location shape updated offline:', location.name, shape)
  }

  const deleteLocation = async (locationId: string): Promise<void> => {
    await offlineDB.delete('locations', locationId)

    // Update local state
    setLocations(prev => prev.filter(l => l.id !== locationId))

    console.log('✅ Location deleted offline:', locationId)
  }

  // Floor Plan methods
  const createFloorPlan = async (name: string, image: string, order: number): Promise<FloorPlan | null> => {
    if (!currentProject) throw new Error('No project selected')

    try {
      const { createFloorPlan: createFloorPlanAction } = await import('@/app/actions/floorplan-actions')
      const newFloorPlan = await createFloorPlanAction(currentProject.id, name, image, order)

      if (newFloorPlan) {
        const convertedFloorPlan: FloorPlan = {
          id: newFloorPlan.id,
          projectId: newFloorPlan.projectId,
          name: newFloorPlan.name,
          image: newFloorPlan.image,
          order: newFloorPlan.order,
          active: newFloorPlan.active,
          createdAt: new Date(newFloorPlan.createdAt).toISOString(),
          updatedAt: new Date(newFloorPlan.updatedAt).toISOString(),
          anchorPoints: []
        }
        setFloorPlans(prev => [...prev, convertedFloorPlan])
        console.log('✅ Floor plan created:', newFloorPlan.name)
        return convertedFloorPlan
      }

      return null
    } catch (error) {
      console.error('Error creating floor plan:', error)
      return null
    }
  }

  const updateFloorPlan = async (id: string, name: string, order: number): Promise<FloorPlan | null> => {
    try {
      const { updateFloorPlan: updateFloorPlanAction } = await import('@/app/actions/floorplan-actions')
      const updatedFloorPlan = await updateFloorPlanAction(id, name, order)

      if (updatedFloorPlan) {
        const convertedFloorPlan: FloorPlan = {
          id: updatedFloorPlan.id,
          projectId: updatedFloorPlan.projectId,
          name: updatedFloorPlan.name,
          image: updatedFloorPlan.image,
          order: updatedFloorPlan.order,
          active: updatedFloorPlan.active,
          createdAt: new Date(updatedFloorPlan.createdAt).toISOString(),
          updatedAt: new Date(updatedFloorPlan.updatedAt).toISOString(),
          anchorPoints: []
        }
        setFloorPlans(prev => prev.map(fp => fp.id === id ? convertedFloorPlan : fp))
        console.log('✅ Floor plan updated:', updatedFloorPlan.name)
        return convertedFloorPlan
      }

      return null
    } catch (error) {
      console.error('Error updating floor plan:', error)
      return null
    }
  }

  const deleteFloorPlan = async (id: string): Promise<boolean> => {
    try {
      const { deleteFloorPlan: deleteFloorPlanAction } = await import('@/app/actions/floorplan-actions')
      const success = await deleteFloorPlanAction(id)

      if (success) {
        setFloorPlans(prev => prev.filter(fp => fp.id !== id))
        if (currentFloorPlan?.id === id) {
          setCurrentFloorPlan(null)
        }
        console.log('✅ Floor plan deleted')
      }

      return success
    } catch (error) {
      console.error('Error deleting floor plan:', error)
      return false
    }
  }

  const toggleFloorPlanActive = async (id: string, active: boolean): Promise<FloorPlan | null> => {
    try {
      const { toggleFloorPlanActive: toggleFloorPlanActiveAction } = await import('@/app/actions/floorplan-actions')
      const updatedFloorPlan = await toggleFloorPlanActiveAction(id, active)

      if (updatedFloorPlan) {
        const convertedFloorPlan: FloorPlan = {
          id: updatedFloorPlan.id,
          projectId: updatedFloorPlan.projectId,
          name: updatedFloorPlan.name,
          image: updatedFloorPlan.image,
          order: updatedFloorPlan.order,
          active: updatedFloorPlan.active,
          createdAt: new Date(updatedFloorPlan.createdAt).toISOString(),
          updatedAt: new Date(updatedFloorPlan.updatedAt).toISOString(),
          anchorPoints: []
        }
        setFloorPlans(prev => prev.map(fp => fp.id === id ? convertedFloorPlan : fp))
        console.log('✅ Floor plan active status updated:', active)
        return convertedFloorPlan
      }

      return null
    } catch (error) {
      console.error('Error toggling floor plan active status:', error)
      return null
    }
  }

  // Point methods
  const createPoint = async (pointData: Omit<AnchorPoint, 'id' | 'dataHora'>): Promise<AnchorPoint> => {
    if (!currentUser) throw new Error('Not authenticated')
    
    const point: AnchorPoint = {
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...pointData,
      dataHora: new Date().toISOString(),
      createdByUserId: currentUser.id,
      lastModifiedByUserId: currentUser.id,
      archived: false,
      status: 'Não Testado'
    }
    
    await offlineDB.createPoint(point)
    
    // Update local state
    setPoints(prev => [...prev, point])
    
    console.log('✅ Point created offline:', point.numeroPonto)
    
    return point
  }

  const updatePoint = async (point: AnchorPoint): Promise<void> => {
    const updatedPoint = {
      ...point,
      lastModifiedByUserId: currentUser?.id || point.lastModifiedByUserId
    }
    
    await offlineDB.updatePoint(updatedPoint)
    
    // Update local state
    setPoints(prev => prev.map(p => p.id === point.id ? updatedPoint : p))
    
    console.log('✅ Point updated offline:', point.numeroPonto)
  }

  const deletePoint = async (pointId: string): Promise<void> => {
    // Soft delete (archive)
    const point = points.find(p => p.id === pointId)
    if (point) {
      await updatePoint({ ...point, archived: true })
    }
    
    console.log('✅ Point archived offline:', pointId)
  }

  const unarchivePoint = async (pointId: string): Promise<void> => {
    // Unarchive (restore) the point
    const point = allPointsForProject.find(p => p.id === pointId)
    if (point) {
      await updatePoint({ ...point, archived: false })
    }
    
    console.log('✅ Point unarchived offline:', pointId)
  }

  // Test methods
  const createTest = async (testData: Omit<AnchorTest, 'id' | 'dataHora'>): Promise<AnchorTest> => {
    if (!currentUser) throw new Error('Not authenticated')
    
    const test: AnchorTest = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...testData,
      dataHora: new Date().toISOString(),
      createdByUserId: currentUser.id
    }
    
    await offlineDB.createTest(test)
    
    // Update local state
    setTests(prev => [...prev, test])
    
    // Update point status
    const point = points.find(p => p.id === testData.pontoId)
    if (point) {
      await updatePoint({
        ...point,
        status: testData.resultado
      } as any)
    }
    
    console.log('✅ Test created offline:', test.resultado)
    
    return test
  }

  // Função para atualizar ponto e adicionar teste
  const updatePointsAndAddTest = async (
    pontoId: string, 
    testData: Omit<AnchorTestResult, 'id' | 'dataHora' | 'pontoId' | 'createdByUserId'>, 
    pointUpdates: Partial<AnchorPoint>
  ) => {
    if (!currentUser) throw new Error('Not authenticated')
    
    // Criar o teste
    const test: AnchorTest = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pontoId: pontoId,
      resultado: testData.resultado,
      carga: testData.carga || '',
      tempo: testData.tempo || '',
      tecnico: testData.tecnico || '',
      observacoes: testData.observacoes || '',
      fotoTeste: testData.fotoTeste || '',
      fotoPronto: testData.fotoPronto || '',
      dataFotoPronto: testData.dataFotoPronto || '',
      dataHora: new Date().toISOString(),
      createdByUserId: currentUser.id
    }
    
    await offlineDB.createTest(test)
    
    // Update local state
    setTests(prev => [...prev, test])
    
    // Update point status and numeroLacre
    const point = points.find(p => p.id === pontoId)
    if (point) {
      const updatedPoint = {
        ...point,
        status: testData.resultado,
        numeroLacre: pointUpdates.numeroLacre || point.numeroLacre
      }
      await updatePoint(updatedPoint)
    }
    
    console.log('✅ Test created and point updated:', test.resultado)
  }

  // Getter methods
  const getProjectById = (id: string): Project | null => {
    return projects.find(p => p.id === id) || null
  }

  const getUsersForCompany = (): User[] => {
    return users.filter(u => u.companyId === currentCompany?.id && u.active)
  }

  const getProjectsForCompany = (): Project[] => {
    return projects.filter(p => p.companyId === currentCompany?.id && !p.deleted)
  }

  const getLocationsForCompany = (): Location[] => {
    // Filter locations by company AND current project
    return locations.filter(l => 
      l.companyId === currentCompany?.id && 
      l.projectId === currentProject?.id
    )
  }

  const getTestsByPoint = (pointId: string): AnchorTest[] => {
    return tests.filter(t => t.pontoId === pointId)
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
  }

  const getPointById = (id: string): AnchorPoint | null => {
    return points.find(p => p.id === id) || null
  }

  const contextValue: OfflineDataContextType = {
    // Data state
    users: getUsersForCompany(),
    projects: getProjectsForCompany(),
    locations: getLocationsForCompany(),
    floorPlans,
    // Use allPointsForProject which includes all points (archived and non-archived)
    // The filtering will be done by the UI components based on showArchived state
    points: allPointsForProject,
    tests,

    // Current selections
    currentProject,
    currentLocation,
    currentFloorPlan,
    testPointId,
    currentUser: currentUser as any,

    // Actions
    setCurrentProject,
    setCurrentLocation,
    setCurrentFloorPlan,
    setTestPointId,
    
    // Map tool actions
    setLineToolStartPoint: setLineToolStartPointId,
    setLineToolEndPoint: setLineToolEndPointId,
    setShowArchived,
    
    // Map UI state
    showArchived,
    lineToolMode,
    lineToolStartPointId,
    lineToolEndPointId,
    lineToolPreviewPoints,
    inspectionFlags,
    allPointsForProject,
    
    // Data methods
    createProject,
    updateProject,
    deleteProject,
    createUser,
    updateUser,
    addUser,
    deleteUser,
    createLocation,
    updateLocation,
    updateLocationShape,
    deleteLocation,
    createFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    toggleFloorPlanActive,
    createPoint,
    updatePoint,
    deletePoint,
    unarchivePoint,
    createTest,
    updatePointsAndAddTest,
    
    // Getters
    getProjectById,
    getUsersForCompany,
    getProjectsForCompany,
    getLocationsForCompany,
    getPointsByProject,
    getTestsByPoint,
    getPointById,
    
    // UI state
    activeTab,
    setActiveTab,
    
    // Loading/sync state
    isLoading,
    refreshData,
    
    // Form persistence state and actions
    lastSelectedLocation,
    lastInstallationDate,
    setLastSelectedLocation,
    setLastInstallationDate
  }

  return (
    <OfflineDataContext.Provider value={contextValue}>
      {children}
    </OfflineDataContext.Provider>
  )
}

export function useOfflineData() {
  const context = useContext(OfflineDataContext)
  if (!context) {
    throw new Error('useOfflineData must be used within an OfflineDataProvider')
  }
  return context
}

export default OfflineDataContext