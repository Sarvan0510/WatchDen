import api from "./api";

export const userApi = {
  getProfile: async (userId) => {
    // GET /api/users/{userId}
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (data) => {
    // PUT /api/users/me (Gateway adds X-USER-ID)
    const response = await api.put("/users/me", data);
    return response.data;
  },

  // Matches @PostMapping("/batch")
  getBatchUsers: async (userIdList) => {
    const response = await api.post("/users/batch", userIdList);
    return response.data;
  },

  // Matches @PostMapping("/upload-avatar")
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/users/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Critical for file upload
      },
    });
    return response.data;
  },
};
