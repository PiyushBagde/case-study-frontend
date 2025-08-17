import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loginUser, registerUser } from '../../services/authService'; // Assuming authService exports these
import ApiErrorResponse, { LoginRequest, RegisterRequest, UserInfo } from '../../types/auth'; // Ensure types are defined
import { jwtDecode } from 'jwt-decode'; // Make sure to install: npm install jwt-decode
import { User } from '../../types/user';

// Define the shape of the authentication state
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserInfo | null; // Store basic user info extracted from token
  status: 'idle' | 'loading' | 'succeeded' | 'failed'; // Status for login async operation
  error: string | null | ApiErrorResponse; // Error object/message for login
  registerStatus: 'idle' | 'loading' | 'succeeded' | 'failed'; // Status for register async operation
  registerError: string | null | ApiErrorResponse; // Error object/message for register
}

// Helper function to safely decode token and extract user info
const getUserInfoFromToken = (token: string): UserInfo | null => {
  try {
    // Define an interface for the expected decoded payload based on your JWTUtil
    interface DecodedToken {
      sub: string; // Subject (usually email/username)
      role: string;
      userId: number;
      exp: number; // Expiration time (Unix timestamp)
    }

    const decoded = jwtDecode<DecodedToken>(token);

    // Ensure required claims are present
     if (!decoded.sub || !decoded.role || !decoded.userId) {
         console.error("Token is missing required claims (sub, role, userId).");
         return null;
     }

    return {
      id: decoded.userId,
      email: decoded.sub,
      role: decoded.role
    };
  } catch (error) {
    console.error("Failed to decode token or token structure invalid:", error);
    return null;
  }
};

const initialToken = localStorage.getItem('authToken');
let initialUser: UserInfo | null = null;
let initialIsAuthenticated = false;

if(initialToken) {
  initialUser = getUserInfoFromToken(initialToken);
  if(initialUser){
    initialIsAuthenticated=true;
  }
  else{
    localStorage.removeItem('authToken');
  }
}


const initialState: AuthState = {
  isAuthenticated: initialIsAuthenticated,
  token: initialIsAuthenticated? initialToken:null,
  user: initialUser,
  status: 'idle',
  error: null,
  registerStatus: 'idle',
  registerError: null,
};


// Async Thunk for Login
export const loginUserThunk = createAsyncThunk<
  { token: string; user: UserInfo}, // Return type on success
  LoginRequest,                           // Argument type
  { rejectValue: ApiErrorResponse | string } // Return type on failure
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const token = await loginUser(credentials);
    localStorage.setItem('authToken', token);
    const user = getUserInfoFromToken(token);
    if (!user) {
      localStorage.removeItem('authToken'); // Clean up inconsistent state
      console.error("Login succeeded but failed to decode token or extract user info.");
      throw new Error("Login successful, but user details could not be retrieved from token.");
    }
    return { token, user };
  } catch (error: any) {
    localStorage.removeItem('authToken'); // Clear token on login failure
    console.error("Login error:", error);
    if (error.response && error.response.data) {
      // Assuming backend sends ApiErrorResponse structure
      return rejectWithValue(error.response.data as ApiErrorResponse);
    }
    return rejectWithValue(error.message || 'Login failed due to an unknown error.');
  }
});

// Async Thunk for Registration
export const registerUserThunk = createAsyncThunk<
    User, // Return type on success (or the created User object if needed)
    RegisterRequest,                     // Argument type
    { rejectValue: ApiErrorResponse | string } // Return type on failure
>('auth/register', async (userData, { rejectWithValue }) => {
    try {
      const createdUser = await registerUser(userData); // Calls the API service
      return createdUser; 
    } catch (error: any) {
        console.error("Registration error:", error);
        // Pass backend error structure if available, otherwise pass message
        if (error.response && error.response.data) {
            return rejectWithValue(error.response.data as ApiErrorResponse);
        }
        return rejectWithValue(error.message || 'Registration failed due to an unknown error.');
    }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  // Synchronous reducers
  reducers: {
    // Logout Action
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.status = 'idle'; // Reset login status
      state.error = null;    // Reset login error
      state.registerStatus = 'idle'; // Also reset registration status/error on logout
      state.registerError = null;
      localStorage.removeItem('authToken'); // Remove token from storage
      console.log("User logged out via action, state cleared.");
    },
    // Action to clear registration status/error manually if needed (e.g., after showing msg)
    clearRegisterStatus: (state) => {
        state.registerStatus = 'idle';
        state.registerError = null;
    }
    
  },
  // Handle async thunk actions
  extraReducers: (builder) => {
    builder
      // Login lifecycle
      .addCase(loginUserThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous errors on new attempt
      })
      .addCase(loginUserThunk.fulfilled, (state, action: PayloadAction<{ token: string; user: UserInfo }>) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user; // action.payload.user is now guaranteed 
        state.error = null;
    })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload ?? 'Unknown login error'; // Use payload or default
      })
      // Register lifecycle
      .addCase(registerUserThunk.pending, (state) => {
          state.registerStatus = 'loading';
          state.registerError = null; // Clear previous errors
      })
      .addCase(registerUserThunk.fulfilled, (state /*, action: PayloadAction<User> */) => {
          state.registerStatus = 'succeeded';
          state.registerError = null;
          console.log("Registration successful in slice.");
          // The component handling this might navigate to login or show a message.
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
          state.registerStatus = 'failed';
          state.registerError = action.payload ?? 'Unknown registration error';
      });
  },
});

// Export actions
export const { logout, clearRegisterStatus } = authSlice.actions;

// Export reducer
export default authSlice.reducer;