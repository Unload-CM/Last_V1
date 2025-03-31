interface AdminUser {
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  createdAt: string;
}

export const setAdminUser = (user: AdminUser) => {
  localStorage.setItem('adminUser', JSON.stringify(user));
};

export const getAdminUser = (): AdminUser | null => {
  const userStr = localStorage.getItem('adminUser');
  if (!userStr) return null;
  return JSON.parse(userStr);
};

export const isAdmin = (): boolean => {
  const user = getAdminUser();
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
};

export const isSuperAdmin = (): boolean => {
  const user = getAdminUser();
  return user?.role === 'SUPER_ADMIN';
};

export const clearAdminUser = () => {
  localStorage.removeItem('adminUser');
}; 