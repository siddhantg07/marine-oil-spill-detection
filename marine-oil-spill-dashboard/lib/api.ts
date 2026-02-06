import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for Flask session cookies
    headers: {
        "Content-Type": "application/json",
    },
});

export const endpoints = {
    login: "/login",
    register: "/register",
    logout: "/logout",
    dashboard: "/dashboard", // This might need parsing since your backend returns HTML for dashboard
    scan: "/scan",
    profile: "/profile",
    history: "/history",
    notifications: "/notifications",
    markNotificationsRead: "/notifications/mark-read",
};

// Since the backend currently returns HTML for many routes (dashboard, history), 
// we might need to adjust the backend to return JSON or parse it here.
// However, for 'scan', 'login' (json supported in code), 'register' we can be more specific.

export const loginUser = async (data: any) => {
    return api.post(endpoints.login, data);
};

export const registerUser = async (data: any) => {
    // Backend expects form data for register based on the code analysis (request.form)
    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("password", data.password);
    formData.append("email", data.email);
    formData.append("full_name", data.fullName);
    return api.post(endpoints.register, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
};

export const uploadScan = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post(endpoints.scan, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const getScanHistory = async () => {
    // Current backend returns HTML for /history. 
    // We'll need to parse or update backend.
    return api.get(endpoints.history);
}

export const getDashboardData = async () => {
    return api.get(endpoints.dashboard);
}

export const getNotifications = async () => {
    return api.get(endpoints.notifications);
}

export const markNotificationsRead = async () => {
    return api.post(endpoints.markNotificationsRead);
}

export default api;
