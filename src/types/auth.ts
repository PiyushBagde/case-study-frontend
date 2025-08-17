export interface LoginRequest {
    email : string;
    password? :string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password?:string;
}

// response for successful login (just the token string)
export type LoginResponse = string;

export interface UserInfo {
    id: number;
    email:string;
    role:string;
}

export interface ValidationErrors {
    [key: string]: string;
}

// responses for GlobalExceptionHandler
export default interface ApiErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    service:string;
    path:string;
    errors?:ValidationErrors
}



