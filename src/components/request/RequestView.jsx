import React, { useState, useEffect } from 'react';
import { Button, Form, Tabs, Tab, Container, Row, Col, Alert, Table } from 'react-bootstrap';
import { resolveVariables } from '../../utils/variableResolver';
import { useAppContext } from '../../context/AppContext';
import apiClient from '../../utils/apiClient';

const defaultRequestState = {
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '' }],
    body: '',
    bodyType: 'json'
};

// Common header key suggestions
const COMMON_HEADER_KEYS = [
    'Authorization',
    'Content-Type',
    'Accept',
    'Accept-Language',
    'User-Agent',
    'Cache-Control',
    'Pragma',
    'Expires'
];

// Preset values based on header key
const HEADER_VALUE_PRESETS = {
    'Authorization': ['Bearer {{token}}', 'Basic <base64-credentials>'],
    'Content-Type': [
        'application/json',
        'text/plain',
        'application/x-www-form-urlencoded',
        'multipart/form-data'
    ],
    'Accept': ['application/json', '*/*']
};

const getValuePresetsForKey = (key) => HEADER_VALUE_PRESETS[key] || [];

const RequestView = () => {
    const { 
        activeEnvironmentVars, 
        activeWorkspaceId, 
        setHistory,
        refreshWorkspaces,
        refreshCollections,
        refreshEnvironments,
        refreshHistory,
        setActiveWorkspaceId,
        setActiveEnvironmentVars,
        setActiveEnvironmentName,
        setCollections
    } = useAppContext();
    const [requestState, setRequestState] = useState(defaultRequestState);
    const [responsePanelData, setResponsePanelData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [auth, setAuth] = useState({
        type: 'None', // None | Bearer | Basic | API Key
        bearerToken: '{{token}}',
        basicUser: '',
        basicPass: '',
        apiKeyKey: 'X-API-Key',
        apiKeyValue: '',
        apiKeyPlacement: 'Header', // Header | Query
    });

    // Apply auth to headers by mutating requestState.headers (avoids duplicates)
    const applyAuthToHeaders = () => {
        let headers = [...requestState.headers];
        // Remove existing Authorization and previous API key header (by key match)
        headers = headers.filter(h => h.key && h.key.toLowerCase() !== 'authorization'.toLowerCase());
        headers = headers.filter(h => !(auth.type === 'API Key' && auth.apiKeyPlacement === 'Header' && h.key === auth.apiKeyKey));

        if (auth.type === 'Bearer') {
            headers.unshift({ key: 'Authorization', value: `Bearer ${auth.bearerToken}` });
        } else if (auth.type === 'Basic') {
            const credentials = btoa(`${auth.basicUser}:${auth.basicPass}`);
            headers.unshift({ key: 'Authorization', value: `Basic ${credentials}` });
        } else if (auth.type === 'API Key' && auth.apiKeyPlacement === 'Header') {
            headers.unshift({ key: auth.apiKeyKey, value: auth.apiKeyValue });
        }

        setRequestState({ ...requestState, headers });
    };

    // --- Mandatory Functionality 1: API Request Panel ---
    const handleSend = async () => {
        setIsLoading(true);
        setResponsePanelData(null); // Clear previous response

        // 1. Resolve Variables (Mandatory)
        let resolvedUrl = resolveVariables(requestState.url, activeEnvironmentVars);
        // If running in Vite dev (localhost:5173) and user targeted backend directly,
        // rewrite to proxy path so requests are same-origin and visible in Network
        try {
            const isDev = typeof window !== 'undefined' && window.location.host.includes('localhost:5173');
            if (isDev) {
                const directBackend = /^https?:\/\/localhost:5000(\/.*)?$/i;
                if (directBackend.test(resolvedUrl)) {
                    const u = new URL(resolvedUrl);
                    resolvedUrl = u.pathname + u.search + u.hash; // becomes /api/... via proxy
                }
                // Also normalize {{base_url}} values like http://localhost:5000/api -> /api
                const apiPrefix = /^https?:\/\/localhost:5000\/api(\/.*)?$/i;
                if (apiPrefix.test(resolvedUrl)) {
                    resolvedUrl = resolvedUrl.replace(/^https?:\/\/localhost:5000/i, '');
                }
            }
        } catch { /* ignore */ }
        const resolvedBody = resolveVariables(requestState.body, activeEnvironmentVars);

        // Build headers with Auth applied (auto-apply on Send)
        let headersWithAuth = [...requestState.headers];
        // Remove dup Authorization and API key (same key) before applying
        headersWithAuth = headersWithAuth.filter(h => h.key && h.key.toLowerCase() !== 'authorization');
        headersWithAuth = headersWithAuth.filter(h => !(auth.type === 'API Key' && auth.apiKeyPlacement === 'Header' && h.key === auth.apiKeyKey));

        if (auth.type === 'Bearer') {
            headersWithAuth.unshift({ key: 'Authorization', value: `Bearer ${auth.bearerToken}` });
        } else if (auth.type === 'Basic') {
            const credentials = btoa(`${auth.basicUser}:${auth.basicPass}`);
            headersWithAuth.unshift({ key: 'Authorization', value: `Basic ${credentials}` });
        } else if (auth.type === 'API Key') {
            if (auth.apiKeyPlacement === 'Header') {
                headersWithAuth.unshift({ key: auth.apiKeyKey, value: auth.apiKeyValue });
            } else if (auth.apiKeyPlacement === 'Query') {
                try {
                    const urlObj = new URL(resolvedUrl);
                    urlObj.searchParams.set(auth.apiKeyKey, auth.apiKeyValue);
                    resolvedUrl = urlObj.toString();
                } catch (_) {
                    // If URL parsing fails (e.g., missing protocol), fallback to simple concat
                    const sep = resolvedUrl.includes('?') ? '&' : '?';
                    resolvedUrl = `${resolvedUrl}${sep}${encodeURIComponent(auth.apiKeyKey)}=${encodeURIComponent(auth.apiKeyValue)}`;
                }
            }
        }
        
        const fetchHeaders = new Headers();
        headersWithAuth.forEach(h => {
            const resolvedValue = resolveVariables(h.value, activeEnvironmentVars);
            if (h.key && resolvedValue) {
                fetchHeaders.append(h.key, resolvedValue);
            }
        });

        // Ensure app refresh calls are authenticated: persist Bearer token to localStorage
        try {
            const authHeader = fetchHeaders.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.slice(7).trim();
                if (token) localStorage.setItem('token', token);
            }
        } catch { /* ignore */ }

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

            // Do not log history if URL is empty/invalid
            const safeUrl = (requestState.url || '').trim();
            if (!safeUrl) return;

            // 5. Immediately add to UI history so user sees it even if backend fails
            const safeRequest = { ...requestState, url: safeUrl, method: (requestState.method || 'GET').toUpperCase() };
            const uiHistoryItem = {
                id: Date.now(),
                request: safeRequest,
                timestamp: new Date().toISOString(),
            };
            setHistory(prev => [uiHistoryItem, ...prev]);

            // Also attempt to persist to backend if we have a workspace
            if (success && activeWorkspaceId) {
                try {
                    const historyItem = {
                        workspace_id: activeWorkspaceId,
                        request: safeRequest,
                        response: responseData,
                        timestamp: uiHistoryItem.timestamp,
                    };
                    await apiClient.post('/history', historyItem);
                } catch (e) {
                    // keep silent; UI already updated
                }
            }

            // Auto-refresh sidebar/header data on successful mutations
            if (success) {
                // Attempt to parse JSON for created objects
                let json;
                try { json = JSON.parse(responseData.body); } catch { /* ignore */ }

                const method = (requestState.method || '').toUpperCase();
                const urlStr = (resolvedUrl || '');

                const isWorkspaces = /\/workspaces(\/|\?|$)/.test(urlStr);
                const isEnvironments = /\/environments(\/|\?|$)/.test(urlStr);
                const isCollections = /\/collections(\/|\?|$)/.test(urlStr);

                // Refresh respective lists for POST/PUT/DELETE
                const isMutation = method === 'POST' || method === 'PUT' || method === 'DELETE';
                if (isMutation) {
                    try {
                        if (isWorkspaces) {
                            // If created a workspace, make it active
                            if (method === 'POST' && json && json.id) {
                                setActiveWorkspaceId(json.id);
                            }
                            await refreshWorkspaces();
                            await refreshCollections();
                            await refreshEnvironments();
                        } else if (isEnvironments) {
                            // If we just created an environment, immediately apply its variables
                            if (method === 'POST' && json && json.variables) {
                                try { 
                                    setActiveEnvironmentVars(json.variables);
                                    if (json.name) setActiveEnvironmentName(json.name);
                                } catch { /* ignore */ }
                            }
                            await refreshEnvironments();
                        } else if (isCollections) {
                            // Optimistically add new collection for active workspace
                            if (method === 'POST' && json && json.id && (json.workspace_id === activeWorkspaceId || json.workspaceId === activeWorkspaceId)) {
                                try { setCollections(prev => [json, ...prev]); } catch { /* ignore */ }
                            }
                            await refreshCollections();
                        }
                        // History is already appended locally; optionally sync
                        // await refreshHistory();
                    } catch {/* ignore refresh errors */}
                }
            }
        }
    };
    
    // Helper to render dynamic key-value inputs
    const handleHeaderChange = (index, key, value) => {
        const newHeaders = [...requestState.headers];
        newHeaders[index] = { key, value };
        setRequestState({ ...requestState, headers: newHeaders });
    };

    // --- Rendering the UI ---
    return (
        <Container fluid className="p-3 bg-dark text-light" style={{height: '100%'}}>
            {/* --- API Request Panel --- */}
            <Row className="mb-3">
                <Col md={12}>
                    <h5 className='mb-3'>API Request Panel</h5>
                    <Form className="d-flex mb-3">
                        {/* HTTP Methods Dropdown (Mandatory) */}
                        <Form.Select 
                            value={requestState.method} 
                            onChange={e => setRequestState({...requestState, method: e.target.value})}
                            style={{ width: '150px', marginRight: '10px' }}>
                            {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                        </Form.Select>
                        
                        {/* Request URL Input (Mandatory) */}
                        <Form.Control 
                            type="text" 
                            placeholder="Enter request URL (e.g., {{base_url}}/users)"
                            value={requestState.url}
                            onChange={e => setRequestState({...requestState, url: e.target.value})}
                            className="me-2 bg-secondary text-light border-dark"
                        />
                        
                        {/* Send Button (Mandatory) */}
                        <Button 
                            onClick={handleSend} 
                            disabled={isLoading || !requestState.url}
                            style={{ backgroundColor: '#ff6c37', borderColor: '#ff6c37', width: '100px' }}>
                            {isLoading ? 'Sending...' : 'Send'}
                        </Button>
                    </Form>
                </Col>
            </Row>

            <Row className='mb-3'>
                <Col md={12}>
                    <Tabs defaultActiveKey="headers" className="mb-3">
                        {/* Auth Tab (like Postman) */}
                        <Tab eventKey="auth" title="Auth">
                            <Row className="mb-3">
                                <Col xs={12} md={4} className="mb-2">
                                    <Form.Select
                                        value={auth.type}
                                        onChange={e => setAuth({ ...auth, type: e.target.value })}
                                        className="bg-secondary text-light border-dark"
                                    >
                                        {['None', 'Bearer', 'Basic', 'API Key'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>

                            {auth.type === 'Bearer' && (
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Label>Token</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={auth.bearerToken}
                                            onChange={e => setAuth({ ...auth, bearerToken: e.target.value })}
                                            placeholder="{{token}} or actual token"
                                            className="bg-secondary text-light border-dark"
                                        />
                                    </Col>
                                </Row>
                            )}

                            {auth.type === 'Basic' && (
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <Form.Label>Username</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={auth.basicUser}
                                            onChange={e => setAuth({ ...auth, basicUser: e.target.value })}
                                            className="bg-secondary text-light border-dark"
                                        />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={auth.basicPass}
                                            onChange={e => setAuth({ ...auth, basicPass: e.target.value })}
                                            className="bg-secondary text-light border-dark"
                                        />
                                    </Col>
                                </Row>
                            )}

                            {auth.type === 'API Key' && (
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <Form.Label>Key</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={auth.apiKeyKey}
                                            onChange={e => setAuth({ ...auth, apiKeyKey: e.target.value })}
                                            className="bg-secondary text-light border-dark"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Value</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={auth.apiKeyValue}
                                            onChange={e => setAuth({ ...auth, apiKeyValue: e.target.value })}
                                            placeholder="Your API key value"
                                            className="bg-secondary text-light border-dark"
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label>Placement</Form.Label>
                                        <Form.Select
                                            value={auth.apiKeyPlacement}
                                            onChange={e => setAuth({ ...auth, apiKeyPlacement: e.target.value })}
                                            className="bg-secondary text-light border-dark"
                                        >
                                            <option>Header</option>
                                            <option>Query</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            )}

                            <Button variant="outline-light" size="sm" onClick={applyAuthToHeaders}>Apply to Headers</Button>
                        </Tab>
                        {/* Dynamic Header Fields Tab (Mandatory) */}
                        <Tab eventKey="headers" title="Headers">
                            {requestState.headers.map((h, index) => (
                                <Row key={index} className="mb-2">
                                    <Col xs={5}>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Key" 
                                            value={h.key} 
                                            list={`header-keys-${index}`}
                                            onChange={e => handleHeaderChange(index, e.target.value, h.value)}
                                            className="bg-secondary text-light border-dark"
                                        />
                                        {/* Header key suggestions */}
                                        <datalist id={`header-keys-${index}`}>
                                            {COMMON_HEADER_KEYS.map(k => (
                                                <option key={k} value={k} />
                                            ))}
                                        </datalist>
                                    </Col>
                                    <Col xs={5}>
                                        {
                                            getValuePresetsForKey(h.key).length > 0 ? (
                                                <Form.Select
                                                    value={h.value}
                                                    onChange={e => handleHeaderChange(index, h.key, e.target.value)}
                                                    className="bg-secondary text-light border-dark"
                                                >
                                                    <option value="">Select value</option>
                                                    {getValuePresetsForKey(h.key).map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </Form.Select>
                                            ) : (
                                                <>
                                                    <Form.Control 
                                                        type="text" 
                                                        placeholder="Value (e.g., Bearer {{token}})" 
                                                        value={h.value} 
                                                        list={`header-values-${index}`}
                                                        onChange={e => handleHeaderChange(index, h.key, e.target.value)}
                                                        className="bg-secondary text-light border-dark"
                                                    />
                                                    {/* Header value suggestions based on selected key */}
                                                    <datalist id={`header-values-${index}`}>
                                                        {getValuePresetsForKey(h.key).map(v => (
                                                            <option key={v} value={v} />
                                                        ))}
                                                    </datalist>
                                                </>
                                            )
                                        }
                                    </Col>
                                    <Col xs={2}>
                                        <Button variant="danger" size="sm" onClick={() => {
                                            const newHeaders = requestState.headers.filter((_, i) => i !== index);
                                            setRequestState({...requestState, headers: newHeaders});
                                        }}>X</Button>
                                    </Col>
                                </Row>
                            ))}
                            <Button variant="outline-light" size="sm" onClick={() => setRequestState({...requestState, headers: [...requestState.headers, {key: '', value: ''}]})}>
                                + Add Header
                            </Button>
                        </Tab>
                        
                        {/* Request Body Input Tab (Mandatory) */}
                        <Tab eventKey="body" title="Body">
                            <Form.Control 
                                as="textarea" 
                                rows={8} 
                                placeholder="Request Body (e.g., JSON payload)"
                                value={requestState.body}
                                onChange={e => setRequestState({...requestState, body: e.target.value})}
                                className="bg-secondary text-light border-dark"
                                style={{ fontFamily: 'monospace' }}
                            />
                            {/* Optional: Add JSON validation/toggle here */}
                        </Tab>
                    </Tabs>
                </Col>
            </Row>

            {/* --- Response Panel (Mandatory Functionality 2) --- */}
            <h5 className='mb-3'>API Response Panel</h5>
            
            {responsePanelData && (
                <>
                {/* Status Code, Time, Headers Display (Mandatory) */}
                <div className="d-flex mb-3">
                    <span className={`me-3 fw-bold ${responsePanelData.statusCode >= 400 ? 'text-danger' : 'text-success'}`}>
                        Status: {responsePanelData.statusCode || 'N/A'} {responsePanelData.statusText || ''}
                    </span>
                    <span className="me-3">Time: {responsePanelData.timeMs}ms</span>
                    <span className="me-3">Size: {responsePanelData.sizeBytes} bytes</span>
                </div>

                <Tabs defaultActiveKey="body" className="mb-3">
                    {/* Body Tab (Formatted JSON) (Mandatory) */}
                    <Tab eventKey="body" title="Body">
                        <pre className="p-3 bg-secondary text-light border-dark rounded" style={{maxHeight: '60vh', minHeight: '200px', overflow: 'auto'}}>
                            {responsePanelData.body ? (
                                responsePanelData.bodyType === 'json' ? (
                                    // Attempt to pretty-print JSON
                                    (() => {
                                        try {
                                            return JSON.stringify(JSON.parse(responsePanelData.body), null, 2);
                                        } catch {
                                            return responsePanelData.body;
                                        }
                                    })()
                                ) : responsePanelData.body
                            ) : (
                                "No response body received."
                            )}
                        </pre>
                    </Tab>

                    {/* Headers Tab (Mandatory) */}
                    <Tab eventKey="headers" title="Headers">
                        <Table striped bordered hover variant="dark" size="sm">
                            <thead><tr><th>Key</th><th>Value</th></tr></thead>
                            <tbody>
                                {responsePanelData.headers.map(([key, value], index) => (
                                    <tr key={index}><td>{key}</td><td>{value}</td></tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>

                    {/* Raw View Tab (Mandatory) */}
                    <Tab eventKey="raw" title="Raw View">
                        <pre className="p-3 bg-secondary text-light border-dark rounded" style={{maxHeight: '60vh', minHeight: '200px', overflow: 'auto'}}>
                            {responsePanelData.body}
                        </pre>
                    </Tab>
                </Tabs>
                </>
            )}

            {/* Error Handling (Mandatory) */}
            {responsePanelData && responsePanelData.error && (
                <Alert variant="danger">
                    <strong>Error:</strong> {responsePanelData.error}
                    <p className='mb-0'><small>{responsePanelData.details}</small></p>
                </Alert>
            )}
        </Container>
    );
};

export default RequestView;