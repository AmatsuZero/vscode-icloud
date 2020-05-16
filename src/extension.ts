import * as vscode from 'vscode';
import icloud from './icloud';

export function activate(context: vscode.ExtensionContext) {


	let disposable = vscode.commands.registerCommand('vscode-icloud.enter', () => {
		
		vscode.window.showInformationMessage('Hello Daubert!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
