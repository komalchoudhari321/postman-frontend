import React, { useState } from 'react';
import { Button, Form, Tabs, Tab, Row, Col, Alert, Table } from 'react-bootstrap';
import { resolveVariables } from '../../utils/variableResolver';
import { useAppContext } from '../../context/AppContext';
import apiClient from '../../utils/apiClient';

// Initial state for a new request
const defaultRequestState = {
    method: 'GET',
    url: '{{base_url}}/auth/me',
    headers: [{ key: 'Authorization', value: 'Bearer {{token}}' }], // Example header with variable
    body: '',
};

const RequestView = () => {
    const { activeEnvironmentVars, activeWorkspaceId, setHistory } = useAppContext();
    const [requestState, setRequestState] = useState(defaultRequestState);
    const [responsePanelData, setResponsePanelData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- Core Logic: Handle the Send Button Click ---
    const handleSend = async () => {
        setIsLoading(true);
        setResponsePanelData(null); 

        // 1. Resolve Variables (Mandatory)
        const resolvedUrl = resolveVariables(requestState.url, activeEnvironmentVars);
        const resolvedBody = resolveVariables(requestState.body, activeEnvironmentVars);
        
        const fetchHeaders = new Headers();
        requestState.headers.forEach(h => {
            const resolvedValue = resolveVariables(h.value, activeEnvironmentVars);
            // Only add header if key and value are present after resolution
            if (h.key && resolvedValue) {
                fetchHeaders.append(h.key, resolvedValue);
            }
        });

        const startTime = Date.now();
        let responseData = {};
        let success = false;

        try {
            // 2. Make the EXTERNAL API Call
            const response = await fetch(resolvedUrl, {
                method: requestState.method,
                headers: fetchHeaders,
                body: (requestState.method !== 'GET' && requestState.method !== 'HEAD') ? resolvedBody : null,
            });

            const responseBodyText = await response.text();
            const endTime = Date.now();
            
            // 3. Format Response Data
            responseData = {
                statusCode: response.status,
                statusText: response.statusText,
                timeMs: endTime - startTime,
                sizeBytes: new TextEncoder().encode(responseBodyText).length,
                headers: Array.from(response.headers.entries()),
                body: responseBodyText,
            };
            success = true;

        } catch (error) {
            // 4. Error Handling (Mandatory)
            responseData = { error: 'Network Error', details: error.message };
        } finally {
            setResponsePanelData(responseData);
            setIsLoading(false);

            // 5. Log History to YOUR Backend (Mandatory)
            if (success && activeWorkspaceId) {
                try {
                    const historyItem = {
                        workspace_id: activeWorkspaceId,
                        request: requestState,
                        response: responseData,
                        timestamp: new Date().toISOString(),
                    };
                    // Use YOUR apiClient to save history to YOUR backend
                    const res = await apiClient.post('/history', historyItem);
                    setHistory(prev => [res.data, ...prev]); 
                } catch (e) {
                    console.error("Failed to log history:", e);
                }
            }
        }
    };
    
    // Helper for managing dynamic header fields
    const handleHeaderChange = (index, key, value) => {
        const newHeaders = [...requestState.headers];
        newHeaders[index] = { key, value };
        setRequestState({ ...requestState, headers: newHeaders });
    };

    return (
        <div className="p-3 text-light bg-dark-primary" style={{ height: '100%', overflowY: 'auto' }}>
            
            {/* --- Mandatory 1: API Request Panel --- */}
            
            <h5 className='mb-3'>Untitled Request</h5>

            {/* URL/Method/Send Bar (Mimics Postman look) */}
            <Row className="mb-3">
                <Col md={12}>
                    <div className="d-flex align-items-center bg-dark-secondary border-dark-subtle" style={{ borderRadius: '4px', overflow: 'hidden' }}>
                        
                        {/* HTTP Methods Dropdown */}
                        <Form.Select 
                            value={requestState.method} 
                            onChange={e => setRequestState({...requestState, method: e.target.value})}
                            className="bg-dark-secondary text-light"
                            style={{ width: '120px', border: 'none', borderRadius: 0 }}>
                            {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                        </Form.Select>
                        
                        {/* Request URL Input */}
                        <Form.Control 
                            type="text" 
                            placeholder="Enter URL or paste text (e.g., {{base_url}}/users)"
                            value={requestState.url}
                            onChange={e => setRequestState({...requestState, url: e.target.value})}
                            className="bg-transparent text-light border-0"
                            style={{ flexGrow: 1 }}
                        />
                        
                        {/* Send Button */}
                        <Button 
                            onClick={handleSend} 
                            disabled={isLoading || !requestState.url}
                            style={{ backgroundColor: '#ff6c37', borderColor: '#ff6c37', width: '100px', borderRadius: 0 }}>
                            {isLoading ? 'Sending...' : 'Send'}
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Request Tabs (Headers/Body) */}
            <Row className='mb-3'>
                <Col md={12}>
                    <Tabs defaultActiveKey="headers" className="postman-tabs mb-3" variant="pills">
                        
                        {/* Query Params Tab (Stub for completeness) */}
                        <Tab eventKey="params" title="Params">
                            <div className='p-3 text-muted'>
                                Query parameters are automatically extracted from the URL, or can be managed here.
                            </div>
                        </Tab>

                        {/* Dynamic Header Fields Tab */}
                        <Tab eventKey="headers" title={`Headers (${requestState.headers.length})`}>
                            <div className='p-3 bg-dark-secondary rounded'>
                            {requestState.headers.map((h, index) => (
                                <Row key={index} className="mb-2">
                                    <Col xs={5}>
                                        <Form.Control type="text" placeholder="Key" value={h.key} 
                                            onChange={e => handleHeaderChange(index, e.target.value, h.value)}
                                            className="bg-dark-primary text-light border-dark-subtle"
                                        />
                                    </Col>
                                    <Col xs={5}>
                                        <Form.Control type="text" placeholder="Value (e.g., Bearer {{token}})" value={h.value} 
                                            onChange={e => handleHeaderChange(index, h.key, e.target.value)}
                                            className="bg-dark-primary text-light border-dark-subtle"
                                        />
                                    </Col>
                                    <Col xs={2}>
                                        <Button variant="danger" size="sm" onClick={() => {
                                            const newHeaders = requestState.headers.filter((_, i) => i !== index);
                                            setRequestState({...requestState, headers: newHeaders});
                                        }}>Remove</Button>
                                    </Col>
                                </Row>
                            ))}
                            <Button variant="outline-light" size="sm" onClick={() => setRequestState({...requestState, headers: [...requestState.headers, {key: '', value: ''}]})}>
                                + Add Header
                            </Button>
                            </div>
                        </Tab>
                        
                        {/* Request Body Input Tab */}
                        <Tab eventKey="body" title="Body">
                            <Form.Control 
                                as="textarea" 
                                rows={10} 
                                placeholder="Request Body (JSON, text, etc.)"
                                value={requestState.body}
                                onChange={e => setRequestState({...requestState, body: e.target.value})}
                                className="bg-dark-secondary text-light border-dark-subtle"
                                style={{ fontFamily: 'monospace' }}
                            />
                        </Tab>
                    </Tabs>
                </Col>
            </Row>

            {/* --- Mandatory 2: Response Panel --- */}
            <h5 className='mt-4'>Response</h5>
            
            {responsePanelData && (
                <>
                {/* Status Code, Time, Headers Display */}
                <div className="d-flex mb-3">
                    <span className={`me-3 fw-bold ${responsePanelData.statusCode >= 400 ? 'text-danger' : 'text-success'}`}>
                        Status: {responsePanelData.statusCode || 'N/A'} {responsePanelData.statusText || ''}
                    </span>
                    <span className="me-3">Time: {responsePanelData.timeMs}ms</span>
                    <span className="me-3">Size: {responsePanelData.sizeBytes} bytes</span>
                </div>

                <Tabs defaultActiveKey="body" className="postman-tabs mb-3" variant="pills">
                    
                    {/* Body Tab (Display formatted JSON) */}
                    <Tab eventKey="body" title="Body">
                        <pre className="p-3 bg-dark-secondary text-light rounded" style={{maxHeight: '400px', overflow: 'auto', fontFamily: 'monospace'}}>
                            {responsePanelData.body ? (
                                (() => {
                                    // Attempt to pretty-print JSON
                                    try {
                                        return JSON.stringify(JSON.parse(responsePanelData.body), null, 2);
                                    } catch {
                                        return responsePanelData.body;
                                    }
                                })()
                            ) : (
                                "No response body received."
                            )}
                        </pre>
                    </Tab>

                    {/* Headers Tab */}
                    <Tab eventKey="headers" title="Headers">
                        <Table striped bordered hover variant="dark" size="sm" className='bg-dark-secondary'>
                            <thead><tr><th>Key</th><th>Value</th></tr></thead>
                            <tbody>
                                {responsePanelData.headers.map(([key, value], index) => (
                                    <tr key={index}><td>{key}</td><td>{value}</td></tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>

                    {/* Raw View Tab */}
                    <Tab eventKey="raw" title="Raw View">
                        <pre className="p-3 bg-dark-secondary text-light rounded" style={{maxHeight: '400px', overflow: 'auto', fontFamily: 'monospace'}}>
                            {responsePanelData.body}
                        </pre>
                    </Tab>
                </Tabs>
                </>
            )}

            {/* Mandatory Error Handling */}
            {responsePanelData && responsePanelData.error && (
                <Alert variant="danger">
                    <strong>Error:</strong> {responsePanelData.error}
                    <p className='mb-0'><small>{responsePanelData.details}</small></p>
                </Alert>
            )}
        </div>
    );
};

export default RequestView;