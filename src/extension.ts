import * as vscode from 'vscode';
import * as path from 'path';
import { FileExcluder } from './fileExcluder';

let fileExcluder: FileExcluder | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let gitignoreWatcher: vscode.FileSystemWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  
  if (!workspaceFolder) {
    vscode.window.showInformationMessage('CleanView: No workspace folder found');
    return;
  }

  const workspaceRoot = workspaceFolder.uri.fsPath;
  fileExcluder = new FileExcluder(workspaceRoot);
  
  // Set the extension context for the FileExcluder
  FileExcluder.setExtensionContext(context);

  registerCommands(context);
  setupStatusBar(context);
  setupGitignoreWatcher(context, workspaceRoot);
  
  const config = vscode.workspace.getConfiguration('cleanview');
  const autoHide = config.get<boolean>('autoHide', true);
  
  if (autoHide) {
    fileExcluder.hideGitignored().then(() => {
      updateStatusBar();
    }).catch(error => {
      console.error('CleanView: Failed to auto-hide gitignored files:', error);
    });
  }

  updateStatusBar();
}

export function deactivate() {
  if (fileExcluder) {
    fileExcluder.disableCleanView();
  }
  
  if (statusBarItem) {
    statusBarItem.dispose();
  }
  
  if (gitignoreWatcher) {
    gitignoreWatcher.dispose();
  }
}

function registerCommands(context: vscode.ExtensionContext) {
  const toggleCommand = vscode.commands.registerCommand('cleanview.toggle', async () => {
    if (!fileExcluder) {
      vscode.window.showErrorMessage('CleanView: Extension not properly initialized');
      return;
    }

    try {
      const isNowHiding = await fileExcluder.toggleHideGitignored();
      const message = isNowHiding ? 
        'CleanView: Gitignored files are now hidden' : 
        'CleanView: Gitignored files are now visible';
      
      vscode.window.showInformationMessage(message);
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`CleanView: ${error}`);
    }
  });

  const refreshCommand = vscode.commands.registerCommand('cleanview.refresh', async () => {
    if (!fileExcluder) {
      vscode.window.showErrorMessage('CleanView: Extension not properly initialized');
      return;
    }

    try {
      await fileExcluder.refreshPatterns();
      vscode.window.showInformationMessage('CleanView: Gitignore patterns refreshed');
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`CleanView: Failed to refresh patterns - ${error}`);
    }
  });

  const disableCommand = vscode.commands.registerCommand('cleanview.disable', async () => {
    if (!fileExcluder) {
      vscode.window.showErrorMessage('CleanView: Extension not properly initialized');
      return;
    }

    try {
      await fileExcluder.disableCleanView();
      vscode.window.showInformationMessage('CleanView: Disabled');
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`CleanView: Failed to disable - ${error}`);
    }
  });

  context.subscriptions.push(toggleCommand, refreshCommand, disableCommand);
}

function setupStatusBar(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('cleanview');
  const showStatusBar = config.get<boolean>('showStatusBar', true);
  
  if (!showStatusBar) {
    return;
  }

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'cleanview.toggle';
  statusBarItem.tooltip = 'Click to toggle CleanView';
  
  context.subscriptions.push(statusBarItem);
  statusBarItem.show();
}

function setupGitignoreWatcher(context: vscode.ExtensionContext, workspaceRoot: string) {
  gitignoreWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceRoot, '**/.gitignore')
  );

  gitignoreWatcher.onDidCreate(async () => {
    if (fileExcluder?.isHidingGitignored()) {
      await fileExcluder.refreshPatterns();
      updateStatusBar();
      vscode.window.showInformationMessage('CleanView: Detected new .gitignore file, patterns updated');
    }
  });

  gitignoreWatcher.onDidChange(async () => {
    if (fileExcluder?.isHidingGitignored()) {
      await fileExcluder.refreshPatterns();
      updateStatusBar();
      vscode.window.showInformationMessage('CleanView: .gitignore changed, patterns updated');
    }
  });

  gitignoreWatcher.onDidDelete(async () => {
    if (fileExcluder?.isHidingGitignored()) {
      await fileExcluder.refreshPatterns();
      updateStatusBar();
      vscode.window.showInformationMessage('CleanView: .gitignore deleted, patterns updated');
    }
  });

  context.subscriptions.push(gitignoreWatcher);
}

function updateStatusBar() {
  if (!statusBarItem || !fileExcluder) {
    return;
  }

  const isHiding = fileExcluder.isHidingGitignored();
  const patterns = fileExcluder.getGitignorePatterns();
  
  if (isHiding) {
    statusBarItem.text = `$(eye-closed) CleanView (${patterns.length})`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
  } else {
    statusBarItem.text = `$(eye) CleanView`;
    statusBarItem.backgroundColor = undefined;
  }
}