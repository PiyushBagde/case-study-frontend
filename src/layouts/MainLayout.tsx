// src/layouts/MainLayout.tsx
import React from 'react'; // Remove useState if not using desktopNavOpened
import { Outlet } from 'react-router-dom';
import NavbarContents from '../components/NavbarContents'; // Renamed for clarity
import { Toaster } from 'sonner';
import { AppShell, Burger, Group, Box, Text, ScrollArea } from '@mantine/core'; // Added Box
import { useDisclosure } from '@mantine/hooks';


const MainLayout: React.FC = () => {
  const [mobileNavOpened, { toggle: toggleMobileNav }] = useDisclosure(false);
  return (
    <AppShell
      header={{ height: 60 }} // Example: define header height
       navbar={{
        width: 250, // Width of the mobile drawer
        breakpoint: 'sm', // Breakpoint at which navbar becomes hidden/burger shown
        collapsed: { mobile: !mobileNavOpened, desktop: true },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Left side - can have burger for mobile + logo/title */}
          <Group>
            {/* <Burger opened={mobileNavOpened} onClick={toggleMobileNav} hiddenFrom="sm" size="sm" /> */}
            {/* <Burger opened={desktopNavOpened} onClick={toggleDesktopNav} visibleFrom="sm" size="sm" /> */}
            {/* Replace with your Logo/Title if you have one */}
            <Burger opened={mobileNavOpened} onClick={toggleMobileNav} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">Supermarket IMS</Text>

          </Group>
          <Group visibleFrom="sm">
            <NavbarContents isMobileView={false} /> {/* Pass isMobileView={false} for desktop */}
          </Group>
        </Group>
      </AppShell.Header>
      
      {/* Mobile Navigation Drawer */}
      <AppShell.Navbar p="md">
        <ScrollArea h="calc(100vh - var(--app-shell-header-height, 0px) - 2 * var(--mantine-spacing-md, 0px))">
        {/* Pass a prop to NavbarContents to render links differently for mobile, or duplicate links */}
        <NavbarContents isMobileView={true} onLinkClick={toggleMobileNav} /> {/* Pass a prop and close handler */}
        </ScrollArea>
      </AppShell.Navbar>


      <AppShell.Main>
        <Toaster richColors position="top-right" />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default MainLayout;