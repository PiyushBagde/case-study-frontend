// src/pages/biller/BillerDashboardPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserResponse } from '../../types/user';
// import { ApiErrorResponse } from '../../types/auth'; // Not directly used if toast handles error string
import { findUserByEmail } from '../../services/userService';

// Mantine Imports
import {
    Container, Title, Text, TextInput, Button, Group, Stack, Paper, Alert, Center, Loader, Avatar
} from '@mantine/core';
import { IconSearch, IconUserCircle, IconShoppingCart, IconAlertCircle, IconListDetails } from '@tabler/icons-react';

const BillerDashboardPage: React.FC = () => {
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [foundUser, setFoundUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false); // For search action
    const [searchError, setSearchError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!searchEmail.trim()) {
            toast.warning("Please enter an email address to search.");
            return;
        }
        setIsLoading(true);
        setSearchError(null);
        setFoundUser(null); // Clear previous result
        try {
            const user = await findUserByEmail(searchEmail.trim());
            setFoundUser(user);
            toast.success(`User ${user.email} found.`);
        } catch (err: any) {
            console.error("Error searching for user:", err);
            let errorMsg = 'Failed to find user.';
             if (err.response?.status === 404) {
                 errorMsg = `User with email "${searchEmail.trim()}" not found.`;
             } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.message) {
                errorMsg = err.message;
            }
            setSearchError(errorMsg); // Set error for inline display
            // toast.error(errorMsg); // Toast is also good, but inline can be persistent
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewCartClick = (userId: number) => {
        navigate(`/biller/view-cart/${userId}`);
    };

    const handleViewOrdersClick = (userId: number) => {
        // We'll need a new route and page for this: e.g., /biller/user-orders/:userId
        toast.info(`Navigate to view orders for user ${userId} (Not Implemented Yet)`);
        // navigate(`/biller/user-orders/${userId}`);
    };


    return (
        <Container size="md" my="xl">
            <Title order={2} ta="center" mb="xl">
                Biller Tools - Customer Lookup
            </Title>

            <Paper component="form" onSubmit={handleSearchSubmit} shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Stack>
                    <TextInput
                        label="Find Customer by Email"
                        placeholder="customer@example.com"
                        type="email"
                        value={searchEmail}
                        onChange={e => setSearchEmail(e.currentTarget.value)}
                        required
                        rightSection={isLoading ? <Loader size="xs" /> : <IconSearch size={18} />}
                    />
                    <Button type="submit" loading={isLoading} fullWidth mt="xs">
                        Search Customer
                    </Button>
                    {searchError && !isLoading && (
                         <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Search Error" radius="xs" mt="sm">
                             {searchError}
                         </Alert>
                    )}
                </Stack>
            </Paper>


            {foundUser && (
                <Paper shadow="sm" p="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Customer Details</Title>
                    <Stack gap="sm">
                        <Group>
                            <Avatar color="blue" radius="xl">{foundUser.name.substring(0,1).toUpperCase()}</Avatar>
                            <div>
                                <Text fw={500}>{foundUser.name}</Text>
                                <Text size="xs" c="dimmed">{foundUser.email}</Text>
                            </div>
                        </Group>
                        <Text><strong>ID:</strong> {foundUser.userId}</Text>
                        <Text><strong>Role:</strong> <Text span tt="capitalize" fw={500}>{foundUser.role.toLowerCase()}</Text></Text>

                        <Group mt="md">
                            <Button
                                onClick={() => handleViewCartClick(foundUser.userId)}
                                leftSection={<IconShoppingCart size={16} />}
                                variant="outline"
                            >
                                View/Manage Cart
                            </Button>
                            {/* <Button
                                onClick={() => handleViewOrdersClick(foundUser.userId)}
                                leftSection={<IconListDetails size={16} />}
                                variant="light"
                                color="gray"
                            >
                                View Orders
                            </Button> */}
                        </Group>
                    </Stack>
                </Paper>
            )}
        </Container>
    );
};

export default BillerDashboardPage;