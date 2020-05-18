import * as vscode from 'vscode';
import { join } from "path";
import { iCloudState, iCloud } from './icloud';

const icloud = new iCloud("");

icloud.on(iCloudState.twoFactorAuthentication, async (email, password) => {
	const code = await vscode.window.showInputBox({
		prompt: "输入验证码",
		ignoreFocusOut: true
	});
	try {
		await icloud.enterSecureCodeAndLogin(code ? code : "", email, password);
	} catch (err) {
		vscode.window.showErrorMessage(err.message);
	}
});

icloud.on(iCloudState.error, async (errCode: number, msg: string) => {
	switch (errCode) {
	case 6: {
		let options = {
			password: false,
			placeHolder: "john@abc.com",
			prompt: "输入苹果账户邮箱",
			ignoreFocusOut: true,
		};
		const email = await vscode.window.showInputBox(options);
		options.password = true;
		options.placeHolder = "";
		options.prompt = "输入账户密码";
		const password = await vscode.window.showInputBox(options);
		try {
			await icloud.login(email ? email : "", password ? password : "");
		} catch (err) {
			vscode.window.showErrorMessage(err.message);
		}
	}
		break;
	default:
		vscode.window.showErrorMessage(msg);
		break;
	}
});

icloud.on(iCloudState.ready, () => {
	vscode.window.showInformationMessage("会话建立成功");
});

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('vscode-icloud.login',  async () => {
		await icloud.prepare("", join(`${context.globalStoragePath}`, 'session.json'));
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {
	icloud.removeAllListeners();
}
