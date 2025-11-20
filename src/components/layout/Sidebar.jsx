import React, { useState } from 'react';
import { Nav, Accordion, Badge, Button, Collapse } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';

const Sidebar = ({ style }) => {
    const { collections, history, setHistory } = useAppContext();
    const [activeTab, setActiveTab] = useState('history');
    
    // Note: In a real app, this function would update the requestState in RequestView.js
    const handleLoadRequest = (requestData) => {
        console.log("Loading Request:", requestData);
        // Implement logic here to pass requestData up to AppContext or RequestView state
    };
    
    return (
        <div style={{ ...style, backgroundColor: '#2D2D2D', padding: '10px' }}>
            
            {/* Nav Tabs */}
            <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 postman-tabs">
                <Nav.Item>
                    <Nav.Link eventKey="history" className='me-2'>History</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="collections">Collections</Nav.Link>
                </Nav.Item>
            </Nav>

            {/* --- Mandatory 3: History Section --- */}
            {activeTab === 'history' && (
                <div>
                    <h6 className='text-muted mb-3'>Executed Requests</h6>
                    <div className="d-flex justify-content-end mb-2">
                        <Button variant="outline-secondary" size="sm" onClick={() => setHistory([])}>Clear</Button>
                    </div>
                    {(() => {
                        const items = (history || []).filter(h => (h?.request?.url || '').trim());
                        return items.length > 0 ? (
                        items.map((item) => {
                            const req = item?.request || {};
                            const method = (req.method || 'GET').toUpperCase();
                            const url = typeof req.url === 'string' ? req.url : '';
                            const ts = item?.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '';
                            return (
                                <div 
                                    key={item?.id ?? Math.random()} 
                                    className="p-2 sidebar-item bg-dark-primary" 
                                    onClick={() => req && handleLoadRequest(req)}
                                >
                                    <span className={`fw-bold me-2 text-${method === 'GET' ? 'info' : 'warning'}`}>{method}</span>
                                    <small>{url.length > 30 ? url.substring(0, 30) + '...' : url || '(no URL)'}</small>
                                    <small className='text-muted d-block'>{ts}</small>
                                </div>
                            );
                        })) : (
                        <p className="text-muted text-center mt-3">No history recorded.</p>
                        );
                    })()}
                </div>
            )}

            {/* --- Mandatory 6: Collections --- */}
            {activeTab === 'collections' && (
                <>
                    <Button variant="success" size="sm" className="w-100 mb-3" style={{ backgroundColor: '#ff6c37', borderColor: '#ff6c37' }}>+ New Collection</Button>
                    <Accordion defaultActiveKey="0" alwaysOpen>
                        {collections.map((collection, index) => (
                            <Accordion.Item key={collection.id} eventKey={String(index)} className='mb-2 border-dark-subtle' style={{backgroundColor: '#2D2D2D'}}>
                                <Accordion.Header style={{backgroundColor: '#303030'}}>
                                    {collection.name} 
                                    <Badge bg="secondary" className="ms-2">{collection.requests?.length || 0}</Badge>
                                </Accordion.Header>
                                <Accordion.Body className="p-0 bg-dark-primary">
                                    {collection.requests?.map(req => (
                                        <div 
                                            key={req.id} 
                                            className="p-2 ps-3 sidebar-item" 
                                            onClick={() => handleLoadRequest(req)}
                                            style={{ borderBottom: '1px solid #333' }}>
                                            <span className={`fw-bold me-2 text-${req.method === 'GET' ? 'info' : 'warning'}`}>{req.method}</span>
                                            {req.name}
                                        </div>
                                    ))}
                                    <div className="p-2 text-center border-top border-secondary">
                                        <small className='text-info' style={{cursor: 'pointer'}}>+ Add Request</small>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </>
            )}
        </div>
    );
};

export default Sidebar;