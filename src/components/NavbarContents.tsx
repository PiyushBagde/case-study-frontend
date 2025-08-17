// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import { Role } from '../types/enums';

// Mantine Imports
import { Group, Button, Text, Menu, Avatar, UnstyledButton, Stack, Divider } from '@mantine/core';
// Optional icons
import {
    IconShoppingCart,
    IconUser,
    IconCategory,
    IconBuildingStore,
    IconReportMoney,
    IconUsers,
    IconLogout,
    IconLogin,
    IconUserPlus,
    IconHome,
    IconReceipt,
    IconSettings
} from '@tabler/icons-react';


interface NavbarContentsProps {
    isMobileView?: boolean; // Is this rendering in the mobile drawer?
    onLinkClick?: () => void; // Optional: callback to close mobile nav after click
}

const NavbarContents: React.FC<NavbarContentsProps> = ({ isMobileView = false, onLinkClick }) => {
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);
  const cartItems = useAppSelector((state: RootState) => state.cart.cart?.items);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const itemCount = cartItems ? cartItems.length : 0;

  const handleLogout = () => {
    if (onLinkClick) onLinkClick(); // Close mobile nav if open
    dispatch(logout());
    navigate('/login');
  };

  const handleLinkClick = (path?: string) => {
        if (onLinkClick) {
            onLinkClick(); // Close mobile nav if a link inside it is clicked
        }
        if (path) {
            navigate(path); // For Menu.Item if 'component={Link}' doesn't work with onLinkClick
        }
    };

  // Create styled link component for Mantine, adapting for mobile
  const NavLink = ({ to, children, icon }: { to: string, children: React.ReactNode, icon?: React.ReactNode }) => (
        <UnstyledButton
            component={Link}
            to={to}
            onClick={() => handleLinkClick()} // Close mobile nav
            py={isMobileView ? "sm" : "xs"} // More vertical padding for mobile links
            px="sm"
            style={{ display: isMobileView ? 'block' : 'inline-block', width: isMobileView ? '100%' : 'auto' }}
        >
            <Group gap="xs" wrap="nowrap"> {/* wrap="nowrap" to keep icon and text together */}
                {icon}
                <Text size="sm">{children}</Text>
            </Group>
        </UnstyledButton>
    );

    const renderAdminMenu = () => {
        const adminLinks = [
            { to: "/admin/categories", label: "Manage Categories", icon: <IconCategory size={isMobileView ? 18: 14} /> },
            { to: "/admin/products", label: "Manage Products", icon: <IconBuildingStore size={isMobileView ? 18: 14} /> },
            { to: "/admin/users", label: "Manage Users", icon: <IconUsers size={isMobileView ? 18: 14} /> },
        ];

        if (isMobileView) {
            return (
                <>
                    <Divider my="xs" label="Admin Tools" labelPosition="center" />
                    {adminLinks.map(link => (
                        <NavLink key={link.to} to={link.to} icon={link.icon}>{link.label}</NavLink>
                    ))}
                </>
            );
        }
        return (
            <Menu shadow="md" width={200}>
                <Menu.Target>
                    <Button variant="subtle" size="sm" leftSection={<IconSettings size={16}/>}>Admin</Button>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Management</Menu.Label>
                    {adminLinks.map(link => (
                        <Menu.Item key={link.to} component={Link} to={link.to} onClick={() => handleLinkClick()} leftSection={link.icon}>
                            {link.label}
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>
        );
    };

    // Main wrapper: Stack for mobile (vertical), Group for desktop (horizontal)
    const WrapperComponent = isMobileView ? Stack : Group;

    return (
        <WrapperComponent gap={isMobileView ? "xs" : "sm"} justify={isMobileView ? "flex-start" : "flex-end"} style={{width: isMobileView? '100%' : 'auto'}}>
            {/* Core Navigation Links */}
            {isAuthenticated && <NavLink to="/" icon={isMobileView ? <IconHome size={18}/> : undefined}>Home</NavLink>}
            {isAuthenticated && <NavLink to="/products" icon={isMobileView ? <IconBuildingStore size={18}/> : undefined}>Products</NavLink>}

            {/* Customer Specific Links */}
            {isAuthenticated && user?.role === Role.CUSTOMER && (
                <>
                    <NavLink to="/my-orders" icon={isMobileView ? <IconReceipt size={18}/> : undefined}>My Orders</NavLink>
                    <NavLink to="/cart" icon={isMobileView ? <IconShoppingCart size={18}/> : undefined}>
                        Cart {itemCount > 0 && `(${itemCount})`}
                    </NavLink>
                </>
            )}

            {/* Biller Specific Links */}
            {isAuthenticated && user?.role === Role.BILLER && (
                <NavLink to="/biller/dashboard" icon={isMobileView ? <IconReportMoney size={18}/> : undefined}>Biller Tools</NavLink>
            )}

            {/* Admin Menu/Links */}
            {isAuthenticated && user?.role === Role.ADMIN && renderAdminMenu()}


            {/* Auth Actions Separator for Mobile */}
            {isMobileView && isAuthenticated && <Divider my="sm" />}

            {/* Auth Actions */}
            {isAuthenticated ? (
                <Menu shadow="md" width={200} position={isMobileView ? "bottom-start" : "bottom-end"}>
                    <Menu.Target>
                        <UnstyledButton p={isMobileView ? "sm": "xs"} style={isMobileView ? {width: '100%'} : {}}>
                            <Group gap="xs" wrap="nowrap">
                                <Avatar color="blue" radius="xl" size="sm">
                                    {user?.email ? user.email.substring(0, 1).toUpperCase() : <IconUser size={16}/>}
                                </Avatar>
                                {!isMobileView && <Text size="sm" fw={500}>{user?.email}</Text>}
                                {isMobileView && <Text size="sm" fw={500}>{user?.email || 'My Account'}</Text>}
                            </Group>
                        </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Account ({user?.role})</Menu.Label>
                        <Menu.Divider />
                        <Menu.Item color="red" onClick={handleLogout} leftSection={<IconLogout size={14} />}>
                            Logout
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            ) : (
                 isMobileView ? (
                    <Stack gap="xs" mt="md">
                        <Button component={Link} to="/login" variant="default" onClick={() => handleLinkClick()} fullWidth leftSection={<IconLogin size={16}/>}>Login</Button>
                        <Button component={Link} to="/register" onClick={() => handleLinkClick()} fullWidth leftSection={<IconUserPlus size={16}/>}>Register</Button>
                    </Stack>
                 ) : ( // Desktop Login/Register buttons
                    <Group>
                        <Button component={Link} to="/login" variant="default" size="sm">Login</Button>
                        <Button component={Link} to="/register" size="sm">Register</Button>
                    </Group>
                 )
            )}
        </WrapperComponent>
    );
};

export default NavbarContents;