// src/components/LoginForm.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUserThunk } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import { toast } from 'sonner';
// Mantine Imports
import { TextInput, PasswordInput, Button, Group, Text, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react'; // Optional: for error icon
import ApiErrorResponse from '../types/auth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
        toast.error("Please enter both email and password.");
        return;
    }
    dispatch(loginUserThunk({ email, password }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Updated error message handling
  const getErrorMessage = (errorData: ApiErrorResponse | string | null): string | null => {
     if (!errorData) return null;
     if (typeof errorData === 'string') return errorData;
     let message = errorData.message || 'Login failed. Please check your credentials.';
     // You could extract validation errors from errorData.errors if your login endpoint returns them
     return message;
  }
  const errorMessage = getErrorMessage(error);

  return (
    // Use Mantine Stack for vertical spacing
     <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          required
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          error={status === 'failed' && error && email.length > 0 && (errorMessage?.toLowerCase().includes('email') || errorMessage?.toLowerCase().includes('credentials')) ? errorMessage : null}
          // Display general error if not specific to email field, but only if submission failed
        />
        <PasswordInput
          required
          label="Password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          error={status === 'failed' && error && password.length > 0 && (errorMessage?.toLowerCase().includes('password') || errorMessage?.toLowerCase().includes('credentials')) ? errorMessage : null}
        />

        {/* Display general errors not tied to a field */}
        {status === 'failed' && error && !(errorMessage?.toLowerCase().includes('email') || errorMessage?.toLowerCase().includes('password')) && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Login Failed" color="red" radius="md" withCloseButton onClose={() => dispatch(/* action to clear error? */)}>
              {errorMessage}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={status === 'loading'}>
            Login
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default LoginForm;