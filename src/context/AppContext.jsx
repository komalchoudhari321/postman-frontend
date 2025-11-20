import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import apiClient from '../utils/apiClient';

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeEnvironmentVars, setActiveEnvironmentVars] = useState({base_url: 'https://api.example.com'}); // Default mock
  const [activeEnvironmentName, setActiveEnvironmentName] = useState('Main');
  const [collections, setCollections] = useState([]);
  const [history, setHistory] = useState([]);
  const initRef = useRef(false);
  const creatingDefaultRef = useRef(false);

  const isAuthenticated = !!user || !!localStorage.getItem('token');

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveWorkspaceId(null);
    setWorkspaces([]);
    initRef.current = false;
  };

  // Refresh helpers so other components can update sidebar/header immediately
  const refreshWorkspaces = async () => {
    try {
      const wsRes = await apiClient.get('/workspaces');
      setWorkspaces(wsRes.data);
      if (!activeWorkspaceId && wsRes.data.length > 0) {
        setActiveWorkspaceId(wsRes.data[0].id);
      }
    } catch (_) { /* ignore */ }
  };

  const refreshCollections = async (wsId = activeWorkspaceId) => {
    if (!wsId) return;
    try {
      const colRes = await apiClient.get(`/collections?workspace_id=${wsId}`);
      setCollections(colRes.data);
    } catch (_) { /* ignore */ }
  };

  const refreshEnvironments = async (wsId = activeWorkspaceId) => {
    if (!wsId) return;
    try {
      const envRes = await apiClient.get(`/environments?workspace_id=${wsId}`);
      if (Array.isArray(envRes.data) && envRes.data.length > 0) {
        // Prefer the most recently updated environment
        const sorted = [...envRes.data].sort((a,b) => new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));
        setActiveEnvironmentVars(sorted[0].variables || {});
        setActiveEnvironmentName(sorted[0].name || 'Main');
      }
    } catch (_) { /* ignore */ }
  };

  const refreshHistory = async (wsId = activeWorkspaceId) => {
    if (!wsId) return;
    try {
      const histRes = await apiClient.get(`/history?workspace_id=${wsId}`);
      const normalizedHistory = (histRes.data || []).map(h => (
        h?.request ? h : {
          id: h.id,
          request: {
            method: (h.method || 'GET').toUpperCase(),
            url: h.url || '',
            headers: h.headers || [],
            body: h.body || ''
          },
          timestamp: h.executedAt || h.timestamp
        }
      ))
      setHistory(normalizedHistory);
    } catch (_) { /* ignore */ }
  };

  // Helper to load or create a workspace and then load workspace-scoped data
  const loadInitialData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const authRes = await apiClient.get('/auth/me');
      setUser(authRes.data.user);

      let wsRes = await apiClient.get('/workspaces');
      if ((!wsRes.data || wsRes.data.length === 0) && !creatingDefaultRef.current) {
        creatingDefaultRef.current = true;
        try {
          await apiClient.post('/workspaces', { name: 'Default Workspace', description: 'Auto-created workspace' });
        } finally {
          creatingDefaultRef.current = false;
        }
        wsRes = await apiClient.get('/workspaces');
      }
      setWorkspaces(wsRes.data);
      const defaultWsId = wsRes.data.length > 0 ? wsRes.data[0].id : null;
      setActiveWorkspaceId((prev) => prev ?? defaultWsId);
    } catch (error) {
      // Do not force logout here; allow app to continue with token-only auth
      // You can still send requests; user info may be unavailable temporarily
    }
  };

  // On app mount OR when user logs in (token available), load data
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadInitialData();
  }, [user]);

  // Whenever active workspace changes, load workspace-scoped data
  useEffect(() => {
    const loadWorkspaceScoped = async () => {
      if (!activeWorkspaceId) return;
      try {
        const [colRes, envRes, histRes] = await Promise.all([
          apiClient.get(`/collections?workspace_id=${activeWorkspaceId}`),
          apiClient.get(`/environments?workspace_id=${activeWorkspaceId}`),
          apiClient.get(`/history?workspace_id=${activeWorkspaceId}`),
        ]);
        setCollections(colRes.data);
        const normalizedHistory = (histRes.data || []).map(h => (
          h?.request ? h : {
            id: h.id,
            request: {
              method: (h.method || 'GET').toUpperCase(),
              url: h.url || '',
              headers: h.headers || [],
              body: h.body || ''
            },
            timestamp: h.executedAt || h.timestamp
          }
        ));
        setHistory(normalizedHistory);
        if (envRes.data.length > 0) {
          setActiveEnvironmentVars(envRes.data[0].variables);
        }
      } catch (_) {
        // ignore
      }
    };
    loadWorkspaceScoped();
  }, [activeWorkspaceId]);

  // Simplified context value
  const contextValue = {
    user, isAuthenticated, login, logout, 
    workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId,
    activeEnvironmentVars, setActiveEnvironmentVars, activeEnvironmentName, setActiveEnvironmentName,
    collections, setCollections, history, setHistory,
    refreshWorkspaces, refreshCollections, refreshEnvironments, refreshHistory
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};