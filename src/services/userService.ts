import { Role, UserResponse } from '../types/user';
import apiClient from './api';


export const adminGetAllUsers = async (): Promise<UserResponse[]> => {
    // Endpoint from UserController
    const response = await apiClient.get<UserResponse[]>('/user/admin/getAllUsers');
    return response.data;
};


//  Updates a user's role (Admin).
export const adminUpdateUserRole = async (userId: number, newRole: Role): Promise<UserResponse> => {
     // Endpoint from UserController takes role as RequestParam
     const response = await apiClient.put<UserResponse>(
         `/user/admin/updateRole/${userId}`,
         null, 
         { params: { newRole } } 
     );
     return response.data;
};


// Deletes a user (Admin).
export const adminDeleteUser = async (userId: number): Promise<string> => {
     // Endpoint from UserController
    const response = await apiClient.delete<string>(`/user/admin/deleteUser/${userId}`);
    return response.data; // Expecting string confirmation
};

// Get single user details 
export const adminGetUserById = async (userId: number): Promise<UserResponse> => {
     const response = await apiClient.get<UserResponse>(`/user/admin/getUser/${userId}`);
     return response.data;
}


export const findUserByEmail = async (email: string): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(
        '/user/biller/findUserByEmail',
        { params: { email } } 
    );
    return response.data;
};
