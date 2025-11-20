import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import apiClient from '../../utils/apiClient';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    // Note: We don't call login immediately, we redirect to login on success.

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            // Call your backend register endpoint
            await apiClient.post('/auth/register', { name, email, password });
            
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex justify-content-center align-items-center px-0" style={{ minHeight: '100vh', backgroundColor: '#202020' }}>
            <Card style={{ width: '400px', backgroundColor: '#333', color: '#fff' }}>
                <Card.Body className='p-4'>
                    <h2 className="text-center mb-4">Create Account</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicName">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control type="text" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-dark-secondary text-light border-dark-subtle"/>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-dark-secondary text-light border-dark-subtle"/>
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-dark-secondary text-light border-dark-subtle"/>
                        </Form.Group>
                        
                        <Button variant="primary" type="submit" className="w-100" disabled={isLoading} style={{ backgroundColor: '#ff6c37', borderColor: '#ff6c37' }}>
                            {isLoading ? 'Registering...' : 'Sign Up for Free'}
                        </Button>
                    </Form>
                    <p className="text-center mt-3 text-muted">
                        Already have an account? <span className='text-info' style={{cursor: 'pointer'}} onClick={() => navigate('/login')}>Sign In</span>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RegisterPage;