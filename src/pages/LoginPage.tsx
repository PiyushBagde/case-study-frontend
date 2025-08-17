// src/pages/LoginPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
// Mantine Imports
import { Paper, Title, Text, Container, Center } from '@mantine/core';

const LoginPage: React.FC = () => {
  return (
    <Container size={420} my={60}> {/* my is margin top/bottom */}
      <Center>
         <Paper withBorder shadow="md" p={30} radius="md" style={{width: '100%'}}>
             <Title ta="center" order={2} mb="lg"> {/* ta is text-align, mb is margin-bottom */}
                 Login
             </Title>
             <LoginForm />
             <Text ta="center" mt="md"> {/* mt is margin-top */}
                 Don't have an account?{' '}
                 <Link to="/register" style={{ textDecoration: 'underline', fontWeight: 500 }}>
                     Register here
                 </Link>
             </Text>
         </Paper>
      </Center>
    </Container>
  );
};
export default LoginPage;