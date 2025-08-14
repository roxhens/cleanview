import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

export interface GitignorePattern {
  pattern: string;
  source: string;
}

export class GitignoreParser {
  private workspaceRoot: string;
  private ignoreInstance: ReturnType<typeof ignore>;
  private patterns: GitignorePattern[] = [];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.ignoreInstance = ignore();
  }

  public async parseGitignoreFiles(includeNested: boolean = true, customPatterns: string[] = []): Promise<GitignorePattern[]> {
    this.patterns = [];
    this.ignoreInstance = ignore();

    await this.parseGitignoreFile(this.workspaceRoot);
    
    if (includeNested) {
      await this.parseNestedGitignoreFiles();
    }

    if (customPatterns.length > 0) {
      this.addCustomPatterns(customPatterns);
    }

    return this.patterns;
  }

  private async parseGitignoreFile(directory: string): Promise<void> {
    const gitignorePath = path.join(directory, '.gitignore');
    
    try {
      if (fs.existsSync(gitignorePath)) {
        const content = await fs.promises.readFile(gitignorePath, 'utf8');
        const lines = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));

        for (const line of lines) {
          this.patterns.push({
            pattern: line,
            source: this.getRelativePath(gitignorePath)
          });
        }

        this.ignoreInstance.add(lines);
      }
    } catch (error) {
      console.warn(`Failed to read gitignore file: ${gitignorePath}`, error);
    }
  }

  private async parseNestedGitignoreFiles(): Promise<void> {
    const gitignoreFiles = await this.findAllGitignoreFiles();
    
    for (const gitignoreFile of gitignoreFiles) {
      if (gitignoreFile !== path.join(this.workspaceRoot, '.gitignore')) {
        await this.parseGitignoreFile(path.dirname(gitignoreFile));
      }
    }
  }

  private async findAllGitignoreFiles(): Promise<string[]> {
    const gitignoreFiles: string[] = [];
    
    const findGitignores = async (dir: string): Promise<void> => {
      try {
        const files = await fs.promises.readdir(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = await fs.promises.stat(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            await findGitignores(fullPath);
          } else if (file === '.gitignore') {
            gitignoreFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await findGitignores(this.workspaceRoot);
    return gitignoreFiles;
  }

  private addCustomPatterns(customPatterns: string[]): void {
    for (const pattern of customPatterns) {
      if (pattern.trim()) {
        this.patterns.push({
          pattern: pattern.trim(),
          source: 'custom configuration'
        });
      }
    }
    this.ignoreInstance.add(customPatterns);
  }

  private getRelativePath(absolutePath: string): string {
    return path.relative(this.workspaceRoot, absolutePath);
  }

  public shouldIgnoreFile(filePath: string): boolean {
    const relativePath = path.relative(this.workspaceRoot, filePath);
    return this.ignoreInstance.ignores(relativePath);
  }

  public getPatterns(): GitignorePattern[] {
    return this.patterns;
  }

  public getPatternsForFilesExclude(): Record<string, boolean> {
    const excludePatterns: Record<string, boolean> = {};
    
    for (const patternInfo of this.patterns) {
      const pattern = this.convertGitignoreToFilesExclude(patternInfo.pattern);
      if (pattern) {
        excludePatterns[pattern] = true;
      }
    }

    return excludePatterns;
  }

  private convertGitignoreToFilesExclude(gitignorePattern: string): string | null {
    let pattern = gitignorePattern;

    if (pattern.startsWith('!')) {
      return null;
    }

    if (pattern.endsWith('/')) {
      pattern = pattern.slice(0, -1);
    }

    if (pattern.startsWith('/')) {
      pattern = pattern.slice(1);
    } else {
      pattern = `**/${pattern}`;
    }

    if (!pattern.includes('*') && !pattern.includes('?')) {
      pattern = `${pattern}/**`;
    }

    return pattern;
  }
}