import { EventEmitter } from "events";
import * as fs from "fs";
import { promisify } from "util";
import iCloudSession from "./session";

const readFileAsync = promisify(fs.readFile);

export enum iCloudState {
	ready = "ready",
	error = "err",
	twoFactorAuthentication = "twoFactorAuthentication"
}

export class iCloud extends EventEmitter {
	// LoggedIn is false because we can't be sure that the session is valid
	isLoggedIn = false;
	// enable push initially
	enablePush = false;
	private session: iCloudSession;
	private _sessionFile?: string;

	constructor(userName: string = "", password: string = "", session: iCloudSession | null = null) {
		super();
		const defaultSession = new iCloudSession(userName, password);
		this.session = Object.assign(defaultSession, session);
	}

	async prepare(userName: string = "", sessionFile: string = "") {
		this.sessionFile = sessionFile;
		if (this.sessionFile !== "***") {
			const contents = await readFileAsync(this.sessionFile, "utf8");
			this.session = JSON.parse(contents);
		}
		// Now, validate the session with checking for important aspects that show that the session can be used to get data (e.g. there need to be a token, some cookies and account info)
		this.isLoggedIn = this.session.auth.cookies.length > 0
			&& this.session.auth.token !== null
			&& Object.keys(this.session.push.account).length > 0
			&& (userName.length > 0 ? this.userName === userName : true);
		if (this.isLoggedIn && this.isCookieValid) { // If the session is valid, the client is ready! Emit the 'ready' event of the (self) instance
			this.session.logins.push(new Date().getTime());
			this.emit(iCloudState.ready);
		} else {   // If not, the session is invalid: An error event occurs and username and password arguments will be used for logging in and creating a new session
			try {
				if (this.sessionFile !== "***") {
					await this.login(this.userName, this.password);
				} else {
					this.emit(iCloudState.error, 6, "会话过期或无效");
				}
			} catch (e) { // Need login again; 
				this.emit(iCloudState.error, 6, "会话过期或无效");
			}
		}
	}

	async login(userName: string, password: string) {
		const authentication = await this.session.getAuthToken(userName, password);
		this.session.auth.token = authentication.token;
		this.session.clientSetting.xAppleIDSessionId = authentication.sessionID;
		this.session.clientSetting.scnt = authentication.scnt;
		const response = Object.assign({authType: ""}, authentication.response);
		this.session.twoFactorAuthentication = response.authType === "hsa2";
		if (this.session.twoFactorAuthenticationIsRequired) { // 需要二步验证
			this.emit(iCloudState.twoFactorAuthentication, userName, password);
		} else {
			await this._sessionUpdate(userName, password);
		}
	}

	private async _sessionUpdate(userName: string, password: string) {
		await this.session.update();
		this.isLoggedIn = true
		await this.session.getPushToken();
		this.userName = userName;
		this.password = password;
		this.session.auth.createdDate = new Date();
		this.session.logins.push(this.session.auth.createdDate.getTime());
		this.emit(iCloudState.ready);
	}

	async enterSecureCodeAndLogin(code: string, userName: string, password: string) {
		await this.session.enterSecurityCode(code);
		await this._sessionUpdate(userName, password);
	}

	set password(newValue: string) {
		this.session.password = newValue;
	}

	get password(): string {
		return this.session.password;
	}

	set userName(newValue: string) {
		this.session.username = newValue;
	}

	get userName(): string {
		return this.session.username;
	}

	get isCookieValid(): boolean {
		return this.session.auth.cookiesValidCheck();
	}

	set sessionFile(newValue: string) {
		this._sessionFile = fs.existsSync(newValue) ? (" " + newValue).substring(1) : undefined;
	}

	get sessionFile(): string { // 选择一个无法包含在 path 里面的字符，来标识文件不存在；
		return this._sessionFile ? this._sessionFile : "***";
	}
}
