import { create } from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';

export const useComplaintStore = create((set, get) => ({
  complaints: [],
  activeComplaint: null,
  stats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Filters
  filterStatus: 'All',
  filterCategory: 'All',
  filterPriority: 'All',
  searchTerm: '',

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterCategory: (category) => set({ filterCategory: category }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setSearchTerm: (term) => set({ searchTerm: term }),

  // Student: Fetch own complaints
  fetchStudentComplaints: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filterStatus, filterCategory, filterPriority, searchTerm } = get();
      const res = await api.get('/complaints', {
        params: {
          status: filterStatus !== 'All' ? filterStatus : undefined,
          category: filterCategory !== 'All' ? filterCategory : undefined,
          priority: filterPriority !== 'All' ? filterPriority : undefined,
          search: searchTerm || undefined,
        },
      });
      set({ complaints: res.data?.data || [], isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load complaints.',
        isLoading: false,
      });
    }
  },

  // Get single complaint details
  fetchComplaintById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/complaints/${id}`);
      set({ activeComplaint: res.data?.data || null, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load complaint details.',
        isLoading: false,
      });
    }
  },

  // Student: Create complaint with attachments
  createComplaint: async (formData) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({
        complaints: [res.data.data, ...state.complaints],
        isSubmitting: false,
      }));
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint.';
      set({ error: msg, isSubmitting: false });
      return { success: false, error: msg };
    }
  },

  // Add comment / reply
  addComment: async (complaintId, message) => {
    try {
      const res = await api.post(`/complaints/${complaintId}/comments`, { message });
      set((state) => {
        if (state.activeComplaint && state.activeComplaint._id === complaintId) {
          return {
            activeComplaint: {
              ...state.activeComplaint,
              comments: [...state.activeComplaint.comments, res.data.data],
            },
          };
        }
        return state;
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to post comment.' };
    }
  },

  // Admin: Fetch all complaints with filters
  fetchAdminComplaints: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { filterStatus, filterCategory, filterPriority, searchTerm } = get();
      const res = await api.get('/complaints/admin/list', {
        params: {
          status: filterStatus !== 'All' ? filterStatus : undefined,
          category: filterCategory !== 'All' ? filterCategory : undefined,
          priority: filterPriority !== 'All' ? filterPriority : undefined,
          search: searchTerm || undefined,
          ...params,
        },
      });
      set({ complaints: res.data?.data || [], isLoading: false });
      return res.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load admin complaints.',
        isLoading: false,
      });
    }
  },

  // Admin: Fetch stats
  fetchComplaintStats: async () => {
    try {
      const res = await api.get('/complaints/admin/stats');
      set({ stats: res.data?.data || null });
    } catch (err) {
      console.error('Failed to load complaint stats:', err);
    }
  },

  // Admin: Update status & resolution
  updateComplaintStatus: async (id, status, note, resolutionNotes) => {
    try {
      const res = await api.patch(`/complaints/admin/${id}/status`, {
        status,
        note,
        resolutionNotes,
      });
      const updated = res.data?.data;
      if (updated) {
        set((state) => ({
          complaints: state.complaints.map((c) => (c._id === id ? updated : c)),
          activeComplaint:
            state.activeComplaint?._id === id ? updated : state.activeComplaint,
        }));
      }
      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update status.';
      return { success: false, error: msg };
    }
  },

  // Admin: Assign department/staff
  assignComplaint: async (id, department, staffName, notes) => {
    try {
      const res = await api.patch(`/complaints/admin/${id}/assign`, {
        department,
        staffName,
        notes,
      });
      set((state) => ({
        complaints: state.complaints.map((c) => (c._id === id ? res.data.data : c)),
        activeComplaint:
          state.activeComplaint?._id === id ? res.data.data : state.activeComplaint,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to assign complaint.' };
    }
  },

  // Admin: Update priority
  updateComplaintPriority: async (id, priority) => {
    try {
      const res = await api.patch(`/complaints/admin/${id}/priority`, { priority });
      set((state) => ({
        complaints: state.complaints.map((c) => (c._id === id ? res.data.data : c)),
        activeComplaint:
          state.activeComplaint?._id === id ? res.data.data : state.activeComplaint,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update priority.' };
    }
  },

  // Admin: Delete complaint
  deleteComplaint: async (id) => {
    try {
      await api.delete(`/complaints/admin/${id}`);
      set((state) => ({
        complaints: state.complaints.filter((c) => c._id !== id),
        activeComplaint: state.activeComplaint?._id === id ? null : state.activeComplaint,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete complaint.' };
    }
  },

  // Subscribe to live socket events
  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('complaint:updated', (updated) => {
      set((state) => ({
        complaints: state.complaints.map((c) => (c._id === updated._id ? updated : c)),
        activeComplaint:
          state.activeComplaint?._id === updated._id ? updated : state.activeComplaint,
      }));
    });

    socket.on('complaint:new', () => {
      const { fetchAdminComplaints, fetchComplaintStats } = get();
      fetchAdminComplaints();
      fetchComplaintStats();
    });
  },
}));
