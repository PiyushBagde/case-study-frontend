import { Role } from "./enums";


export interface User {
    id : number;
    name : string;
    email : string;
    password: string;
    role?: Role;
}

export interface UserResponse {
    userId: number;
    name : string;
    email : string;
    role : Role;
}

export { Role };
