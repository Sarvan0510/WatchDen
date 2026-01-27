import api from "./api"; // Assuming this is your configured Axios instance

export const userApi = {
  // Get Profile (Public or Private)
  getProfile: async (userId) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  // Update Profile (Bio, Display Name)
  updateProfile: async (data) => {
    const response = await api.put("/api/users/me", data);
    return response.data;
  },

  // Upload Avatar (The tricky part)
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/users/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Batch Fetch (For Chat)
  getBatchUsers: async (userIds) => {
    const response = await api.post("/api/users/batch", userIds);
    return response.data;
  },
};
