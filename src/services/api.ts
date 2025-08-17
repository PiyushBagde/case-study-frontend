import axios from "axios";

const API_BASE_URL = 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers:{
        'Content-Type':'application/json',
    },
});

// interceptor to add JWT token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // or use local storage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// response inteceptor for handling global errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response && error.response.status === 401) {
            // handling unauthourized access like logout user, redirect to login
            console.error("Unauthourized acess - Redirecting to login");
            localStorage.removeItem('authToken');
            
            window.location.href = '/login'; // force redirect
        }
        return Promise.reject(error);
    }
);

export default apiClient;