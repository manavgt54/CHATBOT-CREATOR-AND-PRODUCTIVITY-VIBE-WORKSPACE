# CLI Module - AI Container Management

This CLI module provides command-line tools for managing AI chatbot containers. Each command is designed to work independently and can be used for automation, debugging, or manual container management.

## Available Commands

### 1. `createContainer.js` - Create New AI Container

Creates a complete AI chatbot container with isolated environment.

```bash
node createContainer.js <session_id> <ai_name> <ai_description>
```

**What it does:**
- Creates a new Docker container
- Clones the main codebase into the container
- Injects AI-specific logic based on name and description
- Connects the container to the frontend session
- Sets up isolated environment for the AI

**Example:**
```bash
node createContainer.js sess_123 "Customer Bot" "Helpful customer support assistant"
```

### 2. `cloneCode.js` - Clone Main Codebase

Clones the main codebase into a container directory.

```bash
node cloneCode.js <container_id>
```

**What it does:**
- Creates a container-specific directory
- Copies main codebase files
- Sets up container environment
- Prepares for AI logic injection

**Example:**
```bash
node cloneCode.js cont_123
```

### 3. `injectLogic.js` - Inject AI Logic

Injects AI-specific logic into a container based on name and description.

```bash
node injectLogic.js <container_id> <ai_name> <ai_description>
```

**What it does:**
- Analyzes AI name and description
- Generates personality and capabilities
- Injects AI-specific configuration
- Updates bot logic with custom behavior
- Sets up AI-specific environment variables

**Example:**
```bash
node injectLogic.js cont_123 "Code Helper" "Expert programming assistant for developers"
```

### 4. `connectFrontend.js` - Connect to Frontend

Connects a container to the frontend session for real-time communication.

```bash
node connectFrontend.js <container_id> <session_id>
```

**What it does:**
- Establishes WebSocket connection between container and frontend
- Sets up message routing
- Configures real-time communication
- Updates container status to "Connected"

**Example:**
```bash
node connectFrontend.js cont_123 sess_456
```

### 5. `deleteContainer.js` - Delete Container

Deletes an AI chatbot container and cleans up resources.

```bash
node deleteContainer.js <container_id>
node deleteContainer.js --list
node deleteContainer.js --force <container_id>
```

**What it does:**
- Stops the running container
- Removes Docker container
- Cleans up container files
- Removes from active container registry
- Updates database records

**Examples:**
```bash
node deleteContainer.js cont_123
node deleteContainer.js --list
node deleteContainer.js --force cont_123
```

## Environment Variables

### Docker Configuration
```bash
DOCKER_SOCKET_PATH=/var/run/docker.sock  # Docker socket path
```

### Cloud Credentials (Replace with actual values)
```bash
# AWS
AWS_ACCESS_KEY_ID=[AWS_ACCESS_KEY_ID]
AWS_SECRET_ACCESS_KEY=[AWS_SECRET_ACCESS_KEY]
AWS_REGION=[AWS_REGION]

# Google Cloud
GCP_PROJECT_ID=[GCP_PROJECT_ID]
GCP_KEY_FILE=[GCP_KEY_FILE]

# Azure
AZURE_SUBSCRIPTION_ID=[AZURE_SUBSCRIPTION_ID]
AZURE_CLIENT_ID=[AZURE_CLIENT_ID]
AZURE_CLIENT_SECRET=[AZURE_CLIENT_SECRET]
AZURE_TENANT_ID=[AZURE_TENANT_ID]
```

### AI API Keys (Replace with actual values)
```bash
OPENAI_API_KEY=[OPENAI_API_KEY]
ANTHROPIC_API_KEY=[ANTHROPIC_API_KEY]
GOOGLE_AI_API_KEY=[GOOGLE_AI_API_KEY]
AZURE_AI_API_KEY=[AZURE_AI_API_KEY]
```

### Frontend Configuration
```bash
FRONTEND_WS_URL=ws://localhost:5000  # WebSocket URL for frontend connection
```

## Workflow Examples

### Complete AI Creation Workflow
```bash
# 1. Create container
node createContainer.js sess_123 "Customer Bot" "Helpful customer support assistant"

# 2. Clone code (if needed separately)
node cloneCode.js cont_123

# 3. Inject AI logic (if needed separately)
node injectLogic.js cont_123 "Customer Bot" "Helpful customer support assistant"

# 4. Connect to frontend
node connectFrontend.js cont_123 sess_123
```

### Container Management
```bash
# List available containers
node deleteContainer.js --list

# Delete a container
node deleteContainer.js cont_123

# Force delete (use with caution)
node deleteContainer.js --force cont_123
```

## Error Handling

All CLI commands include comprehensive error handling:

- **Validation**: Input validation for all parameters
- **Verification**: Container existence and status verification
- **Graceful Degradation**: Commands continue with warnings when non-critical operations fail
- **Cleanup**: Automatic cleanup of resources on failure
- **Logging**: Detailed logging for debugging

## Integration with Backend

The CLI commands integrate with the backend services:

- `containerManager`: For Docker container operations
- `aiService`: For database operations
- `sessionManager`: For session validation

## Security Considerations

- **Session Validation**: All commands validate session IDs
- **Container Isolation**: Each container runs in isolation
- **Resource Limits**: Memory and CPU limits applied to containers
- **Access Control**: Containers can only be accessed by their session owners

## Troubleshooting

### Common Issues

1. **Docker Connection Failed**
   - Check Docker daemon is running
   - Verify Docker socket path
   - Ensure user has Docker permissions

2. **Container Creation Failed**
   - Check available disk space
   - Verify Docker image availability
   - Check resource limits

3. **WebSocket Connection Failed**
   - Verify frontend server is running
   - Check WebSocket URL configuration
   - Ensure firewall allows WebSocket connections

4. **Database Operations Failed**
   - Check database connection
   - Verify database permissions
   - Check database schema

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=cli:*
```

## Automation

These CLI commands can be used in automation scripts:

```bash
#!/bin/bash
# Automated AI creation script

SESSION_ID="sess_$(date +%s)"
AI_NAME="Auto Bot"
AI_DESCRIPTION="Automatically created bot"

echo "Creating AI container..."
CONTAINER_ID=$(node createContainer.js "$SESSION_ID" "$AI_NAME" "$AI_DESCRIPTION" | grep "Container ID:" | cut -d' ' -f3)

echo "Connecting to frontend..."
node connectFrontend.js "$CONTAINER_ID" "$SESSION_ID"

echo "AI container created and connected: $CONTAINER_ID"
```

## Support

For issues or questions:
1. Check the main README.md for setup instructions
2. Review error messages and logs
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed



