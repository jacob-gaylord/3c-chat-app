import * as fs from 'fs';
import * as path from 'path';

describe('Docker Configuration Tests', () => {
  describe('Dockerfile', () => {
    let dockerfileContent: string;

    beforeAll(() => {
      const dockerfilePath = path.join(__dirname, '../../Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);
      dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    });

    test('should use Node.js Alpine base image', () => {
      expect(dockerfileContent).toContain('FROM node:20-alpine AS base');
    });

    test('should use corepack to enable pnpm', () => {
      expect(dockerfileContent).toContain('corepack enable pnpm');
    });

    test('should have multi-stage build with deps stage', () => {
      expect(dockerfileContent).toContain('FROM base AS deps');
    });

    test('should have builder stage', () => {
      expect(dockerfileContent).toContain('FROM base AS builder');
    });

    test('should have runner stage', () => {
      expect(dockerfileContent).toContain('FROM base AS runner');
    });

    test('should copy standalone output', () => {
      expect(dockerfileContent).toContain('COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./');
      expect(dockerfileContent).toContain('COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static');
    });

    test('should expose correct port', () => {
      expect(dockerfileContent).toContain('EXPOSE 3000');
    });

    test('should set correct start command', () => {
      expect(dockerfileContent).toContain('CMD ["node", "server.js"]');
    });

    test('should create nextjs user for security', () => {
      expect(dockerfileContent).toContain('addgroup --system --gid 1001 nodejs');
      expect(dockerfileContent).toContain('adduser --system --uid 1001 nextjs');
    });

    test('should set correct user ownership', () => {
      expect(dockerfileContent).toContain('chown nextjs:nodejs');
    });

    test('should run as non-root user', () => {
      expect(dockerfileContent).toContain('USER nextjs');
    });
  });

  describe('Dockerignore', () => {
    let dockerignoreContent: string;

    beforeAll(() => {
      const dockerignorePath = path.join(__dirname, '../../.dockerignore');
      expect(fs.existsSync(dockerignorePath)).toBe(true);
      dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
    });

    test('should ignore node_modules', () => {
      expect(dockerignoreContent).toContain('node_modules');
    });

    test('should ignore .next directory', () => {
      expect(dockerignoreContent).toContain('.next');
    });

    test('should ignore git files', () => {
      expect(dockerignoreContent).toContain('.git');
    });

    test('should ignore README', () => {
      expect(dockerignoreContent).toContain('README.md');
    });

    test('should ignore development files', () => {
      expect(dockerignoreContent).toContain('.env.local');
      expect(dockerignoreContent).toContain('.env.development.local');
      expect(dockerignoreContent).toContain('.env.production.local');
    });
  });

  describe('Next.js Configuration', () => {
    let nextConfigContent: string;

    beforeAll(() => {
      const nextConfigPath = path.join(__dirname, '../../next.config.mjs');
      expect(fs.existsSync(nextConfigPath)).toBe(true);
      nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    });

    test('should have standalone output configured', () => {
      expect(nextConfigContent).toContain('output: "standalone"');
    });

    test('should be a valid ES module', () => {
      expect(nextConfigContent).toContain('export default');
    });
  });

  describe('Package.json Docker Compatibility', () => {
    let packageJsonContent: any;

    beforeAll(() => {
      const packagePath = path.join(__dirname, '../../package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
      const content = fs.readFileSync(packagePath, 'utf8');
      packageJsonContent = JSON.parse(content);
    });

    test('should have build script', () => {
      expect(packageJsonContent.scripts.build).toBe('next build');
    });

    test('should have start script', () => {
      expect(packageJsonContent.scripts.start).toBe('next start');
    });

    test('should use compatible Next.js version', () => {
      expect(packageJsonContent.dependencies.next).toBeDefined();
    });
  });

  describe('Docker Build Simulation', () => {
    test('should validate Dockerfile syntax', () => {
      const dockerfilePath = path.join(__dirname, '../../Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      // Check for common Dockerfile syntax issues
      const lines = content.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        // Check that FROM, RUN, COPY, WORKDIR, etc. are properly formatted
        if (line.startsWith('FROM ')) {
          expect(line).toMatch(/^FROM\s+\S+(\s+AS\s+\S+)?$/);
        }
        
        if (line.startsWith('WORKDIR ')) {
          expect(line).toMatch(/^WORKDIR\s+\S+$/);
        }
        
        if (line.startsWith('EXPOSE ')) {
          expect(line).toMatch(/^EXPOSE\s+\d+$/);
        }
        
        if (line.startsWith('USER ')) {
          expect(line).toMatch(/^USER\s+\S+$/);
        }
      });
    });

    test('should have logical stage progression', () => {
      const dockerfilePath = path.join(__dirname, '../../Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      const stageOrder = [];
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('FROM ') && line.includes(' AS ')) {
          const stageName = line.split(' AS ')[1].trim();
          stageOrder.push(stageName);
        }
      }
      
      expect(stageOrder).toEqual(['base', 'deps', 'builder', 'runner']);
    });
  });
});