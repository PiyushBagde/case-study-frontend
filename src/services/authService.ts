import apiClient from "./api";
import { LoginRequest, LoginResponse, RegisterRequest} from "../types/auth";
import { User } from "../types/user";

// login function
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
    // API Gateway route is /user/login
    const response = await apiClient.post<LoginResponse>('user/login', credentials);
    return response.data;
}

export const registerUser = async (userData: RegisterRequest): Promise<User> => {
    // api gateway route is /user/register
    // backen return the created User object
    const response = await apiClient.post<User>('/user/register', userData);
    return response.data;
}