import * as vscode from 'vscode';
import { GitignoreParser, GitignorePattern } from './gitignoreParser';

export class FileExcluder {
  private static readonly CLEANVIEW_KEY = 'cleanview.gitignorePatterns';
  private static extensionContext: vscode.ExtensionContext | undefined;
  private gitignoreParser: GitignoreParser;
  private isActive: boolean = false;
  private originalExcludePatterns: Record<string, boolean> = {};

  public static setExtensionContext(context: vscode.ExtensionContext): void {
    FileExcluder.extensionContext = context;
  }

  constructor(workspaceRoot: string) {
    this.gitignoreParser = new GitignoreParser(workspaceRoot);
  }

  public async toggleHideGitignored(): Promise<boolean> {
    if (this.isActive) {
      await this.showGitignored();
      return false;
    } else {
      await this.hideGitignored();
      return true;
    }
  }

  public async hideGitignored(): Promise<void> {
    if (this.isActive) {
      return;
    }

    const config = vscode.workspace.getConfiguration();
    const includeNested = config.get<boolean>('cleanview.includeNestedGitignore', true);
    const customPatterns = config.get<string[]>('cleanview.customPatterns', []);

    await this.gitignoreParser.parseGitignoreFiles(includeNested, customPatterns);
    const gitignoreExcludePatterns = this.gitignoreParser.getPatternsForFilesExclude();

    const currentExcludePatterns = config.get<Record<string, boolean>>('files.exclude', {});
    this.originalExcludePatterns = { ...currentExcludePatterns };

    const mergedPatterns = {
      ...currentExcludePatterns,
      ...gitignoreExcludePatterns
    };

    await config.update(
      'files.exclude', 
      mergedPatterns, 
      vscode.ConfigurationTarget.Workspace
    );

    await this.storeCleanViewPatterns(Object.keys(gitignoreExcludePatterns));
    this.isActive = true;
  }

  public async showGitignored(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    const cleanViewPatterns = await this.getStoredCleanViewPatterns();
    
    if (cleanViewPatterns.length === 0) {
      this.isActive = false;
      return;
    }

    const config = vscode.workspace.getConfiguration();
    const currentExcludePatterns = config.get<Record<string, boolean>>('files.exclude', {});
    
    const filteredPatterns: Record<string, boolean> = {};
    for (const [pattern, value] of Object.entries(currentExcludePatterns)) {
      if (!cleanViewPatterns.includes(pattern)) {
        filteredPatterns[pattern] = value;
      }
    }

    await config.update(
      'files.exclude', 
      filteredPatterns, 
      vscode.ConfigurationTarget.Workspace
    );

    await this.clearStoredCleanViewPatterns();
    this.isActive = false;
  }

  public async refreshPatterns(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    await this.showGitignored();
    await this.hideGitignored();
  }

  public async disableCleanView(): Promise<void> {
    await this.showGitignored();
  }

  public isHidingGitignored(): boolean {
    return this.isActive;
  }

  public getGitignorePatterns(): GitignorePattern[] {
    return this.gitignoreParser.getPatterns();
  }

  private async storeCleanViewPatterns(patterns: string[]): Promise<void> {
    // Store patterns in extension's global state instead of workspace settings
    const context = this.getExtensionContext();
    if (context) {
      await context.workspaceState.update(FileExcluder.CLEANVIEW_KEY, patterns);
    }
  }

  private async getStoredCleanViewPatterns(): Promise<string[]> {
    const context = this.getExtensionContext();
    if (context) {
      return context.workspaceState.get<string[]>(FileExcluder.CLEANVIEW_KEY, []);
    }
    return [];
  }

  private async clearStoredCleanViewPatterns(): Promise<void> {
    const context = this.getExtensionContext();
    if (context) {
      await context.workspaceState.update(FileExcluder.CLEANVIEW_KEY, undefined);
    }
  }

  private getExtensionContext(): vscode.ExtensionContext | undefined {
    // We need to pass the context from the extension
    return FileExcluder.extensionContext;
  }
}