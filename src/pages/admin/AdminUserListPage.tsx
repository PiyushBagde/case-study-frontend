// src/pages/admin/AdminUserListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { UserResponse } from '../../types/user';
import { Role } from '../../types/enums';
// import { ApiErrorResponse } from '../../types/auth'; // Not directly used here
import {
    adminGetAllUsers,
    adminUpdateUserRole,
    adminDeleteUser
} from '../../services/userService';

// Mantine Imports
import {
    Table, Button, Group, Title, Text, Modal, Select, Stack, ActionIcon, Center, Loader, Alert, Paper
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconTrash, IconAlertCircle, IconUserCog } from '@tabler/icons-react'; // IconUserCog for edit role

// Optional: Get current logged-in user's details for self-action prevention
// import { useAppSelector } from '../../store/hooks';
// import { RootState } from '../../store/store';


const AdminUserListPage: React.FC = () => {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal and Form State for Role Edit
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [userToEditRole, setUserToEditRole] = useState<UserResponse | null>(null);
    const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | ''>('');
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false); // For modal submission

    // const loggedInUser = useAppSelector((state: RootState) => state.auth.user); // Optional

    // --- Data Fetching ---
    const fetchUsers = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await adminGetAllUsers();
            setUsers(data);
        } catch (err: any) {
            let errorMsg = 'Failed to fetch users.';
            if (err.response?.status === 404 && err.response?.data?.message?.toLowerCase().includes("no users found")) {
                setUsers([]); setError(null);
            } else {
                if (err.response?.data?.message) errorMsg = err.response.data.message;
                setError(errorMsg); setUsers([]);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // --- Modal and Role Edit Handlers ---
    const handleOpenEditRoleModal = (user: UserResponse) => {
        if (user.role === Role.ADMIN) {
            toast.info("Admin roles cannot be directly changed from this interface to prevent lockouts.");
            return;
        }
        // if (loggedInUser && loggedInUser.id === user.userId) {
        //     toast.info("You cannot change your own role.");
        //     return;
        // }
        setUserToEditRole(user);
        setSelectedRoleForEdit(user.role); // Pre-fill with current role
        openModal();
    };

    const handleModalClose = () => {
        closeModal();
        setUserToEditRole(null);
        setSelectedRoleForEdit('');
        setFormSubmitting(false);
    };

    const handleRoleSelectChange = (value: string | null) => {
        if (value) {
            setSelectedRoleForEdit(value as Role);
        }
    };

    const handleSaveRoleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!userToEditRole || !selectedRoleForEdit) {
            toast.error("User or role not selected properly.");
            return;
        }
        if (selectedRoleForEdit === Role.ADMIN) {
            toast.error("Cannot assign ADMIN role using this form. This must be done via backend/DB for security.");
            return;
        }

        setFormSubmitting(true);
        try {
            await adminUpdateUserRole(userToEditRole.userId, selectedRoleForEdit);
            toast.success(`Role for ${userToEditRole.name} updated to ${selectedRoleForEdit}!`);
            handleModalClose();
            await fetchUsers(); // Refresh user list
        } catch (err: any) {
            let errorMsg = 'Failed to update role.';
            if (err.response?.data?.message) errorMsg = err.response.data.message;
            toast.error(errorMsg);
        } finally {
            setFormSubmitting(false);
        }
    };

    // --- Delete Handler ---
    const handleDeleteUser = async (user: UserResponse) => {
        if (user.role === Role.ADMIN) {
            toast.error("Admin users cannot be deleted to maintain system integrity.");
            return;
        }
        // if (loggedInUser && loggedInUser.id === user.userId) {
        //     toast.error("You cannot delete your own account.");
        //     return;
        // }
        if (window.confirm(`Delete user "${user.name}" (ID: ${user.userId})? This is permanent.`)) {
            setFormSubmitting(true); // Reuse for disabling other buttons
            try {
                await adminDeleteUser(user.userId);
                toast.success(`User "${user.name}" deleted successfully!`);
                await fetchUsers();
            } catch (err: any) {
                let errorMsg = 'Failed to delete user.';
                if (err.response?.data?.message) errorMsg = err.response.data.message;
                toast.error(errorMsg);
            } finally {
                setFormSubmitting(false);
            }
        }
    };


    // --- Render Logic ---
    if (loading) return <Center style={{ height: '200px' }}><Loader /><div>Loading Users...</div></Center>;
    if (error) return <Alert icon={<IconAlertCircle size="1rem"/>} title="Error!" color="red" mt="md">{error}</Alert>;

    // Prepare options for Role Select, excluding ADMIN
    const roleOptions = Object.values(Role)
        .filter(role => role !== Role.ADMIN) // Don't allow assigning ADMIN role via UI
        .map(role => ({ value: role, label: role }));


    const rows = users.map((user) => (
        <Table.Tr key={user.userId}>
            <Table.Td>{user.userId}</Table.Td>
            <Table.Td>{user.name}</Table.Td>
            <Table.Td>{user.email}</Table.Td>
            <Table.Td>{user.role}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleOpenEditRoleModal(user)}
                        title="Edit User Role"
                        disabled={user.role === Role.ADMIN /* || (loggedInUser && loggedInUser.id === user.userId) */}
                    >
                        <IconUserCog size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User"
                        disabled={user.role === Role.ADMIN /* || (loggedInUser && loggedInUser.id === user.userId) */}
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Manage Users</Title>
                {/* No "Add User" button here as registration is through public page */}
            </Group>

            {/* Modal for Edit User Role */}
            <Modal
                opened={modalOpened}
                onClose={handleModalClose}
                title={userToEditRole ? `Edit Role for: ${userToEditRole.name}` : "Edit User Role"}
                centered
            >
                {userToEditRole && (
                    <form onSubmit={handleSaveRoleSubmit}>
                        <Stack>
                            <Text>User: {userToEditRole.name} (ID: {userToEditRole.userId})</Text>
                            <Text>Current Role: {userToEditRole.role}</Text>
                            <Select
                                label="New Role"
                                placeholder="Select new role"
                                data={roleOptions} // Use filtered options
                                value={selectedRoleForEdit}
                                onChange={handleRoleSelectChange}
                                nothingFoundMessage="No roles available"
                                required
                            />
                            <Group justify="flex-end" mt="md">
                                <Button variant="default" onClick={handleModalClose} disabled={formSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={formSubmitting}>
                                    Update Role
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                )}
            </Modal>

            {users.length === 0 ? (
                <Text>No users found.</Text>
            ) : (
                 <Paper withBorder shadow="sm" p="md" mt="md">
                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Email</Table.Th>
                                <Table.Th>Role</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={5}><Center><Text c="dimmed">No users in system.</Text></Center></Table.Td></Table.Tr>}</Table.Tbody>
                    </Table>
                 </Paper>
            )}
        </div>
    );
};

export default AdminUserListPage;