# 3Cloud Chat Application

A modern chat application built with Next.js 15, TypeScript, and Tailwind CSS, designed to integrate with Azure OpenAI Service. This application provides a lightweight MCP (Model Context Protocol) client for conversational AI interactions.

## Features

- 🎨 Modern UI with custom 3Cloud branding
- 🌙 Dark/Light theme support
- 📱 Responsive design with mobile support
- 🚀 Real-time chat with AI models
- 🔒 Azure OpenAI Service integration
- 📋 Sample conversation data
- ⚡ Fast, optimized Next.js performance

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: Radix UI with shadcn/ui patterns
- **AI Integration**: AI SDK (@ai-sdk/react, @ai-sdk/openai)
- **Infrastructure**: Azure Container Apps, Azure OpenAI Service
- **Deployment**: Azure Developer CLI (azd), GitHub Actions

## Development Environment

### Prerequisites

- Node.js 20+
- pnpm package manager
- Azure CLI (for deployment)
- Azure Developer CLI (azd)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3c-chat-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   AZURE_OPENAI_ENDPOINT=your-openai-endpoint
   AZURE_OPENAI_API_KEY=your-api-key
   AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4o
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Development Workflow

1. **Code Quality**: Always run `pnpm lint` before committing changes
2. **Theme Testing**: Test both dark and light themes during development
3. **Mobile Testing**: Verify responsive behavior on different screen sizes
4. **AI Integration**: Test chat functionality with sample data first

## Azure Infrastructure

### Architecture Overview

The application is deployed on Azure using:

- **Azure Container Apps**: Serverless container hosting
- **Azure Container Registry**: Container image storage
- **Azure OpenAI Service**: AI model hosting (GPT-4o)
- **Azure Log Analytics**: Application monitoring
- **Azure Application Insights**: Performance monitoring

### Infrastructure as Code

All Azure resources are defined using Bicep templates in the `infra/` directory:

```
infra/
├── main.bicep                    # Main deployment template
├── main.parameters.json          # Deployment parameters
├── abbreviations.json            # Azure resource naming conventions
├── core/
│   ├── monitor/
│   │   └── monitoring.bicep      # Log Analytics & App Insights
│   ├── host/
│   │   ├── container-registry.bicep
│   │   └── container-apps-environment.bicep
│   ├── ai/
│   │   └── cognitiveservices.bicep  # Azure OpenAI Service
│   └── security/
│       └── role.bicep            # RBAC assignments
└── app/
    └── app.bicep                 # Container App definition
```

### Deployment

#### Prerequisites for Azure Deployment

1. **Azure Subscription** with appropriate permissions
2. **Azure Developer CLI** installed
3. **GitHub repository** with Actions enabled

#### Local Deployment

```bash
# Login to Azure
azd auth login

# Initialize environment (first time only)
azd init

# Provision Azure resources
azd provision

# Deploy application
azd deploy

# Or do both in one command
azd up
```

#### GitHub Actions Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/azure.yml`) that:

1. **Builds** the Next.js application
2. **Runs** linting and quality checks
3. **Provisions** Azure infrastructure (on main branch)
4. **Deploys** the application to Azure Container Apps

**Required GitHub Secrets/Variables:**
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID` 
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_ENV_NAME`
- `AZURE_LOCATION`

### Environment Variables

The following environment variables are automatically configured in Azure Container Apps:

- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Application monitoring
- `AZURE_OPENAI_ENDPOINT` - OpenAI service endpoint
- `AZURE_OPENAI_API_KEY` - OpenAI service authentication
- `PORT` - Container port (3000)

## Project Structure

```
├── app/                          # Next.js app router
│   ├── api/chat/route.ts        # Chat API endpoint
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── chat-interface.tsx       # Main chat component
│   ├── chat-input.tsx          # Message input
│   ├── chat-messages.tsx       # Message display
│   ├── sidebar.tsx             # Navigation sidebar
│   └── ui/                     # Reusable UI components
├── hooks/                       # Custom React hooks
├── lib/                        # Utility functions
├── infra/                      # Azure Bicep templates
├── .github/workflows/          # CI/CD workflows
├── Dockerfile                  # Container configuration
├── azure.yaml                  # Azure Developer CLI config
└── CLAUDE.md                   # Claude Code guidance
```

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Run** `pnpm lint` to ensure code quality
5. **Test** the application locally
6. **Submit** a pull request

## Monitoring and Troubleshooting

### Application Insights

Monitor application performance and errors in Azure Application Insights:
- View real-time metrics
- Analyze request traces
- Monitor custom events

### Container Apps Logs

Access container logs using Azure CLI:
```bash
az containerapp logs show --name <app-name> --resource-group <rg-name>
```

### Common Issues

1. **Hydration Errors**: Fixed by using mounted state for theme detection
2. **Build Failures**: Ensure all dependencies are properly installed
3. **Azure OpenAI Limits**: Monitor usage quotas and scaling rules

## License

This project is licensed under the MIT License.