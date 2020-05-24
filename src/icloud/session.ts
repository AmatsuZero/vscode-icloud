import * as Cookie from "cookie";
import { Agent } from "https";
import { URL } from 'url';
import fetch, { Response } from "node-fetch";
import Apps from "./apps";

declare type CookieType = { [key: string]: string };

declare type Authentication = {
	token: string | null,
	sessionID: string | null,
	scnt: string | null,
	response: any
};

export function newID(): string {
	const structure = [8, 4, 4, 4, 12];
	const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
	return structure.map(part => {
		let partStr = "";
		for (let i = 0; i < part; i++) {
			partStr += chars[Math.trunc(Math.random() * chars.length)];
		}
		return partStr;
	}).join("-");
}

class iCloudAuth {
	token: string | null = null;
	xAppleTwosvTrustToken: string | null = null;
	cookies: CookieType[] = [];
	createdDate?: Date;

	fillCookies(fill: string[]) {
		const newCookies = fill.map(cookie => Cookie.parse(cookie));
		newCookies.forEach(cookie => {
			const name = Object.keys(cookie)[0];
			const index = this.cookies.findIndex(value => {
				return name === Object.keys(value)[0];
			});
			if (index === -1) {
				this.cookies.push(cookie);
			} else {
				this.cookies[index] = {...this.cookies[index], ...cookie};
			}
		});
	}

	get cookieString(): string {
		return this.cookies
		.map(cookie => Object.keys(cookie)[0] + '="' + cookie[Object.keys(cookie)[0]] + '"')
		.join("; ");
	}

	// Get list of cookies, represented to a boolean value whether the cookie is expired or no
	// ignore cookie which is expiring in 1970 --> so no extra code auth, when starting app
	cookiesValidCheck(): boolean {
		const timeStamp = new Date().getTime();
		return this.cookies.every(cookie => {
			if ('X-APPLE-WEBAUTH-HSA-LOGIN' in cookie && 'Expires' in cookie) {
				return true;
			} else {
				return new Date(cookie.Expires).getTime() - timeStamp >= 0;
			}
		});
	}
}

class iCloudPush {
	topics: string[];
	token: string | null = null;
	ttl = 43200;
	courierUrl = "";
	registered: string[] = [];
	account: any = {};
	language = "en-us";
	clientBuildNumber = "17DProject78";
	clientMasteringNumber = "17D68";
	private _clientID?: string;
	private _pushServiceURL?: URL

	constructor() {
		this.topics = Apps.getTopics();
	}

	async init() {
		const url = new URL("https://webcourier.push.apple.com/aps");
		url.searchParams.append("tok", this.token ? this.token : "");
		url.searchParams.append("ttl", this.ttl.toString());
		const agent = new Agent({
			rejectUnauthorized: false
		});
		return fetch(url, {
			headers: this.defaultHeaders,
			method: "get",
			agent
		});
	}

	private _createURLByPath(path: string): URL {
		const url = new URL(path, this.pushServiceURL);
		url.searchParams.append("attempt", "1");
		url.searchParams.append("clientBuildNumber", this.clientBuildNumber);
		url.searchParams.append("clientId", this.clientID);
		url.searchParams.append("clientMasteringNumber", this.clientMasteringNumber);
		url.searchParams.append("dsid", this.account["dsInfo"]["dsid"]);
		return url;
	}

	async getToken(cookiesStr: string): Promise<Response> {
		const body = JSON.stringify({
			"pushTopics": this.topics,
			"pushTokenTTL": this.ttl
		});
		const url = this._createURLByPath("/getToken");
		const headers = {
			'Host': url.hostname,
			'Cookie': cookiesStr,
			'Content-Length': body.length.toString()
		};
		return fetch(url, {
			body,
			method: "post",
			headers: {...headers, ...this.defaultHeaders}
		});
	}

	async registerTopics(cookieString: string): Promise<Response> {
		const body = JSON.stringify({
			"pushToken": this.token,
			"pushTopics": this.topics,
			"pushTokenTTL": this.ttl
		});
		const url = this._createURLByPath("/registerTopics");
		const headers = {
			'Host': url.hostname,
			'Cookie': cookieString,
		};
		return fetch(url, {
			method: "post",
			headers: {...this.defaultHeaders, ...headers},
			body
		});
	}

	async registerPush(service: string, cookieString: string): Promise<Response> {
		const body = JSON.stringify({
			"apnsToken": this.token,
			"clientID": this.clientID,
			"apnsEnvironment": "production"
		});
		const url = this._createURLByPath(`/device/1/${service}/production/tokens/register`);
		url.searchParams.delete("attempt");
		const headers = {
			'Host': url.hostname,
			'Cookie': cookieString,
		};
		return fetch(url, {
			method: "post",
			headers: {...this.defaultHeaders, ...headers},
			body
		});
	}

	async getStates(cookiesStr: string): Promise<Response> {
		const body = JSON.stringify({
			"pushTopics": this.topics
		});
		const url = this._createURLByPath("/getState");
		url.searchParams.append("pcsEnabled", "true");
		const headers = {
			'Host': url.hostname,
			'Cookie': cookiesStr,
			'Content-Length': body.length.toString()
		};
		return fetch(url, {
			method: "post",
			headers: {...this.defaultHeaders, ...headers},
			body
		});
	}

	get pushServiceURL(): URL | undefined {
		if (this._pushServiceURL !== undefined) {
			return this._pushServiceURL;
		}
		this._pushServiceURL =  new URL(this.account["webservices"]["push"]["url"]);
		return this._pushServiceURL;
	}

	get defaultHeaders(): {} {
		return {
			'Referer': 'https://www.icloud.com/',
			'Content-Type': 'text/plain',
			'Origin': 'https://www.icloud.com',
			'Host': '',
			'Accept': '*/*',
			'Connection': 'keep-alive',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Safari/604.1.25',
			'Cookie': '',
			'X-Requested-With': "XMLHttpRequest",
			'Accept-Language': this.language
		};
	}

	get clientID(): string {
		if (this._clientID === undefined) {
			this._clientID = newID();
		}
		return this._clientID;
	}
}

class iCloudClientSetting {
	locale = "en_US";
	xAppleWidgetKey = "83545bf919730e51dbfba24e7e8a78d2";
	xAppleIDSessionId: string | null = null;
	timezone = "US/Pacific";
	scnt: string | null = null;

	get xAppleIFDClientInfo(): {} {
		return {
			U: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1",
			L: this.locale,
			Z: "GMT+02:00",
			V: "1.1",
			F: ""
		}
	}
}

export default class iCloudSession {
	username: string;
	password: string;
	twoFactorAuthentication = false;
	private securityCode: string | null = null;
	auth: iCloudAuth;
	clientSetting: iCloudClientSetting;
	push: iCloudPush;
	logins: number[] = [];
	private baseURL = new URL("https://idmsa.apple.com");

	constructor(userName: string, password: string) {
		this.username = userName;
		this.password = password;
		this.auth = new iCloudAuth();
		this.clientSetting = new iCloudClientSetting();
		this.push = new iCloudPush();
	}

	async accountLogin(trustToken: string | null = null): Promise<any> {
		const url = new URL("https://setup.icloud.com/setup/ws/1/accountLogin?");
		url.searchParams.append("clientBuildNumber", this.push.clientBuildNumber);
		url.searchParams.append("clientId", this.push.clientID);
		url.searchParams.append("clientMasteringNumber", this.push.clientMasteringNumber);
		return fetch(url.href, {
			"method": "post",
			"body": JSON.stringify({
				"dsWebAuthToken": this.auth.token,
				"extended_login": true,
				"trustToken": trustToken
			}),
			headers: {
				'Content-Type': 'text/plain',
				'Referer': 'https://www.icloud.com/',
				'Accept': '*/*',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1',
				'Origin': 'https://www.icloud.com'
			}
		});
	}

	async getAuthToken(userName: string, password: string): Promise<Authentication> {
		// Define login client info object
		const xAppleIFDClientInfo = {
			"U": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1",
			"L": this.clientSetting.locale,
			"Z": "GMT+02:00",
			"V": "1.1",
			"F": ""
		};
		// Define data object with login info
		const loginData = {
			"accountName": userName,
			"password": password,
			"rememberMe": true,
			"trustTokens": []
		};
		const url = new URL("/appleauth/auth/signin", this.baseURL);
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				'Referer': url.href,
				'Accept': 'application/json, text/javascript, */*; q=0.01',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1',
				'Origin': this.baseURL.href,
				'X-Apple-Widget-Key': this.clientSetting.xAppleWidgetKey,
				'X-Requested-With': 'XMLHttpRequest',
				'X-Apple-I-FD-Client-Info': JSON.stringify(xAppleIFDClientInfo)
			},
			// Define data object with login info
			body: JSON.stringify(loginData),
			method: 'post'
		});
		const token = response.headers.get("x-apple-session-token");
		if (token === null) { // If the session token exists
			throw Error("获取 Token 失败，请检查密码或用户名是否正确");
		}
		return {
			token,
			sessionID: response.headers.get("x-apple-id-session-id"),
			scnt: response.headers.get("scnt"),
			response: await response.json()
		};
	}

	async enterSecurityCode(code: string) {
		// Enter the security code for current session
		const securityResult = await this.__securityCode({
			securityCode: { code }
		});
		// Trust the current device
		const trusting = await this.trust();
		// Use /trust's headers (X-Apple-Twosv-Trust-Token and new authentication token)
		this.auth.token = trusting.headers.get("x-apple-session-token");
		this.auth.xAppleTwosvTrustToken = trusting.headers.get("x-apple-twosv-trust-token");
		this.securityCode = code;
		// Do a complete new /accountLogin
		const lastAccountLoginResult = await this.accountLogin(this.auth.xAppleTwosvTrustToken);
		// Cookies from this can be used
		const newCookise = lastAccountLoginResult.headers.raw()["set-cookie"] as string[];
		this.auth.fillCookies(newCookise);
	}

	private _createURLByPath(path: string): URL {
		const url = new URL(path, this.baseURL);
		const xAppleIDSessionId = this.clientSetting.xAppleIDSessionId !== null ? this.clientSetting.xAppleIDSessionId : "";
		url.searchParams.append("widgetKey", xAppleIDSessionId);
		url.searchParams.append("locale", this.clientSetting.locale);
		url.searchParams.append("font", "sf");
		return url;
	}

	private async __securityCode(body: { securityCode: { code: string }}): Promise<Response> {
		const signInReferer = this._createURLByPath("/appleauth/auth/signin");
		const url = new URL("/appleauth/auth/verify/trusteddevice/securitycode", this.baseURL);
		const headers = {
			'Content-Type': 'application/json',
			'Referer': signInReferer.href,
			'Host': this.baseURL.hostname,
			'Cookie': this.auth.cookieString,
			'X-Apple-Widget-Key': this.clientSetting.xAppleWidgetKey,
			'X-Apple-I-FD-Client-Info': JSON.stringify(this.clientSetting.xAppleIFDClientInfo),
			'X-Apple-ID-Session-Id': this.clientSetting.xAppleIDSessionId !== null ? this.clientSetting.xAppleIDSessionId : "",
			'scnt': this.clientSetting.scnt !== null ? this.clientSetting.scnt : ""
		};
		return fetch(url, {
			method: "post",
			headers: {...this.push.defaultHeaders, ...headers},
			body: JSON.stringify(body)
		});
	}

	private async trust() {
		const sigInReferer = this._createURLByPath("/appleauth/auth/signin");
		const url = new URL("/appleauth/auth/2sv/trust", this.baseURL);
		const headers = {
			'Content-Type': 'application/json',
			'Referer': sigInReferer.href,
			'Host': this.baseURL.hostname,
			'Cookie': this.auth.cookieString,
			'X-Apple-Widget-Key': this.clientSetting.xAppleWidgetKey,
			'X-Apple-I-FD-Client-Info': JSON.stringify(this.clientSetting.xAppleIFDClientInfo),
			'X-Apple-ID-Session-Id': this.clientSetting.xAppleIDSessionId !== null ? this.clientSetting.xAppleIDSessionId : "",
			'scnt': this.clientSetting.scnt !== null ? this.clientSetting.scnt : ""
		};
		return fetch(url, {
			method: "post",
			headers: {...this.push.defaultHeaders, ...headers}
		});
	}

	async update() {
		const response = await this.accountLogin();
		const result = await response.json();
		this.push.account = Object.assign(this.push.account, result);
		const newCookies = response.headers.raw()["set-cookie"] as string[];
		this.auth.fillCookies(newCookies);
	}

	async registerTopics(): Promise<Response> {
		return this.push.registerTopics(this.auth.cookieString);
	}

	async getPushToken() {
		const response = await this.push.getToken(this.auth.cookieString);
		const result = await response.json();
		if (result["error"] !== 0) {
			throw Error(result["reason"]);
		}
		this.push.token = result["pushToken"];
		this.push.courierUrl = result["webCourierURL"];
	}

	async registerPush(service: string): Promise<Response> {
		return this.push.registerPush(service, this.auth.cookieString);
	}

	async getStates(): Promise<Response> {
		return this.push.getStates(this.auth.cookieString);
	}

	get twoFactorAuthenticationIsRequired() {
		return this.twoFactorAuthentication && !this.auth.xAppleTwosvTrustToken && !this.securityCode;
	}
}
