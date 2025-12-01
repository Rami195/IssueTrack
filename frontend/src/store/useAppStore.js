// src/store/useAppStore.js
import { create } from "zustand";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const useAppStore = create((set, get) => ({
  // ---- Auth ----
  token: null,
  user: null,
  userName: "",
  authLoading: false,

  // ---- App ----
  currentView: "dashboard",
  projects: [],
  tickets: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
  
  // búsqueda global (dashboard, projects, tickets)
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  setView: (view) => set({ currentView: view, error: null }),

  initAuth: () => {
    const token = localStorage.getItem("ih_token");
    if (token) {
      set({ token });
      get()
        .fetchMe()
        .then(() => {
          return Promise.all([get().fetchProjects(), get().fetchTickets()]);
        })
        .catch(() => {
          localStorage.removeItem("ih_token");
          set({ token: null, user: null, userName: "" });
        });
    }
  },

  // --------- Auth actions ---------

  // REGISTRO DE USUARIO
  register: async (payload) => {
    set({ authLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // guardamos el JSON del backend para que AuthView pueda leer detail
        set({ error: data || { detail: "Error al registrarse" } });
        throw data;
      }

      // registro ok, no hacemos login automático
      set({ error: null });
      return data;
    } catch (err) {
      // si por alguna razón no se seteo error arriba, lo guardamos acá
      if (!get().error) {
        set({ error: err });
      }
      throw err;
    } finally {
      set({ authLoading: false });
    }
  },

  // LOGIN
  login: async ({ username, password }) => {
    set({ authLoading: true, error: null });
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        set({ error: data || { detail: "Error al iniciar sesión" } });
        throw data;
      }

      const token = data.access_token;
      localStorage.setItem("ih_token", token);
      set({ token, error: null });

      await get().fetchMe();
      await Promise.all([get().fetchProjects(), get().fetchTickets()]);
    } catch (err) {
      if (!get().error) {
        set({ error: err });
      }
      throw err;
    } finally {
      set({ authLoading: false });
    }
  },

  fetchMe: async () => {
    const { token } = get();
    if (!token) return;

    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("No se pudo obtener el usuario actual");

    const user = await res.json();
    set({
      user,
      userName: user.full_name || user.username,
    });
  },

  logout: () => {
    localStorage.removeItem("ih_token");
    set({
      token: null,
      user: null,
      userName: "",
      projects: [],
      tickets: [],
    });
  },

  updateUser: async (data) => {
    const { token, user } = get();
    if (!token) throw new Error("No autenticado");

    const res = await fetch(`${API_URL}/users/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      set({ error: json || { detail: "Error al actualizar usuario" } });
      throw json;
    }

    const updatedUser = {
      ...user,
      ...(data.username ? { username: data.username } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.full_name ? { full_name: data.full_name } : {}),
    };

    set({
      user: updatedUser,
      userName:
        updatedUser.full_name ||
        updatedUser.username ||
        user.full_name ||
        user.username,
      error: null,
    });

    return json;
  },

  // --------- Projects ---------

  fetchProjects: async () => {
    const { token } = get();
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          get().logout();
          throw new Error("No autorizado");
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al obtener proyectos");
      }
      const data = await res.json();
      set({ projects: data });
    } catch (err) {
      set({ error: err.message || "Error al cargar proyectos" });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (payload) => {
    const { token, projects } = get();
    if (!token) throw new Error("No autenticado");

    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al crear proyecto");
      }

      const created = await res.json();
      set({ projects: [...projects, created] });
      return created;
    } catch (err) {
      set({ error: err.message || "Error al crear proyecto" });
      throw err;
    }
  },

  updateProject: async (id, payload) => {
    const { token, projects } = get();
    if (!token) throw new Error("No autenticado");

    try {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al actualizar proyecto");
      }

      const updated = await res.json();
      set({
        projects: projects.map((p) => (p.id === id ? updated : p)),
      });
      return updated;
    } catch (err) {
      set({ error: err.message || "Error al actualizar proyecto" });
      throw err;
    }
  },

  deleteProject: async (id) => {
    const { token, projects } = get();
    if (!token) throw new Error("No autenticado");

    try {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al eliminar proyecto");
      }

      set({
        projects: projects.filter((p) => p.id !== id),
      });
    } catch (err) {
      set({ error: err.message || "Error al eliminar proyecto" });
      throw err;
    }
  },

  // --------- Tickets ---------

  fetchTickets: async () => {
    const { token } = get();
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          get().logout();
          throw new Error("No autorizado");
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al obtener tickets");
      }
      const data = await res.json();
      set({ tickets: data });
    } catch (err) {
      set({ error: err.message || "Error al cargar tickets" });
    } finally {
      set({ loading: false });
    }
  },

  createTicket: async (payload) => {
    const { token, tickets } = get();
    if (!token) throw new Error("No autenticado");

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al crear ticket");
      }

      const created = await res.json();
      set({ tickets: [...tickets, created] });
      return created;
    } catch (err) {
      set({ error: err.message || "Error al crear ticket" });
      throw err;
    }
  },

  updateTicket: async (id, payload) => {
    const { token, tickets } = get();
    if (!token) throw new Error("No autenticado");

    try {
      const res = await fetch(`${API_URL}/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al actualizar ticket");
      }

      const updated = await res.json();
      set({
        tickets: tickets.map((t) => (t.id === id ? updated : t)),
      });
      return updated;
    } catch (err) {
      set({ error: err.message || "Error al actualizar ticket" });
      throw err;
    }
  },

  deleteTicket: async (id) => {
    const { token, tickets } = get();
    if (!token) throw new Error("No autenticado");

    try {
      const res = await fetch(`${API_URL}/tickets/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al eliminar ticket");
      }

      set({
        tickets: tickets.filter((t) => t.id !== id),
      });
    } catch (err) {
      set({ error: err.message || "Error al eliminar ticket" });
      throw err;
    }
  },
}));

export default useAppStore;
