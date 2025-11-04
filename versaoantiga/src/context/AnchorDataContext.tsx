
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { AnchorPoint, AnchorTest, User, Project, AnchorTestResult, Location, MarkerShape } from '@/types';

interface AnchorDataContextType {
  projects: Project[];
  points: AnchorPoint[];
  allPointsForProject: AnchorPoint[]; // Includes archived
  tests: AnchorTest[];
  users: User[];
  currentUser: User | null;
  currentProject: Project | null;
  locations: Location[];
  addProject: (project: Omit<Project, 'id'>) => void;
  addPoint: (point: Omit<AnchorPoint, 'id' | 'dataHora' | 'status' | 'createdByUserId' | 'lastModifiedByUserId' | 'archived'>) => void;
  editPoint: (pointId: string, updates: Partial<Omit<AnchorPoint, 'id' | 'projectId'>>) => void;
  addMultiplePoints: (points: Omit<AnchorPoint, 'id' | 'dataHora' | 'status' | 'createdByUserId' | 'lastModifiedByUserId' | 'archived'>[]) => void;
  updatePointsAndAddTest: (pontoId: string, testData: Omit<AnchorTestResult, 'id' | 'dataHora' | 'createdByUserId' | 'pontoId'>, pointUpdates: Partial<AnchorPoint>) => void;
  addFinishedPhotoToTest: (testId: string, photoDataUrl: string) => void;
  deleteProject: (id: string) => void;
  deletePoint: (id: string) => void;
  deleteUser: (userId: string) => void;
  addLocation: (locationName: string) => void;
  deleteLocation: (locationId: string) => void;
  updateLocationShape: (locationId: string, shape: MarkerShape) => void;
  getProjectById: (id: string) => Project | undefined;
  getPointById: (id: string) => AnchorPoint | undefined;
  getTestByPointId: (pointId: string) => AnchorTest | undefined;
  inspectionFlags: string[];
  setInspectionFlags: React.Dispatch<React.SetStateAction<string[]>>;
  addUser: (name: string, role: 'admin' | 'user') => void;
  setCurrentUser: (user: User | null) => void;
  setCurrentProject: (project: Project | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  testPointId: string | null;
  setTestPointId: (id: string | null) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;

  // Sticky date for point creation
  installationDate: Date | undefined;
  setInstallationDate: (date: Date | undefined) => void;

  // Line Tool State
  lineToolMode: boolean;
  setLineToolMode: (mode: boolean) => void;
  lineToolStartPointId: string | null;
  lineToolEndPointId: string | null;
  setLineToolStartPoint: (id: string) => void;
  setLineToolEndPoint: (id: string) => void;
  resetLineTool: () => void;
  lineToolPreviewPoints: { x: number, y: number }[];
  setLineToolPreviewPoints: (points: { x: number, y: number }[]) => void;
}

const AnchorDataContext = createContext<AnchorDataContextType | undefined>(undefined);

const defaultLocations: Location[] = [
    { id: '1', name: "PROGRESSAO HORIZONTAL", markerShape: 'circle' },
    { id: '2', name: "ACESSO A MAQUETE", markerShape: 'square' },
    { id: '3', name: "PROGRESSAO VERTICAL", markerShape: 'x' },
    { id: '4', name: "Outros", markerShape: '+' }
];

export const AnchorDataProvider = ({ children }: { children: ReactNode }) => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allPoints, setAllPoints] = useState<AnchorPoint[]>([]);
  const [allTests, setAllTests] = useState<AnchorTest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>(defaultLocations);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [inspectionFlags, setInspectionFlags] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testPointId, setTestPointId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [installationDate, setInstallationDate] = useState<Date | undefined>(new Date());

  // Line tool state
  const [lineToolMode, setLineToolModeState] = useState(false);
  const [lineToolStartPointId, setLineToolStartPointIdState] = useState<string | null>(null);
  const [lineToolEndPointId, setLineToolEndPointIdState] = useState<string | null>(null);
  const [lineToolPreviewPoints, setLineToolPreviewPoints] = useState<{x: number, y: number}[]>([]);


  useEffect(() => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('anchorViewProjects') || '[]');
      const savedPoints = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
      const savedTests = JSON.parse(localStorage.getItem('anchorViewTests') || '[]');
      const savedUsers = JSON.parse(localStorage.getItem('anchorViewUsers') || '[]');
      const savedLocations = JSON.parse(localStorage.getItem('anchorViewLocations') || 'null');
      const savedCurrentUser = JSON.parse(localStorage.getItem('anchorViewCurrentUser') || 'null');
      const savedCurrentProject = JSON.parse(localStorage.getItem('anchorViewCurrentProject') || 'null');
      const savedShowArchived = JSON.parse(localStorage.getItem('anchorViewShowArchived') || 'false');
      
      setAllProjects(savedProjects);
      setAllPoints(savedPoints);
      setAllTests(savedTests);
      setAllUsers(savedUsers);
      setLocations(savedLocations || defaultLocations);
      
      const activeUser = savedUsers.find((u: User) => u.id === savedCurrentUser?.id) || savedUsers[0] || null;
      setCurrentUser(activeUser);
      
      if (savedCurrentProject && savedProjects.some((p: Project) => p.id === savedCurrentProject.id)) {
        setCurrentProject(savedCurrentProject);
      } else if (savedProjects.length > 0) {
        setCurrentProject(savedProjects[0]);
      } else {
        setCurrentProject(null);
      }
      setShowArchived(savedShowArchived);
    } catch (error) { console.error("Failed to load data from localStorage", error); }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if(isLoaded) {
      try {
        localStorage.setItem('anchorViewProjects', JSON.stringify(allProjects));
        localStorage.setItem('anchorViewPoints', JSON.stringify(allPoints));
        localStorage.setItem('anchorViewTests', JSON.stringify(allTests));
        localStorage.setItem('anchorViewUsers', JSON.stringify(allUsers));
        localStorage.setItem('anchorViewLocations', JSON.stringify(locations));
        localStorage.setItem('anchorViewCurrentUser', JSON.stringify(currentUser));
        localStorage.setItem('anchorViewCurrentProject', JSON.stringify(currentProject));
        localStorage.setItem('anchorViewShowArchived', JSON.stringify(showArchived));
      } catch (error) { console.error("Failed to save data to localStorage", error); }
    }
  }, [allProjects, allPoints, allTests, allUsers, locations, currentUser, currentProject, showArchived, isLoaded]);
  
  const allPointsForProject = useMemo(() => {
    if (!currentProject) return [];
    return allPoints.filter(p => p.projectId === currentProject.id);
  }, [allPoints, currentProject]);

  const projectFilteredPoints = useMemo(() => {
    return allPointsForProject.filter(p => !p.archived);
  }, [allPointsForProject]);

  const projectFilteredTests = useMemo(() => {
    const projectPointIds = new Set(projectFilteredPoints.map(p => p.id));
    return allTests.filter(t => projectPointIds.has(t.pontoId));
  }, [projectFilteredPoints, allTests]);

  const addUser = useCallback((name: string, role: 'admin' | 'user') => {
    const newUser: User = { id: Date.now().toString(), name, role };
    setAllUsers(prev => [...prev, newUser]);
    if (!currentUser) { setCurrentUser(newUser); }
  }, [currentUser]);

  const deleteUser = useCallback((id: string) => setAllUsers(prev => prev.filter(u => u.id !== id)), []);
  
  const addProject = useCallback((projectData: Omit<Project, 'id'>) => {
    const newProject: Project = { ...projectData, id: Date.now().toString(), createdByUserId: currentUser?.id };
    setAllProjects(prev => [...prev, newProject]);
    if (!currentProject) { setCurrentProject(newProject); }
  }, [currentUser, currentProject]);

  const addPoint = useCallback((pointData: Omit<AnchorPoint, 'id' | 'dataHora' | 'status' | 'createdByUserId' | 'lastModifiedByUserId' | 'archived'>) => {
    if (!currentUser) { alert("Please select a user first."); return; }
    const newPoint: AnchorPoint = {
      ...pointData,
      id: Date.now().toString(),
      dataHora: new Date().toISOString(),
      status: 'Não Testado',
      createdByUserId: currentUser.id,
      lastModifiedByUserId: currentUser.id,
      archived: false,
    };
    setAllPoints(prevPoints => [...prevPoints, newPoint]);
  }, [currentUser]);

  const editPoint = useCallback((pointId: string, updates: Partial<Omit<AnchorPoint, 'id' | 'projectId'>>) => {
      if (!currentUser) { alert("Please select a user first."); return; }
      setAllPoints(prevPoints => prevPoints.map(p => {
          if (p.id === pointId) {
              return { ...p, ...updates, lastModifiedByUserId: currentUser.id };
          }
          return p;
      }));
  }, [currentUser]);

  const addMultiplePoints = useCallback((pointsData: Omit<AnchorPoint, 'id' | 'dataHora' | 'status' | 'createdByUserId' | 'lastModifiedByUserId' | 'archived'>[]) => {
    if (!currentUser) { alert("Please select a user first."); return; }
    const newPoints = pointsData.map((pointData, index) => ({
      ...pointData,
      id: `${Date.now()}-${index}`,
      dataHora: new Date().toISOString(),
      status: 'Não Testado' as const,
      createdByUserId: currentUser.id,
      lastModifiedByUserId: currentUser.id,
      archived: false,
    }));
    setAllPoints(prev => [...prev, ...newPoints]);
  }, [currentUser]);

  const updatePointsAndAddTest = useCallback((pontoId: string, testData: Omit<AnchorTestResult, 'id' | 'dataHora' | 'pontoId' | 'createdByUserId'>, pointUpdates: Partial<AnchorPoint>) => {
     if (!currentUser) { alert("Please select a user first."); return; }
    const newTest: AnchorTest = { ...testData, id: Date.now().toString(), pontoId: pontoId, dataHora: new Date().toISOString(), createdByUserId: currentUser.id };
    setAllTests(prevTests => [...prevTests.filter(t => t.pontoId !== newTest.pontoId), newTest]);
    setAllPoints(prevPoints => prevPoints.map(p => {
        if (p.id === newTest.pontoId) {
          const hasUpdates = Object.keys(pointUpdates).length > 0;
          return { ...p, ...(hasUpdates ? pointUpdates : {}), status: newTest.resultado, lastModifiedByUserId: currentUser.id };
        }
        return p;
      })
    );
  }, [currentUser]);
  
  const addFinishedPhotoToTest = useCallback((testId: string, photoDataUrl: string) => {
    setAllTests(prevTests => prevTests.map(t => t.id === testId ? { ...t, fotoPronto: photoDataUrl, dataFotoPronto: new Date().toISOString() } : t));
  }, []);

  const deleteProject = useCallback((id: string) => {
    const pointsInProject = allPoints.filter(p => p.projectId === id).map(p => p.id);
    setAllPoints(prev => prev.filter(p => p.projectId !== id));
    setAllTests(prev => prev.filter(t => !pointsInProject.includes(t.pontoId)));
    const updatedProjects = allProjects.filter(p => p.id !== id);
    setAllProjects(updatedProjects);
    if (currentProject?.id === id) { setCurrentProject(updatedProjects.length > 0 ? updatedProjects[0] : null); }
  }, [allProjects, allPoints, currentProject?.id]);

  const deletePoint = useCallback((id: string) => {
    setAllPoints(prev => prev.map(p => p.id === id ? { ...p, archived: true, archivedAt: new Date().toISOString(), lastModifiedByUserId: currentUser?.id } : p));
  }, [currentUser]);
  
  const addLocation = useCallback((locationName: string) => {
    const newLocation: Location = { id: Date.now().toString(), name: locationName, markerShape: 'circle' };
    setLocations(prev => [...prev, newLocation]);
  }, []);

  const deleteLocation = useCallback((locationId: string) => {
    setLocations(prev => prev.filter(l => l.id !== locationId));
  }, []);
  
  const updateLocationShape = useCallback((locationId: string, shape: MarkerShape) => {
    setLocations(prev => prev.map(loc => loc.id === locationId ? { ...loc, markerShape: shape } : loc));
  }, []);

  const getProjectById = useCallback((id: string) => allProjects.find(p => p.id === id), [allProjects]);
  const getPointById = useCallback((id: string) => allPoints.find(p => p.id === id), [allPoints]);
  const getTestByPointId = useCallback((pointId: string) => allTests.filter(t => t.pontoId === pointId).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())[0], [allTests]);
  
  // Line tool functions
  const setLineToolMode = useCallback((mode: boolean) => {
    setLineToolModeState(mode);
    if (!mode) {
      setLineToolStartPointIdState(null);
      setLineToolEndPointIdState(null);
      setLineToolPreviewPoints([]);
    }
  }, []);

  const setLineToolStartPoint = useCallback((id: string) => {
    setLineToolEndPointIdState(null); // Clear end point when setting a new start point
    setLineToolStartPointIdState(id);
  }, []);

  const setLineToolEndPoint = useCallback((id: string) => {
    if (id !== lineToolStartPointId) {
      setLineToolEndPointIdState(id);
    }
  }, [lineToolStartPointId]);

  const resetLineTool = useCallback(() => {
    setLineToolStartPointIdState(null);
    setLineToolEndPointIdState(null);
    setLineToolPreviewPoints([]);
    setLineToolModeState(false);
  }, []);

  const value = useMemo(() => ({
    projects: allProjects,
    points: projectFilteredPoints,
    allPointsForProject,
    tests: projectFilteredTests,
    users: allUsers,
    currentUser,
    currentProject,
    locations,
    addProject,
    addPoint,
    editPoint,
    addMultiplePoints,
    updatePointsAndAddTest,
    addFinishedPhotoToTest,
    deleteProject,
    deletePoint,
    deleteUser,
    addLocation,
    deleteLocation,
    updateLocationShape,
    getProjectById,
    getPointById,
    getTestByPointId,
    inspectionFlags,
    setInspectionFlags,
    addUser,
    setCurrentUser,
    setCurrentProject,
    activeTab,
    setActiveTab,
    testPointId,
    setTestPointId,
    showArchived,
    setShowArchived,
    installationDate,
    setInstallationDate,
    lineToolMode,
    setLineToolMode,
    lineToolStartPointId,
    setLineToolStartPoint,
    lineToolEndPointId,
    setLineToolEndPoint,
    resetLineTool,
    lineToolPreviewPoints,
    setLineToolPreviewPoints
  }), [
    allProjects, projectFilteredPoints, allPointsForProject, projectFilteredTests, allUsers, currentUser, currentProject, locations, addProject, addPoint, editPoint, addMultiplePoints, updatePointsAndAddTest, addFinishedPhotoToTest, deleteProject, deletePoint, deleteUser, addLocation, deleteLocation, updateLocationShape, getProjectById, getPointById, getTestByPointId, inspectionFlags, addUser, setCurrentUser, setCurrentProject, activeTab, setActiveTab, testPointId, setTestPointId, showArchived, setShowArchived, installationDate, lineToolMode, setLineToolMode, lineToolStartPointId, setLineToolStartPoint, lineToolEndPointId, setLineToolEndPoint, resetLineTool, lineToolPreviewPoints
  ]);

  return (
    <AnchorDataContext.Provider value={value}>
      {children}
    </AnchorDataContext.Provider>
  );
};

export const useAnchorData = () => {
  const context = useContext(AnchorDataContext);
  if (context === undefined) { throw new Error('useAnchorData must be used within an AnchorDataProvider'); }
  return context;
};
