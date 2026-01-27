// ✅ Fix 1: Use curly braces { } to import the named export
// ✅ Fix 2: Rename it 'as api' so you don't have to change your code below
import { apiClient as api } from "./api";

export const login = (data) => api.post("/auth/signin", data);
export const register = (data) => api.post("/auth/signup", data);
