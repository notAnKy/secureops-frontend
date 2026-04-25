import api from "./api";

// ─── Types (mirror your AuthResponse DTO) ─────────────────────────────────────
export type Role = "CLIENT" | "ADMIN" | "EMPLOYEE";

export interface AuthResponse {
  token: string;
  code: string;
  email: string;
  role: Role;
  nom: string;
  prenom: string;
  raisonSociale: string | null;
}

export interface LoginPayload {
  code: string;
  motDePasse: string;
}

export interface RegisterPayload {
  // Step 1 – Company
  raisonSociale: string;
  siret: string;
  adresseSiege: string;
  telephoneEntreprise: string;
  // Step 2 – Contact
  nom: string;
  prenom: string;
  nomContact: string;
  prenomContact: string;
  email: string;
  telephone: string;
  // Step 3 – Account
  code: string;
  motDePasse: string;
  confirmMotDePasse: string;
}

// ─── Auth Service ──────────────────────────────────────────────────────────────
export const authService = {

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    // Persist token and user info in localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    return data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  getCurrentUser(): AuthResponse | null {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  getRole(): Role | null {
    return this.getCurrentUser()?.role ?? null;
  },
};