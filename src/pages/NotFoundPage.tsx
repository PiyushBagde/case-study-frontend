// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// Mantine Imports
import { Container, Title, Text, Button, Center, Stack } from '@mantine/core';
import { IconError404 } from '@tabler/icons-react'; // A specific 404 icon

const NotFoundPage: React.FC = () => {
    return (
        <Container size="sm" style={{ height: '80vh' /* Ensure it takes up considerable height */ }}>
            <Center style={{ height: '100%' }}>
                <Stack align="center" gap="xl"> {/* gap="xl" for larger spacing */}
                    <IconError404 size={120} stroke={1.5} color="var(--mantine-color-gray-5)" /> {/* Large icon */}

                    <Title order={1} ta="center">
                        404 - Page Not Found
                    </Title>

                    <Text c="dimmed" size="lg" ta="center">
                        Oops! The page you are looking for doesn't exist or has been moved.
                    </Text>

                    <Button
                        component={Link}
                        to="/"
                        variant="outline"
                        size="md"
                        mt="lg" // margin-top large
                    >
                        Go Back Home
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
};

export default NotFoundPage;