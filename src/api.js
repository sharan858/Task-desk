const BASE = '/api';

async function request(path, options = {}){
  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let data = null;
  if(text){
    try{ data = JSON.parse(text); }catch(e){ data = { raw: text }; }
  }
  if(!res.ok){
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  users: () => request('/users'),

  accounts: () => request('/accounts'),
  createAccount: (body) => request('/accounts', { method: 'POST', body }),
  getAccount: (id) => request(`/accounts/${id}`),
  updateAccount: (id, body) => request(`/accounts/${id}`, { method: 'PATCH', body }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),

  tasks: (accountId) => request(accountId ? `/tasks?accountId=${accountId}` : '/tasks'),
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PATCH', body }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' })
};
