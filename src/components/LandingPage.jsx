import React from 'react';
import { Container, Row, Col, Button, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaWindows } from "react-icons/fa";
import { FaApple } from "react-icons/fa";
import { FaLinux } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();

  // Custom styles for the Postman look
  const orangeGradient = {
    background: 'linear-gradient(to right, #ff6c37, #ff9b66)',
  };
  const darkBanner = {
    backgroundColor: '#cc542e',
  };
  const primaryButton = {
    backgroundColor: '#ff6c37',
    borderColor: '#ff6c37',
  };

  return (
    <div className="bg-white text-black" style={{ minHeight: '100vh' }}>
      {/* 1. Top Header/Nav Bar */}
      <Nav className="py-2 px-4 d-flex justify-content-between align-items-center" style={orangeGradient}>
        <div className="d-flex align-items-center">
            <h4 className="text-white mb-0 me-4">API Tester Clone</h4> 
            {['Product', 'Solutions', 'Pricing', 'Enterprise'].map(link => (
                <Nav.Link key={link} href="#" className="text-white me-3">{link}</Nav.Link>
            ))}
        </div>
        <div>
          <Button variant="outline-light" className="me-2">Contact Sales</Button>
          <Button variant="dark" onClick={() => navigate('/login')} className="me-2">Sign In</Button>
          <Button variant="warning" onClick={() => navigate('/register')} style={primaryButton}>Sign Up for Free</Button>
        </div>
      </Nav>

      {/* 2. Secondary Banner */}
      <div className="text-white text-center py-2" style={darkBanner}>
        <span className='fw-bold'>82% of orgs are API-first.</span> Collaboration and velocity depend on it. <a href="#" className="text-white" style={{textDecoration: 'underline'}}>Read the report →</a>
      </div>

      {/* 3. Main Content Area */}
      <Container className="my-5">
        <Row className="align-items-center">
          <Col md={6}>
            <h1 className="display-4 fw-bold mb-4">AI needs context. APIs deliver it.</h1>
            <p className="lead mb-4">
              Postman is the platform where teams build those APIs together. With built-in support for the Model Context Protocol (MCP), Postman helps you design, test, and manage APIs that power both human workflows and intelligent agents.
            </p>
            <Button size="lg" onClick={() => navigate('/register')} style={primaryButton} className="me-3">
              Sign Up for Free
            </Button>
            <Button variant="outline-secondary" size="lg">
              Watch a Demo
            </Button>
          </Col>

          {/* 4. Graphic Placeholder */}
          <Col md={6} className="d-flex  pt-xxl-3 justify-content-center ">
           

            <img  className='APICube object-fit-cover ' src="public/assets/Image/postman-api-blocks-homepage.svg" alt="" />
          </Col>
        </Row>

        {/* 5. Desktop App Download Links */}
        <div className="mt-5 pt-5 border-top">
          <p className="iconDekpara text-muted">Download the desktop app for</p>
          <FaWindows className='iconDek h2 me-3' />
          <FaApple className='iconDek h2 me-3'/>
          <FaLinux className='iconDek h2 me-3'/>
          
        </div>
      </Container>
    </div>
  );
};

export default LandingPage;