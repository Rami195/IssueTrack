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
  totalProjects: 0,
  totalTickets: 0,
  tickets: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  getToken: () => get().token || localStorage.getItem("ih_token"),

  // búsqueda global (dashboard, projects, tickets)
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  setView: (view) => set({ currentView: view, error: null }),

  initAuth: () => {
    const token = localStorage.getItem("ih_token");
    if (token) {
      set({ token });
      get().fetchMe().then(() => {
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
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {

        if (res.status === 429) {
          const message =
            data.detail ||
            "Demasiados intentos de inicio de sesión. Esperá un minuto e intentá de nuevo.";

          set({ error: { detail: message } });
          throw new Error(message);
        }


        const message = data.detail || "Usuario o contraseña incorrectos.";
        set({ error: { detail: message } });
        throw new Error(message);
      }


      const token = data.access_token;



      set({ token, error: null });

      await get().fetchMe();
      await Promise.all([get().fetchProjects(), get().fetchTickets()]);
    } catch (err) {
      // fallback (por si algo raro pasa)
      if (!get().error) {
        set({
          error: { detail: err.message || "Error inesperado al iniciar sesión." },
        });
      }
      throw err;
    } finally {
      set({ authLoading: false });
    }
  },
  refreshAccessToken: async () => {
    const res = await fetch(`${API_URL}/token/refresh`, {
      method: "POST",
      credentials: "include", // ✅ manda cookie ih_refresh al backend
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      get().logout();
      throw new Error(data.detail || "Sesión expirada. Iniciá sesión de nuevo.");
    }

    const newAccess = data.access_token;
    localStorage.setItem("ih_token", newAccess);
    set({ token: newAccess, error: null });

    return newAccess;
  },

  authFetch: async (url, options = {}) => {
    const token = get().getToken();

    const doFetch = (t) =>
      fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${t}`,
        },
      });

    // 1er intento
    let res = await doFetch(token);

    // Si token expiró -> refresh y reintentar 1 vez
    if (res.status === 401) {
      const newToken = await get().refreshAccessToken();
      res = await doFetch(newToken);
    }

    return res;
  },

  fetchMe: async () => {

    const res = await get().authFetch(`${API_URL}/users/me`);

    if (!res.ok) throw new Error("No se pudo obtener el usuario actual");

    const user = await res.json();
    set({
      user,
      userName: user.full_name || user.username,
    });
  },

  logout: async () => {
    localStorage.removeItem("ih_token");
    try {
      await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
    } catch (err) {
      console.warn("Logout backend falló:", err);
    }
    set({
      token: null,
      user: null,
      userName: "",
      projects: [],
      tickets: [],
      refreshToken: null,
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

  fetchProjects: async (params = {}) => {
    const {
      page = 0,
      limit = 10,
      search = "",
      sortField = "id",
      sortDirection = "asc",
    } = params;

    set({ loading: true, error: null });

    try {
      const url = new URL(`${API_URL}/projects`);

      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("sort_field", sortField);
      url.searchParams.set("sort_direction", sortDirection);



      // sólo mandamos search si tiene algo
      if (search && search.trim() !== "") {
        url.searchParams.set("search", search.trim());
      }

      const res = await get().authFetch(url.toString());

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Error al obtener proyectos");
      set({
        projects: data.items || [],
        totalProjects: data.total ?? 0,
        error: null,
      });

      return data;
    } catch (err) {
      set({ error: err.message || "Error al cargar proyectos" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },


  createProject: async (payload) => {
  try {
    const res = await get().authFetch(`${API_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.detail || "Error al crear proyecto");
    }

    // Opción A (simple): recargar lista actual
    const { searchQuery } = get();
    await get().fetchProjects({
      page: 0,
      limit: 10,
      search: searchQuery ?? "",
      sortField: "id",
      sortDirection: "asc",
    });

    return data;
  } catch (err) {
    set({ error: err?.message || "Error al crear proyecto" });
    throw err;
  }
},


 updateProject: async (id, payload) => {
  try {
    const res = await get().authFetch(`${API_URL}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.detail || "Error al actualizar proyecto");
    }

    // actualizar en memoria (optimista)
    set({
      projects: get().projects.map((p) => (p.id === id ? data : p)),
      error: null,
    });

    return data;
  } catch (err) {
    set({ error: err?.message || "Error al actualizar proyecto" });
    throw err;
  }
},

  deleteProject: async (id) => {
    try {
      const res = await get().authFetch(`${API_URL}/projects/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.detail || "Error al eliminar proyecto");

      set({ projects: get().projects.filter((p) => p.id !== id), error: null });
    } catch (err) {
      set({ error: err?.message || "Error al eliminar proyecto" });
      throw err;
    }
  },


  // --------- Tickets ---------

  fetchTickets: async (params = {}) => {
    const {
      page = 0,
      limit = 10,
      search = "",
      sortField = "id",
      sortDirection = "asc",
      status = "",
      priority = "",
      projectId = "",
    } = params;

    set({ loading: true, error: null });

    try {
      const url = new URL(`${API_URL}/tickets`);

      // paginación y orden
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("sort_field", sortField);
      url.searchParams.set("sort_direction", sortDirection);

      // filtros opcionales
      if (search && search.trim() !== "") {
        url.searchParams.set("search", search.trim());
      }

      if (status && status !== "all") {
        url.searchParams.set("status", status);
      }

      if (priority && priority !== "all") {
        url.searchParams.set("priority", priority);
      }

      if (projectId) {
        url.searchParams.set("project_id", String(projectId));
      }


      const res = await get().authFetch(url.toString());

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {

        throw new Error(data.detail || "Error al obtener tickets");
      }

      set({
        tickets: data.items || [],
        totalTickets: data.total ?? 0,
        error: null,
      });

      return data;
    } catch (err) {
      set({ error: err?.message || "Error al cargar tickets" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },



  createTicket: async (payload) => {
    try {
      const res = await get().authFetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Error al crear ticket");
      }

      await get().fetchTickets({ page: 0, limit: 10, sortField: "id", sortDirection: "desc" });

      return data;
    } catch (err) {
      set({ error: err.message || "Error al crear ticket" });
      throw err;
    }
  },

 updateTicket: async (id, payload) => {
  try {
    const res = await get().authFetch(`${API_URL}/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.detail || "Error al actualizar ticket");
    }

    // actualizar en memoria
    set({
      tickets: get().tickets.map((t) => (t.id === id ? data : t)),
      error: null,
    });

    return data;
  } catch (err) {
    set({ error: err?.message || "Error al actualizar ticket" });
    throw err;
  }
},


  deleteTicket: async (id) => {
    try {
      const res = await get().authFetch(`${API_URL}/tickets/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.detail || "Error al eliminar ticket");

      set({ tickets: get().tickets.filter((t) => t.id !== id), error: null });
    } catch (err) {
      set({ error: err?.message || "Error al eliminar ticket" });
      throw err;
    }
  },
}));

export default useAppStore;
