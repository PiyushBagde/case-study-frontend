// src/components/RegisterForm.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerUserThunk, clearRegisterStatus } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import ApiErrorResponse from '../types/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// Mantine Imports
import { TextInput, PasswordInput, Button, Group, Text, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

const getErrorMessage = (errorData: ApiErrorResponse | string | null): string | null => { /* ... same as LoginForm ... */
     if (!errorData) return null;
     if (typeof errorData === 'string') return errorData;
     let message = errorData.message || 'Registration failed.';
     if (errorData.errors) {
         message += ': ' + Object.entries(errorData.errors)
                                 .map(([field, msg]) => `${field}: ${msg}`)
                                 .join(', ');
     }
     if (errorData.status === 409 || message.toLowerCase().includes('email already in use')) { // Check for conflict
         message = "Email already in use. Please try a different email or login.";
     }
     return message;
 }


const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Optional: const [confirmPassword, setConfirmPassword] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { registerStatus, registerError } = useAppSelector((state: RootState) => state.auth);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email || !password) {
        toast.error("Please fill in all fields.");
        return;
    }
    if (password.length < 6) { // Your existing client-side validation
        toast.warning("Password must be at least 6 characters long.");
        return;
    }
    // if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    dispatch(registerUserThunk({ name, email, password }));
  };

  useEffect(() => {
      if (registerStatus === 'succeeded') {
          toast.success('Registration successful! Please login.');
          dispatch(clearRegisterStatus());
          navigate('/login');
      }
      // No toast here for registerError, handled by the Alert component below
      return () => {
           if (registerStatus !== 'idle') {
               dispatch(clearRegisterStatus());
           }
      };
  }, [registerStatus, navigate, dispatch]);

  const errorMessage = getErrorMessage(registerError);

  return (
    <form onSubmit={handleSubmit}>
        <Stack gap="md">
        <TextInput
            required
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            error={registerStatus === 'failed' && errorMessage?.toLowerCase().includes('name') ? errorMessage : null}
        />
        <TextInput
            required
            label="Email"
            placeholder="your@email.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            error={registerStatus === 'failed' && errorMessage?.toLowerCase().includes('email') ? errorMessage : null}
        />
        <PasswordInput
            required
            label="Password"
            placeholder="Your password (min. 6 characters)"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            error={registerStatus === 'failed' && errorMessage?.toLowerCase().includes('password') ? errorMessage : null}
        />
        {/* Optional: Confirm Password Field
        <PasswordInput
            required
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            error={password !== confirmPassword && confirmPassword.length > 0 ? "Passwords do not match" : null}
        />
        */}

        {registerStatus === 'failed' && errorMessage && (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Registration Failed" color="red" radius="md" withCloseButton onClose={() => dispatch(clearRegisterStatus())}>
                {errorMessage}
            </Alert>
        )}

        <Group justify="flex-end" mt="md">
            <Button type="submit" loading={registerStatus === 'loading'}>
            Register
            </Button>
        </Group>
        </Stack>
    </form>
  );
};

export default RegisterForm;