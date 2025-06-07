targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Id of the user or app to assign application roles')
param principalId string = ''

// Optional parameters to override the default azd resource naming conventions. 
// Add the following to main.parameters.json to provide values:
// "resourceGroupName": {
//      "value": "myGroupName"
// }
param resourceGroupName string = ''
param containerAppsEnvironmentName string = ''
param containerRegistryName string = ''
param logAnalyticsName string = ''
param applicationInsightsName string = ''

@description('Flag to use Azure OpenAI Service')
param useAzureOpenAI bool = true

@description('Name of the Azure OpenAI Service')
param openAIServiceName string = ''

@description('Location for the Azure OpenAI Service')
param openAILocation string = 'eastus'

@description('SKU name for the Azure OpenAI Service')
param openAISku string = 'S0'

@description('Name of the GPT model deployment')
param chatGptDeploymentName string = 'gpt-4o'

@description('Name of the GPT model')
param chatGptModelName string = 'gpt-4o'

@description('Version of the GPT model')
param chatGptModelVersion string = '2024-08-06'

@description('Capacity of the GPT deployment')
param chatGptDeploymentCapacity int = 10

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// Monitor application with Azure Monitor
module monitoring './core/monitor/monitoring.bicep' = {
  name: 'monitoring'
  scope: rg
  params: {
    location: location
    tags: tags
    logAnalyticsName: !empty(logAnalyticsName) ? logAnalyticsName : '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: !empty(applicationInsightsName) ? applicationInsightsName : '${abbrs.insightsComponents}${resourceToken}'
  }
}

// Container registry
module containerRegistry './core/host/container-registry.bicep' = {
  name: 'container-registry'
  scope: rg
  params: {
    location: location
    tags: tags
    name: !empty(containerRegistryName) ? containerRegistryName : '${abbrs.containerRegistryRegistries}${resourceToken}'
  }
}

// Container apps environment
module containerAppsEnvironment './core/host/container-apps-environment.bicep' = {
  name: 'container-apps-environment'
  scope: rg
  params: {
    location: location
    tags: tags
    name: !empty(containerAppsEnvironmentName) ? containerAppsEnvironmentName : '${abbrs.appManagedEnvironments}${resourceToken}'
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
}

// Azure OpenAI Service
module openAI './core/ai/cognitiveservices.bicep' = if (useAzureOpenAI) {
  name: 'openai'
  scope: rg
  params: {
    location: openAILocation
    tags: tags
    name: !empty(openAIServiceName) ? openAIServiceName : '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    sku: {
      name: openAISku
    }
    deployments: [
      {
        name: chatGptDeploymentName
        model: {
          format: 'OpenAI'
          name: chatGptModelName
          version: chatGptModelVersion
        }
        sku: {
          name: 'Standard'
          capacity: chatGptDeploymentCapacity
        }
      }
    ]
  }
}

// Chat app container app
module app './app/app.bicep' = {
  name: 'app'
  scope: rg
  params: {
    location: location
    tags: tags
    name: '${abbrs.appContainerApps}app-${resourceToken}'
    containerAppsEnvironmentId: containerAppsEnvironment.outputs.environmentId
    containerRegistryName: containerRegistry.outputs.name
    exists: false
    appInsightsConnectionString: monitoring.outputs.applicationInsightsConnectionString
    openAIEndpoint: useAzureOpenAI ? openAI.outputs.endpoint : ''
    openAIApiKey: useAzureOpenAI ? openAI.outputs.apiKey : ''
  }
}

// Assign roles for the user to access Azure OpenAI
module openAIRoleUser './core/security/role.bicep' = if (useAzureOpenAI && !empty(principalId)) {
  scope: rg
  name: 'openai-role-user'
  params: {
    principalId: principalId
    roleDefinitionId: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd' // Cognitive Services OpenAI User
    principalType: 'User'
  }
}

// Assign roles for the container app to access Azure OpenAI
module openAIRoleApp './core/security/role.bicep' = if (useAzureOpenAI) {
  scope: rg
  name: 'openai-role-app'
  params: {
    principalId: app.outputs.identityPrincipalId
    roleDefinitionId: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd' // Cognitive Services OpenAI User
    principalType: 'ServicePrincipal'
  }
}

// App outputs
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = rg.name

// Container apps outputs
output AZURE_CONTAINER_ENVIRONMENT_NAME string = containerAppsEnvironment.outputs.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name

// Azure OpenAI outputs
output AZURE_OPENAI_ENDPOINT string = useAzureOpenAI ? openAI.outputs.endpoint : ''
output AZURE_OPENAI_CHAT_DEPLOYMENT_NAME string = useAzureOpenAI ? chatGptDeploymentName : ''

// App service outputs
output SERVICE_APP_NAME string = app.outputs.name
output SERVICE_APP_URI string = app.outputs.uri