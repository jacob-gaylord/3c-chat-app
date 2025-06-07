import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('GitHub Actions Workflow Tests', () => {
  describe('Azure Deployment Workflow', () => {
    let workflowContent: any;

    beforeAll(() => {
      const workflowPath = path.join(__dirname, '../../.github/workflows/azure.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);
      const content = fs.readFileSync(workflowPath, 'utf8');
      workflowContent = yaml.load(content);
    });

    test('should have correct workflow name', () => {
      expect(workflowContent.name).toBe('Build and Deploy to Azure');
    });

    test('should trigger on main branch push and PR', () => {
      expect(workflowContent.on.push.branches).toContain('main');
      expect(workflowContent.on.pull_request.branches).toContain('main');
    });


    test('should define environment variables', () => {
      expect(workflowContent.env.AZURE_CLIENT_ID).toBe('${{ vars.AZURE_CLIENT_ID }}');
      expect(workflowContent.env.AZURE_TENANT_ID).toBe('${{ vars.AZURE_TENANT_ID }}');
      expect(workflowContent.env.AZURE_SUBSCRIPTION_ID).toBe('${{ vars.AZURE_SUBSCRIPTION_ID }}');
    });

    test('should have build job', () => {
      expect(workflowContent.jobs.build).toBeDefined();
      expect(workflowContent.jobs.build['runs-on']).toBe('ubuntu-latest');
    });

    test('should have deploy job', () => {
      expect(workflowContent.jobs.deploy).toBeDefined();
      expect(workflowContent.jobs.deploy['runs-on']).toBe('ubuntu-latest');
      expect(workflowContent.jobs.deploy.needs).toBe('build');
    });

    describe('Build Job Steps', () => {
      let buildSteps: any[];

      beforeAll(() => {
        buildSteps = workflowContent.jobs.build.steps;
      });

      test('should checkout code', () => {
        const checkoutStep = buildSteps.find(step => step.uses === 'actions/checkout@v4');
        expect(checkoutStep).toBeDefined();
      });

      test('should setup Node.js', () => {
        const nodeStep = buildSteps.find(step => step.uses === 'actions/setup-node@v4');
        expect(nodeStep).toBeDefined();
        expect(nodeStep.with['node-version']).toBe('20');
      });

      test('should setup pnpm', () => {
        const pnpmStep = buildSteps.find(step => step.uses === 'pnpm/action-setup@v4');
        expect(pnpmStep).toBeDefined();
        expect(pnpmStep.with.version).toBe(8);
      });

      test('should install dependencies', () => {
        const installStep = buildSteps.find(step => step.run === 'pnpm install --frozen-lockfile');
        expect(installStep).toBeDefined();
      });


      test('should run linting', () => {
        const lintStep = buildSteps.find(step => step.run === 'pnpm lint');
        expect(lintStep).toBeDefined();
      });

      test('should build application', () => {
        const buildStep = buildSteps.find(step => step.run === 'pnpm build');
        expect(buildStep).toBeDefined();
      });
    });

    describe('Deploy Job Steps', () => {
      let deploySteps: any[];

      beforeAll(() => {
        deploySteps = workflowContent.jobs.deploy.steps;
      });

      test('should checkout code', () => {
        const checkoutStep = deploySteps.find(step => step.uses === 'actions/checkout@v4');
        expect(checkoutStep).toBeDefined();
      });

      test('should setup Azure CLI', () => {
        const azureStep = deploySteps.find(step => step.uses === 'azure/login@v2');
        expect(azureStep).toBeDefined();
        expect(azureStep.with['client-id']).toBe('${{ env.AZURE_CLIENT_ID }}');
        expect(azureStep.with['tenant-id']).toBe('${{ env.AZURE_TENANT_ID }}');
        expect(azureStep.with['subscription-id']).toBe('${{ env.AZURE_SUBSCRIPTION_ID }}');
      });

      test('should install Azure Developer CLI', () => {
        const azdInstallStep = deploySteps.find(step => 
          step.uses === 'azure/setup-azd@v1.0.0'
        );
        expect(azdInstallStep).toBeDefined();
      });

      test('should deploy with azd', () => {
        const provisionStep = deploySteps.find(step => step.run === 'azd provision --no-prompt');
        const deployStep = deploySteps.find(step => step.run === 'azd deploy --no-prompt');
        expect(provisionStep).toBeDefined();
        expect(deployStep).toBeDefined();
      });
    });

    test('should have proper permissions', () => {
      expect(workflowContent.permissions).toBeDefined();
      expect(workflowContent.permissions.contents).toBe('read');
      expect(workflowContent.permissions['id-token']).toBe('write');
    });

    test('should only run deploy job on main branch', () => {
      expect(workflowContent.jobs.deploy.if).toBe("github.ref == 'refs/heads/main'");
    });
  });

  describe('Workflow File Structure', () => {
    test('should have .github/workflows directory', () => {
      const workflowDir = path.join(__dirname, '../../.github/workflows');
      expect(fs.existsSync(workflowDir)).toBe(true);
    });

    test('workflow file should have .yml extension', () => {
      const workflowPath = path.join(__dirname, '../../.github/workflows/azure.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    test('should be valid YAML', () => {
      const workflowPath = path.join(__dirname, '../../.github/workflows/azure.yml');
      const content = fs.readFileSync(workflowPath, 'utf8');
      
      expect(() => {
        yaml.load(content);
      }).not.toThrow();
    });
  });

  describe('Security Best Practices', () => {
    let workflowContent: any;

    beforeAll(() => {
      const workflowPath = path.join(__dirname, '../../.github/workflows/azure.yml');
      const content = fs.readFileSync(workflowPath, 'utf8');
      workflowContent = yaml.load(content);
    });

    test('should use OIDC authentication instead of secrets', () => {
      const loginStep = workflowContent.jobs.deploy.steps.find((step: any) => 
        step.uses === 'azure/login@v2'
      );
      expect(loginStep.with['client-id']).toBe('${{ env.AZURE_CLIENT_ID }}');
      expect(loginStep.with['tenant-id']).toBe('${{ env.AZURE_TENANT_ID }}');
      expect(loginStep.with['subscription-id']).toBe('${{ env.AZURE_SUBSCRIPTION_ID }}');
    });

    test('should pin action versions', () => {
      const allSteps = [
        ...workflowContent.jobs.build.steps,
        ...workflowContent.jobs.deploy.steps
      ];
      
      const actionSteps = allSteps.filter(step => step.uses);
      
      actionSteps.forEach(step => {
        if (step.uses.includes('@')) {
          const version = step.uses.split('@')[1];
          expect(version).toMatch(/^v\d+(\.\d+\.\d+)?$/); // Should be pinned to version
        }
      });
    });

    test('should use least privilege permissions', () => {
      expect(workflowContent.permissions.contents).toBe('read');
      expect(workflowContent.permissions['id-token']).toBe('write');
      // Should not have write permissions to contents
    });
  });
});