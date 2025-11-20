import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import apiClient from '../../utils/apiClient';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Get the global login function from AppContext
    const { login } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Call your backend login endpoint
            // 🚨 ACTION: Ensure your backend endpoint is POST /auth/login
            const res = await apiClient.post('/auth/login', { email, password });
            
            // 2. Update global state with user data and token
            // Assuming your backend returns { user: {id, name, email}, token: "JWT_STRING" }
            login(res.data.user, res.data.token);
            
            // 3. Redirect to the main application area
            navigate('/workspace'); 
        } catch (err) {
            // Handle HTTP errors or network issues
            setError(err.response?.data?.message || 'Login failed. Please check your email and password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex justify-content-center align-items-center px-0" style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#202020' }}>
            <Card style={{ width: '400px', backgroundColor: '#333', color: '#fff' }}>
                <Card.Body className='p-4'>
                    <h2 className="text-center mb-4 text-light">Sign In</h2>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="Enter email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-dark-secondary text-light border-dark-subtle"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-dark-secondary text-light border-dark-subtle"
                            />
                        </Form.Group>
                        
                        <Button 
                            type="submit" 
                            className="w-100" 
                            disabled={isLoading} 
                            // Use Postman primary color
                            style={{ backgroundColor: '#ff6c37', borderColor: '#ff6c37' }}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </Form>
                    
                    <p className="text-center mt-3 text-muted">
                        Don't have an account? <span className='text-info' style={{cursor: 'pointer'}} onClick={() => navigate('/register')}>Sign Up</span>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LoginPage;