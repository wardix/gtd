const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    const authData = localStorage.getItem('gtd-auth')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.token || null
    }
    return null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth
  async register(email: string, password: string, name: string) {
    return this.request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async googleLogin(code: string, redirectUri: string) {
    return this.request<{ token: string; user: any }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ code, redirectUri }),
    })
  }

  async getMe() {
    return this.request<{ user: any }>('/api/auth/me')
  }

  // Inbox
  async getInbox() {
    return this.request<{ items: any[] }>('/api/inbox')
  }

  async addInboxItem(content: string) {
    return this.request<{ item: any }>('/api/inbox', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async updateInboxItem(id: string, updates: any) {
    return this.request<{ item: any }>(`/api/inbox/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteInboxItem(id: string) {
    return this.request<{ message: string }>(`/api/inbox/${id}`, {
      method: 'DELETE',
    })
  }

  // Projects
  async getProjects() {
    return this.request<{ items: any[] }>('/api/projects')
  }

  async addProject(name: string, description?: string) {
    return this.request<{ item: any }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    })
  }

  async updateProject(id: string, updates: any) {
    return this.request<{ item: any }>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteProject(id: string) {
    return this.request<{ message: string }>(`/api/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // Actions
  async getActions() {
    return this.request<{ items: any[] }>('/api/actions')
  }

  async addAction(
    content: string,
    context: string,
    projectId?: string | null,
    dueDate?: number | null,
  ) {
    return this.request<{ item: any }>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ content, context, projectId, dueDate }),
    })
  }

  async updateAction(id: string, updates: any) {
    return this.request<{ item: any }>(`/api/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteAction(id: string) {
    return this.request<{ message: string }>(`/api/actions/${id}`, {
      method: 'DELETE',
    })
  }

  // Waiting For
  async getWaitingFor() {
    return this.request<{ items: any[] }>('/api/waiting-for')
  }

  async addWaitingFor(
    content: string,
    person: string,
    projectId?: string | null,
    expectedDate?: number | null,
  ) {
    return this.request<{ item: any }>('/api/waiting-for', {
      method: 'POST',
      body: JSON.stringify({ content, person, projectId, expectedDate }),
    })
  }

  async updateWaitingFor(id: string, updates: any) {
    return this.request<{ item: any }>(`/api/waiting-for/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteWaitingFor(id: string) {
    return this.request<{ message: string }>(`/api/waiting-for/${id}`, {
      method: 'DELETE',
    })
  }

  // Someday/Maybe
  async getSomedayMaybe() {
    return this.request<{ items: any[] }>('/api/someday-maybe')
  }

  async addSomedayMaybe(content: string, category: string) {
    return this.request<{ item: any }>('/api/someday-maybe', {
      method: 'POST',
      body: JSON.stringify({ content, category }),
    })
  }

  async updateSomedayMaybe(id: string, updates: any) {
    return this.request<{ item: any }>(`/api/someday-maybe/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteSomedayMaybe(id: string) {
    return this.request<{ message: string }>(`/api/someday-maybe/${id}`, {
      method: 'DELETE',
    })
  }

  // Review
  async getReview() {
    return this.request<{ review: any }>('/api/review')
  }

  async updateReview(updates: any) {
    return this.request<{ review: any }>('/api/review', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async startReview() {
    return this.request<{ review: any }>('/api/review/start', {
      method: 'POST',
    })
  }

  async completeReviewStep(step: number) {
    return this.request<{ review: any }>(`/api/review/step/${step}`, {
      method: 'POST',
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
