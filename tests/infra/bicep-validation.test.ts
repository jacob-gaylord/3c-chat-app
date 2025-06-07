import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Bicep Infrastructure Tests', () => {
  const infraPath = path.join(__dirname, '../../infra');

  describe('Main Bicep Template', () => {
    let mainBicepContent: string;

    beforeAll(() => {
      const mainBicepPath = path.join(infraPath, 'main.bicep');
      expect(fs.existsSync(mainBicepPath)).toBe(true);
      mainBicepContent = fs.readFileSync(mainBicepPath, 'utf8');
    });

    test('should have valid targetScope', () => {
      expect(mainBicepContent).toContain("targetScope = 'subscription'");
    });

    test('should define required parameters', () => {
      expect(mainBicepContent).toContain('param environmentName string');
      expect(mainBicepContent).toContain('param location string');
      expect(mainBicepContent).toContain('param principalId string = \'\'');
    });

    test('should include monitoring module', () => {
      expect(mainBicepContent).toContain('module monitoring');
      expect(mainBicepContent).toContain('./core/monitor/monitoring.bicep');
    });

    test('should include container registry module', () => {
      expect(mainBicepContent).toContain('module containerRegistry');
      expect(mainBicepContent).toContain('./core/host/container-registry.bicep');
    });

    test('should include container apps environment module', () => {
      expect(mainBicepContent).toContain('module containerAppsEnvironment');
      expect(mainBicepContent).toContain('./core/host/container-apps-environment.bicep');
    });

    test('should include OpenAI service module', () => {
      expect(mainBicepContent).toContain('module openAI');
      expect(mainBicepContent).toContain('./core/ai/cognitiveservices.bicep');
    });

    test('should include app module', () => {
      expect(mainBicepContent).toContain('module app');
      expect(mainBicepContent).toContain('./app/app.bicep');
    });

    test('should have proper resource group creation', () => {
      expect(mainBicepContent).toContain('resource rg \'Microsoft.Resources/resourceGroups@2021-04-01\'');
      expect(mainBicepContent).toContain('location: location');
    });
  });

  describe('Parameters File', () => {
    let parametersContent: any;

    beforeAll(() => {
      const parametersPath = path.join(infraPath, 'main.parameters.json');
      expect(fs.existsSync(parametersPath)).toBe(true);
      const content = fs.readFileSync(parametersPath, 'utf8');
      parametersContent = JSON.parse(content);
    });

    test('should have correct schema', () => {
      expect(parametersContent.$schema).toContain('deploymentParameters.json');
    });

    test('should have contentVersion', () => {
      expect(parametersContent.contentVersion).toBe('1.0.0.0');
    });

    test('should define environmentName parameter', () => {
      expect(parametersContent.parameters.environmentName).toBeDefined();
      expect(parametersContent.parameters.environmentName.value).toBe('${AZURE_ENV_NAME}');
    });

    test('should define location parameter', () => {
      expect(parametersContent.parameters.location).toBeDefined();
      expect(parametersContent.parameters.location.value).toBe('${AZURE_LOCATION}');
    });

    test('should define principalId parameter', () => {
      expect(parametersContent.parameters.principalId).toBeDefined();
      expect(parametersContent.parameters.principalId.value).toBe('${AZURE_PRINCIPAL_ID}');
    });
  });

  describe('Core Modules', () => {
    test('monitoring module should exist', () => {
      const monitoringPath = path.join(infraPath, 'core/monitor/monitoring.bicep');
      expect(fs.existsSync(monitoringPath)).toBe(true);
      
      const content = fs.readFileSync(monitoringPath, 'utf8');
      expect(content).toContain('Microsoft.OperationalInsights/workspaces');
      expect(content).toContain('Microsoft.Insights/components');
    });

    test('container registry module should exist', () => {
      const registryPath = path.join(infraPath, 'core/host/container-registry.bicep');
      expect(fs.existsSync(registryPath)).toBe(true);
      
      const content = fs.readFileSync(registryPath, 'utf8');
      expect(content).toContain('Microsoft.ContainerRegistry/registries');
    });

    test('container apps environment module should exist', () => {
      const envPath = path.join(infraPath, 'core/host/container-apps-environment.bicep');
      expect(fs.existsSync(envPath)).toBe(true);
      
      const content = fs.readFileSync(envPath, 'utf8');
      expect(content).toContain('Microsoft.App/managedEnvironments');
    });

    test('cognitive services module should exist', () => {
      const aiPath = path.join(infraPath, 'core/ai/cognitiveservices.bicep');
      expect(fs.existsSync(aiPath)).toBe(true);
      
      const content = fs.readFileSync(aiPath, 'utf8');
      expect(content).toContain('Microsoft.CognitiveServices/accounts');
    });

    test('security role module should exist', () => {
      const securityPath = path.join(infraPath, 'core/security/role.bicep');
      expect(fs.existsSync(securityPath)).toBe(true);
      
      const content = fs.readFileSync(securityPath, 'utf8');
      expect(content).toContain('Microsoft.Authorization/roleAssignments');
    });
  });

  describe('App Module', () => {
    test('app module should exist', () => {
      const appPath = path.join(infraPath, 'app/app.bicep');
      expect(fs.existsSync(appPath)).toBe(true);
      
      const content = fs.readFileSync(appPath, 'utf8');
      expect(content).toContain('Microsoft.App/containerApps');
      expect(content).toContain('Microsoft.ManagedIdentity/userAssignedIdentities');
    });
  });

  describe('Azure YAML Configuration', () => {
    let azureYamlContent: any;

    beforeAll(() => {
      const azureYamlPath = path.join(__dirname, '../../azure.yaml');
      expect(fs.existsSync(azureYamlPath)).toBe(true);
      const content = fs.readFileSync(azureYamlPath, 'utf8');
      azureYamlContent = yaml.load(content);
    });

    test('should have correct name', () => {
      expect(azureYamlContent.name).toBe('3c-chat-app');
    });

    test('should have services defined', () => {
      expect(azureYamlContent.services).toBeDefined();
      expect(azureYamlContent.services['3c-chat-app']).toBeDefined();
    });

    test('should reference Dockerfile', () => {
      expect(azureYamlContent.services['3c-chat-app'].docker).toBeDefined();
      expect(azureYamlContent.services['3c-chat-app'].docker.path).toBe('./Dockerfile');
    });

    test('should have correct host configuration', () => {
      expect(azureYamlContent.services['3c-chat-app'].host).toBe('containerapp');
    });
  });
});