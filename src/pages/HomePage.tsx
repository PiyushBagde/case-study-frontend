// src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // For navigation
import { useAppSelector } from '../store/hooks'; // To get user info
import { RootState } from '../store/store';

// Mantine Imports
import { Container, Title, Text, Button, Stack, Paper, Center, Group } from '@mantine/core';
import { IconShoppingCart, IconUserCircle, IconTools } from '@tabler/icons-react'; // Example icons

const HomePage: React.FC = () => {
    const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);

    return (
        <Container size="md" mt="xl" mb="xl"> {/* mt/mb for vertical margin */}
            <Paper shadow="sm" p="xl" radius="md" withBorder> {/* p for padding */}
                <Stack align="center" gap="lg"> {/* Stack for vertical arrangement, gap for spacing */}
                    <Title order={1} ta="center"> {/* ta for text-align */}
                        Welcome to Supermarket IMS!
                    </Title>

                    {isAuthenticated && user ? (
                        <Text size="lg" ta="center">
                            Hello, <Text span fw={700} inherit>{user.email}</Text>!
                            You are logged in as a <Text span tt="capitalize" fw={500} inherit>{user.role.toLowerCase()}</Text>.
                        </Text>
                    ) : (
                        <Text size="lg" ta="center">
                            Your one-stop solution for managing your supermarket needs.
                        </Text>
                    )}

                    <Text c="dimmed" ta="center"maw={500}> {/* c for color, maw for max-width */}
                        Browse products, manage your cart, view your orders, or access administrative tools if you have the right permissions.
                    </Text>

                    {/* Call to Action Buttons */}
                    <Group mt="xl" justify="center">
                        <Button
                            component={Link}
                            to="/products"
                            size="lg"
                            variant="gradient" // Example Mantine variant
                            gradient={{ from: 'blue', to: 'cyan' }}
                            leftSection={<IconShoppingCart size={20} />}
                        >
                            Browse Products
                        </Button>

                        {isAuthenticated && user?.role === 'CUSTOMER' && (
                            <Button
                                component={Link}
                                to="/my-orders"
                                variant="outline"
                                size="lg"
                                leftSection={<IconUserCircle size={20} />}
                            >
                                View My Orders
                            </Button>
                        )}
                        {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'BILLER') && (
                             <Button
                                 component={Link}
                                 to={user.role === 'ADMIN' ? "/admin/categories" : "/biller/dashboard"} // Link to relevant admin/biller page
                                 variant="light"
                                 size="lg"
                                 leftSection={<IconTools size={20} />}
                             >
                                 {user.role === 'ADMIN' ? 'Admin Panel' : 'Biller Tools'}
                             </Button>
                        )}
                    </Group>
                </Stack>
            </Paper>

            {/* You can add more sections to the homepage later */}
            {/* e.g., Featured Products, Promotions, etc. */}

        </Container>
    );
};

export default HomePage;