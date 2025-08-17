// src/pages/RegisterPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
// Mantine Imports
import { Paper, Title, Text, Container, Center } from '@mantine/core';

const RegisterPage: React.FC = () => {
  return (
    <Container size={420} my={60}>
      <Center>
         <Paper withBorder shadow="md" p={30} radius="md" style={{width: '100%'}}>
             <Title ta="center" order={2} mb="lg">
                 Create Account
             </Title>
             <RegisterForm />
             <Text ta="center" mt="md">
                 Already have an account?{' '}
                 <Link to="/login" style={{ textDecoration: 'underline', fontWeight: 500 }}>
                     Login here
                 </Link>
             </Text>
         </Paper>
      </Center>
    </Container>
  );
};
export default RegisterPage;