import { createSlice } from '@reduxjs/toolkit';

// Retrieve credentials for each role
const getRoleSession = (role) => {
  try {
    return {
      user: JSON.parse(sessionStorage.getItem(`${role}_user`)) || null,
      token: sessionStorage.getItem(`${role}_token`) || null,
      refresh: sessionStorage.getItem(`${role}_refresh`) || null,
      isAuthenticated: !!sessionStorage.getItem(`${role}_token`)
    };
  } catch (e) {
    return { user: null, token: null, refresh: null, isAuthenticated: false };
  }
};

const customer = getRoleSession('customer');
const plot_owner = getRoleSession('plot_owner');
const organizer = getRoleSession('organizer');
const admin = getRoleSession('admin');

const activeRole = sessionStorage.getItem('active_role') || 'customer';
const activeSession = {
  customer,
  plot_owner,
  organizer,
  admin
}[activeRole] || customer;

const initialState = {
  customer,
  plot_owner,
  organizer,
  admin,
  activeRole,
  user: activeSession.user,
  token: activeSession.token,
  refresh: activeSession.refresh,
  isAuthenticated: activeSession.isAuthenticated
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setActiveRole: (state, action) => {
      const role = action.payload; // 'customer', 'plot_owner', 'organizer', 'admin'
      state.activeRole = role;
      sessionStorage.setItem('active_role', role);

      const roleSession = state[role] || { user: null, token: null, refresh: null, isAuthenticated: false };
      state.user = roleSession.user;
      state.token = roleSession.token;
      state.refresh = roleSession.refresh;
      state.isAuthenticated = roleSession.isAuthenticated;
    },
    setCredentials: (state, action) => {
      const { user, access, refresh } = action.payload;
      const role = user.role; // 'customer', 'plot_owner', 'organizer', 'admin'

      state[role] = {
        user,
        token: access,
        refresh,
        isAuthenticated: true
      };

      sessionStorage.setItem(`${role}_user`, JSON.stringify(user));
      sessionStorage.setItem(`${role}_token`, access);
      sessionStorage.setItem(`${role}_refresh`, refresh);

      // Force change activeRole to match the role of the logged in user
      state.activeRole = role;
      sessionStorage.setItem('active_role', role);

      state.user = user;
      state.token = access;
      state.refresh = refresh;
      state.isAuthenticated = true;
    },
    updateUser: (state, action) => {
      const role = state.activeRole;
      if (state[role]) {
        state[role].user = { ...state[role].user, ...action.payload };
        sessionStorage.setItem(`${role}_user`, JSON.stringify(state[role].user));
      }
      state.user = { ...state.user, ...action.payload };
    },
    setVerified: (state) => {
      const role = state.activeRole;
      if (state[role] && state[role].user) {
        state[role].user.is_email_verified = true;
        sessionStorage.setItem(`${role}_user`, JSON.stringify(state[role].user));
      }
      if (state.user) {
        state.user.is_email_verified = true;
      }
    },
    logout: (state) => {
      const role = state.activeRole;
      state[role] = {
        user: null,
        token: null,
        refresh: null,
        isAuthenticated: false
      };
      sessionStorage.removeItem(`${role}_user`);
      sessionStorage.removeItem(`${role}_token`);
      sessionStorage.removeItem(`${role}_refresh`);

      state.user = null;
      state.token = null;
      state.refresh = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setActiveRole, setCredentials, updateUser, setVerified, logout } = authSlice.actions;
export default authSlice.reducer;
