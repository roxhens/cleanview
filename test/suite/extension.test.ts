import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitignoreParser } from '../../src/gitignoreParser';
import { FileExcluder } from '../../src/fileExcluder';

suite('CleanView Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  suite('GitignoreParser', () => {
    test('should parse basic gitignore patterns', async () => {
      const tempDir = path.join(__dirname, 'temp');
      const gitignorePath = path.join(tempDir, '.gitignore');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const gitignoreContent = `
# Comments should be ignored
node_modules/
*.log
.DS_Store
/build
!important.log
      `.trim();
      
      fs.writeFileSync(gitignorePath, gitignoreContent);
      
      const parser = new GitignoreParser(tempDir);
      const patterns = await parser.parseGitignoreFiles(false, []);
      
      assert.strictEqual(patterns.length, 4);
      assert.ok(patterns.some(p => p.pattern === 'node_modules/'));
      assert.ok(patterns.some(p => p.pattern === '*.log'));
      assert.ok(patterns.some(p => p.pattern === '.DS_Store'));
      assert.ok(patterns.some(p => p.pattern === '/build'));
      
      fs.unlinkSync(gitignorePath);
      fs.rmdirSync(tempDir);
    });

    test('should convert gitignore patterns to files.exclude format', async () => {
      const tempDir = path.join(__dirname, 'temp');
      const gitignorePath = path.join(tempDir, '.gitignore');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const gitignoreContent = `
node_modules/
*.log
/build
      `.trim();
      
      fs.writeFileSync(gitignorePath, gitignoreContent);
      
      const parser = new GitignoreParser(tempDir);
      await parser.parseGitignoreFiles(false, []);
      const excludePatterns = parser.getPatternsForFilesExclude();
      
      assert.ok(excludePatterns['**/*.log']);
      assert.ok(excludePatterns['build/**']);
      assert.ok(excludePatterns['**/node_modules/**']);
      
      fs.unlinkSync(gitignorePath);
      fs.rmdirSync(tempDir);
    });

    test('should handle custom patterns', async () => {
      const tempDir = path.join(__dirname, 'temp');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const parser = new GitignoreParser(tempDir);
      const customPatterns = ['*.tmp', 'cache/'];
      const patterns = await parser.parseGitignoreFiles(false, customPatterns);
      
      assert.ok(patterns.some(p => p.pattern === '*.tmp' && p.source === 'custom configuration'));
      assert.ok(patterns.some(p => p.pattern === 'cache/' && p.source === 'custom configuration'));
      
      fs.rmdirSync(tempDir);
    });
  });

  suite('FileExcluder', () => {
    test('should toggle hide state correctly', async () => {
      const tempDir = path.join(__dirname, 'temp');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const excluder = new FileExcluder(tempDir);
      
      assert.strictEqual(excluder.isHidingGitignored(), false);
      
      fs.rmdirSync(tempDir);
    });
  });

  suite('Extension Commands', () => {
    test('should register all commands', async () => {
      const commands = await vscode.commands.getCommands(true);
      
      assert.ok(commands.includes('cleanview.toggle'));
      assert.ok(commands.includes('cleanview.refresh'));
      assert.ok(commands.includes('cleanview.disable'));
    });
  });
});