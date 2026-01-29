import api from "./api";

export const userApi = {
  getProfile: async (userId) => {
    // GET /api/users/{userId}
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (data) => {
    // 🟢 Retrieve and parse the user object first
    const userString = sessionStorage.getItem("user");
    const currentUser = userString ? JSON.parse(userString) : null;

    if (!currentUser || !currentUser.id) {
      throw new Error("User session not found. Please log in again.");
    }

    const response = await api.put("/users/me", data, {
      headers: {
        "X-User-Id": currentUser.id, // 🟢 Use the parsed variable name correctly
      },
    });
    return response.data;
  },

  getUsersBatch: async (userIds) => {
    const response = await api.post("/users/batch", userIds);
    return response.data;
  },

  // Matches @PostMapping("/upload-avatar")
  uploadAvatar: async (file) => {
    const userString = sessionStorage.getItem("user");
    const currentUser = userString ? JSON.parse(userString) : null;

    if (!currentUser || !currentUser.id) {
      throw new Error("User session not found. Please log in again.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/users/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Critical for file upload
        "X-User-Id": currentUser.id,
      },
    });
    return response.data;
  },
};
