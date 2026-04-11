// V3Labs Frontend Application
const API_BASE_URL = 'http://localhost:8000';
let currentWebSocket = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkApiStatus();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Deploy form submission
    document.getElementById('deployForm').addEventListener('submit', function(e) {
        e.preventDefault();
        deployAgent();
    });
    
    // Enter key for test message
    document.getElementById('testMessage').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendTestMessage();
        }
    });
}

// Check API status
async function checkApiStatus() {
    const statusIndicator = document.getElementById('apiStatus');
    const statusText = document.getElementById('apiStatusText');
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            statusIndicator.className = 'status-indicator status-online';
            statusText.textContent = 'API Online';
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        statusIndicator.className = 'status-indicator status-offline';
        statusText.textContent = 'API Offline';
        console.error('API Status Check Failed:', error);
    }
}

// Load agents from marketplace
async function loadAgents() {
    const agentsList = document.getElementById('agentsList');
    agentsList.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading agents...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/agents`);
        const agents = await response.json();
        
        if (agents.length === 0) {
            agentsList.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No agents available in the marketplace.</div>';
            return;
        }
        
        let html = '<div class="row">';
        agents.forEach(agent => {
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title">${escapeHtml(agent.name)}</h6>
                            <p class="card-text text-muted small">${escapeHtml(agent.description || 'No description')}</p>
                            <div class="mb-2">
                                <span class="badge bg-primary">${agent.protocol}</span>
                                <span class="badge bg-success">$${agent.price_per_minute}/min</span>
                            </div>
                            ${agent.tags ? agent.tags.map(tag => `<span class="badge bg-secondary me-1">${escapeHtml(tag)}</span>`).join('') : ''}
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-primary" onclick="selectAgent('${agent.id}')">
                                    <i class="fas fa-mouse-pointer me-1"></i>Select
                                </button>
                                <button class="btn btn-sm btn-outline-info" onclick="viewAgentDetails('${agent.id}')">
                                    <i class="fas fa-eye me-1"></i>Details
                                </button>
                            </div>
                        </div>
                        <div class="card-footer text-muted small">
                            Created: ${new Date(agent.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        agentsList.innerHTML = html;
    } catch (error) {
        agentsList.innerHTML = `<div class="error-box"><i class="fas fa-exclamation-triangle me-2"></i>Error loading agents: ${error.message}</div>`;
    }
}

// Select agent for connection
function selectAgent(agentId) {
    document.getElementById('connectAgentId').value = agentId;
    document.getElementById('usageAgentId').value = agentId;
    
    // Switch to connect tab
    const connectTab = new bootstrap.Tab(document.getElementById('connect-tab'));
    connectTab.show();
    
    showNotification('Agent selected for connection', 'success');
}

// View agent details
async function viewAgentDetails(agentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/agents/${agentId}`);
        const agent = await response.json();
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Agent Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Basic Information</h6>
                                <p><strong>Name:</strong> ${escapeHtml(agent.name)}</p>
                                <p><strong>Description:</strong> ${escapeHtml(agent.description || 'No description')}</p>
                                <p><strong>Owner:</strong> ${escapeHtml(agent.owner)}</p>
                                <p><strong>Protocol:</strong> ${agent.protocol}</p>
                                <p><strong>Visibility:</strong> ${agent.visibility}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Pricing & Features</h6>
                                <p><strong>Price:</strong> $${agent.price_per_minute}/minute</p>
                                <p><strong>Voice Type:</strong> ${escapeHtml(agent.voice_type || 'Not specified')}</p>
                                <p><strong>Tags:</strong> ${agent.tags ? agent.tags.map(tag => `<span class="badge bg-secondary me-1">${escapeHtml(tag)}</span>`).join('') : 'None'}</p>
                                <p><strong>Created:</strong> ${new Date(agent.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="mt-3">
                            <h6>Connection</h6>
                            <p><strong>Public Endpoint:</strong></p>
                            <code>${escapeHtml(agent.public_endpoint)}</code>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="selectAgent('${agent.id}')" data-bs-dismiss="modal">
                            Select for Connection
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
        
    } catch (error) {
        showNotification(`Error loading agent details: ${error.message}`, 'error');
    }
}

// Deploy agent
async function deployAgent() {
    const deployKey = document.getElementById('deployKey').value;
    const name = document.getElementById('agentName').value;
    const description = document.getElementById('agentDescription').value;
    const endpoint = document.getElementById('agentEndpoint').value;
    const protocol = document.getElementById('agentProtocol').value;
    const visibility = document.getElementById('agentVisibility').value;
    const price = parseFloat(document.getElementById('agentPrice').value);
    const voiceType = document.getElementById('agentVoiceType').value;
    const tags = document.getElementById('agentTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (!deployKey || !name || !endpoint) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Create YAML content
    const yamlContent = `agent:
  name: "${name}"
  description: "${description}"
  endpoint: "${endpoint}"
  protocol: "${protocol}"
  visibility: "${visibility}"
  price_per_minute: ${price}
  voice_type: "${voiceType}"
  tags:
${tags.map(tag => `    - "${tag}"`).join('\n')}`;
    
    // Create form data
    const formData = new FormData();
    const yamlBlob = new Blob([yamlContent], { type: 'text/yaml' });
    formData.append('config_file', yamlBlob, 'v3labs.yaml');
    
    const responseDiv = document.getElementById('deployResponse');
    responseDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Deploying agent...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/agents/deploy`, {
            method: 'POST',
            headers: {
                'V3LABS_DEPLOY_KEY': deployKey
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            responseDiv.innerHTML = `
                <div class="response-box">
                    <h6><i class="fas fa-check-circle text-success me-2"></i>Agent Deployed Successfully!</h6>
                    <p><strong>Agent ID:</strong> <code>${result.agent_id}</code></p>
                    <p><strong>Public Endpoint:</strong> <code>${result.public_endpoint}</code></p>
                    <p><strong>Message:</strong> ${result.message}</p>
                    <button class="btn btn-sm btn-primary mt-2" onclick="selectAgent('${result.agent_id}')">
                        <i class="fas fa-plug me-1"></i>Connect to Agent
                    </button>
                </div>
            `;
            
            // Clear form
            document.getElementById('deployForm').reset();
            showNotification('Agent deployed successfully!', 'success');
        } else {
            throw new Error(result.detail || 'Deployment failed');
        }
    } catch (error) {
        responseDiv.innerHTML = `<div class="error-box"><i class="fas fa-exclamation-triangle me-2"></i>Deployment failed: ${error.message}</div>`;
    }
}

// Connect to agent via WebSocket
function connectToAgent() {
    const consumerKey = document.getElementById('consumerKey').value;
    const agentId = document.getElementById('connectAgentId').value;
    
    if (!consumerKey || !agentId) {
        showNotification('Please provide consumer key and agent ID', 'error');
        return;
    }
    
    const wsUrl = `ws://localhost:8000/agents/${agentId}?api_key=${encodeURIComponent(consumerKey)}`;
    
    updateConnectionStatus('Connecting...', 'warning');
    showConnectionLog('Attempting to connect to agent...');
    
    try {
        currentWebSocket = new WebSocket(wsUrl);
        
        currentWebSocket.onopen = function(event) {
            updateConnectionStatus('Connected', 'success');
            showConnectionLog('✓ Connected to agent successfully');
            document.getElementById('disconnectBtn').disabled = false;
            document.getElementById('sendBtn').disabled = false;
        };
        
        currentWebSocket.onmessage = function(event) {
            showConnectionLog(`← Received: ${event.data}`);
        };
        
        currentWebSocket.onclose = function(event) {
            updateConnectionStatus('Disconnected', 'secondary');
            showConnectionLog(`✗ Connection closed (Code: ${event.code})`);
            document.getElementById('disconnectBtn').disabled = true;
            document.getElementById('sendBtn').disabled = true;
            currentWebSocket = null;
        };
        
        currentWebSocket.onerror = function(error) {
            updateConnectionStatus('Error', 'danger');
            showConnectionLog(`✗ Connection error: ${error.message || 'Unknown error'}`);
        };
        
    } catch (error) {
        updateConnectionStatus('Error', 'danger');
        showConnectionLog(`✗ Failed to create WebSocket: ${error.message}`);
    }
}

// Disconnect from agent
function disconnectFromAgent() {
    if (currentWebSocket) {
        currentWebSocket.close();
        showConnectionLog('Disconnecting...');
    }
}

// Send test message
function sendTestMessage() {
    const message = document.getElementById('testMessage').value;
    if (!message || !currentWebSocket) return;
    
    try {
        currentWebSocket.send(message);
        showConnectionLog(`→ Sent: ${message}`);
        document.getElementById('testMessage').value = '';
    } catch (error) {
        showConnectionLog(`✗ Failed to send message: ${error.message}`);
    }
}

// Update connection status
function updateConnectionStatus(status, type) {
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.className = `alert alert-${type}`;
    statusDiv.innerHTML = `<i class="fas fa-circle me-2"></i>${status}`;
}

// Show connection log
function showConnectionLog(message) {
    const logDiv = document.getElementById('connectionLog');
    const logContent = document.getElementById('logContent');
    
    logDiv.style.display = 'block';
    
    const timestamp = new Date().toLocaleTimeString();
    logContent.innerHTML += `<div class="small text-muted">[${timestamp}] ${escapeHtml(message)}</div>`;
    
    // Auto-scroll to bottom
    logContent.scrollTop = logContent.scrollHeight;
    
    // Limit log entries
    const entries = logContent.children;
    if (entries.length > 50) {
        logContent.removeChild(entries[0]);
    }
}

// Load agent usage statistics
async function loadAgentUsage() {
    const deployKey = document.getElementById('agentUsageKey').value;
    const agentId = document.getElementById('usageAgentId').value;
    
    if (!deployKey || !agentId) {
        showNotification('Please provide deploy key and agent ID', 'error');
        return;
    }
    
    const responseDiv = document.getElementById('agentUsageResponse');
    responseDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading usage stats...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/usage/agent/${agentId}`, {
            headers: {
                'V3LABS_DEPLOY_KEY': deployKey
            }
        });
        
        const stats = await response.json();
        
        if (response.ok) {
            responseDiv.innerHTML = `
                <div class="response-box">
                    <h6><i class="fas fa-chart-line me-2"></i>Agent Usage Statistics</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-primary">${stats.total_sessions}</h4>
                                <small class="text-muted">Total Sessions</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-info">${Math.round(stats.total_duration_seconds / 60)} min</h4>
                                <small class="text-muted">Total Duration</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-success">$${stats.total_revenue.toFixed(2)}</h4>
                                <small class="text-muted">Total Revenue</small>
                            </div>
                        </div>
                    </div>
                    ${stats.sessions.length > 0 ? `
                        <div class="mt-3">
                            <h6>Recent Sessions</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                            <th>Started</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${stats.sessions.slice(0, 5).map(session => `
                                            <tr>
                                                <td>${escapeHtml(session.user_id)}</td>
                                                <td>${Math.round(session.duration_seconds / 60)} min</td>
                                                <td><span class="badge bg-${session.status === 'completed' ? 'success' : 'warning'}">${session.status}</span></td>
                                                <td>${new Date(session.started_at).toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            throw new Error(stats.detail || 'Failed to load usage stats');
        }
    } catch (error) {
        responseDiv.innerHTML = `<div class="error-box"><i class="fas fa-exclamation-triangle me-2"></i>Error: ${error.message}</div>`;
    }
}

// Load consumer usage statistics
async function loadConsumerUsage() {
    const consumerKey = document.getElementById('consumerUsageKey').value;
    
    if (!consumerKey) {
        showNotification('Please provide consumer key', 'error');
        return;
    }
    
    const responseDiv = document.getElementById('consumerUsageResponse');
    responseDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading usage stats...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/usage/consumer`, {
            headers: {
                'V3LABS_API_KEY': consumerKey
            }
        });
        
        const stats = await response.json();
        
        if (response.ok) {
            responseDiv.innerHTML = `
                <div class="response-box">
                    <h6><i class="fas fa-user-chart me-2"></i>Consumer Usage Statistics</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-primary">${stats.total_sessions}</h4>
                                <small class="text-muted">Total Sessions</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-info">${Math.round(stats.total_duration_seconds / 60)} min</h4>
                                <small class="text-muted">Total Duration</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h4 class="text-warning">$${stats.total_revenue.toFixed(2)}</h4>
                                <small class="text-muted">Total Cost</small>
                            </div>
                        </div>
                    </div>
                    ${stats.sessions.length > 0 ? `
                        <div class="mt-3">
                            <h6>Recent Sessions</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Agent</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                            <th>Started</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${stats.sessions.slice(0, 5).map(session => `
                                            <tr>
                                                <td>${escapeHtml(session.agent_id.substring(0, 8))}...</td>
                                                <td>${Math.round(session.duration_seconds / 60)} min</td>
                                                <td><span class="badge bg-${session.status === 'completed' ? 'success' : 'warning'}">${session.status}</span></td>
                                                <td>${new Date(session.started_at).toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            throw new Error(stats.detail || 'Failed to load usage stats');
        }
    } catch (error) {
        responseDiv.innerHTML = `<div class="error-box"><i class="fas fa-exclamation-triangle me-2"></i>Error: ${error.message}</div>`;
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                ${escapeHtml(message)}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Add to page
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove from DOM after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.removeChild(toast);
    });
}