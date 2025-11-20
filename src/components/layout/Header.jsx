import React from 'react';
import { Nav, Navbar, Container, Dropdown, Button } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';

const Header = () => {
    const { 
        user, 
        workspaces, 
        activeWorkspaceId, 
        setActiveWorkspaceId, 
        activeEnvironmentVars,
        activeEnvironmentName,
        logout 
    } = useAppContext();
    
    const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    
    // Helper to count environment variables
    const envVarCount = Object.keys(activeEnvironmentVars).length;

    return (
        <Navbar variant="dark" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid #444', padding: '0 1rem' }}>
            <Container fluid className='p-0'>
                <Navbar.Brand className='me-4 text-info fw-bold'>API Tester</Navbar.Brand>
                
                {/* Mandatory 4: Workspace Management */}
                <Dropdown className='me-3'>
                    <Dropdown.Toggle variant="secondary" id="dropdown-workspace" className='bg-dark-primary border-dark-subtle'>
                        {activeWorkspace ? activeWorkspace.name : 'No Workspace'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                        {workspaces.map(ws => (
                            <Dropdown.Item 
                                key={ws.id} 
                                onClick={() => setActiveWorkspaceId(ws.id)} 
                                active={ws.id === activeWorkspaceId}>
                                {ws.name}
                            </Dropdown.Item>
                        ))}
                        <Dropdown.Divider />
                        <Dropdown.Item>+ Create New Workspace</Dropdown.Item> {/* TODO: Add Modal */}
                    </Dropdown.Menu>
                </Dropdown>

                {/* Mandatory 5: Environment Variables */}
                <Dropdown className='me-auto'>
                    <Dropdown.Toggle variant="outline-info" id="dropdown-environment">
                        Env Vars ({envVarCount})
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                        <Dropdown.Item disabled className='text-success'>Active: {activeEnvironmentName || 'Main'}</Dropdown.Item> 
                        <Dropdown.Divider />
                        <Dropdown.Item>+ Manage Environments</Dropdown.Item> {/* TODO: Add Modal/Panel */}
                    </Dropdown.Menu>
                </Dropdown>

                {/* User and Logout */}
                <Nav>
                    <Navbar.Text className="me-3 text-muted">User: <span className="fw-bold">{user ? user.name : 'Guest'}</span></Navbar.Text>
                    <Button variant="outline-danger" onClick={logout}>Logout</Button>
                </Nav>
            </Container>
        </Navbar>
    );
};

export default Header;