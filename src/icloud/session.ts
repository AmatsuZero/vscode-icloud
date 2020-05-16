import { EventEmitter } from "events";
import Cookie from "cookie";
import fetch, { Response } from "node-fetch";
import {iCloudApps, getTopics} from "./apps"

declare type CookieType = { [key: string]: string }

declare type Authentication = {
	token: string | null,
	sessionID: string | null,
	scnt: string | null,
	response: any
}

class iCloudAuth {
	token: string | null = null;
	xAppleTwosvTrustToken: string | null = null;
	cookies: CookieType[] = [];
	createdDate?: Date;

	parseCookie(cookieStrings: string[]) {
		this.cookies = cookieStrings.map(cookie => Cookie.parse(cookie))
	}

	fillCookies(fill: CookieType) {

	}

	get cookieString(): string {
		return this.cookies.map(cookie => {
			return Object.keys(cookie)[0] + '="' + cookie[Object.keys(cookie)[0]] + '"';
		}).join("; ")
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
		})
	}
}

class iCloudPush {
	topics: string[];
	token: string | null = null;
	ttl = 43200
	courierUrl = ""
	registered: string[] = []

	constructor() {
		this.topics = getTopics()
	}
}

class iCloudClientSetting {
	language = "en-us";
	locale = "en_US";
	xAppleWidgetKey = "83545bf919730e51dbfba24e7e8a78d2";
	xAppleIDSessionId: string | null = null;
	timezone = "US/Pacific";
	clientBuildNumber = "17DProject78";
	clientMasteringNumber = "17D68";
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
	apps = iCloudApps;
	push: iCloudPush;
	account = {};
	logins: number[] = [];
	private baseURL = new URL("https://idmsa.apple.com");

	constructor(userName: string, password: string) {
		this.username = userName;
		this.password = password;
		this.auth = new iCloudAuth();
		this.clientSetting = new iCloudClientSetting();
		this.push = new iCloudPush();
	}

	get clientID(): string {
		const structure = [8, 4, 4, 4, 12];
		const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
		return structure
			.map(part => {
				let partStr = ""
				for (let i = 0; i < part; i++) {
					partStr += chars[Math.trunc(Math.random() * chars.length)]
				}
				return partStr
			})
			.join("-")
	}

	async accountLogin(trustToken: string | null = null): Promise<any> {
		const url = new URL("https://setup.icloud.com/setup/ws/1/accountLogin?");
		url.searchParams.append("clientBuildNumber", this.clientSetting.clientBuildNumber);
		url.searchParams.append("clientId", this.clientID);
		url.searchParams.append("clientMasteringNumber", this.clientSetting.clientMasteringNumber);
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
		})
	}

	async getAuthToken(): Promise<Authentication> {
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
			"accountName": this.username,
			"password": this.password,
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
			throw Error("No session token");
		}
		return {
			token,
			sessionID: response.headers.get("x-apple-id-session-id"),
			scnt: response.headers.get("scnt"),
			response: await response.json()
		}
	}

	async getPushToken(cookieStrings: string[]) {
		const url = new URL("/getToken?", "")
	}

	async login() {
		const authentication = await this.getAuthToken();
		this.auth.token = authentication.token;
		this.clientSetting.xAppleIDSessionId = authentication.sessionID;
		this.clientSetting.scnt = authentication.scnt;
		const response = Object.assign({authType: ""}, authentication.response);
		this.twoFactorAuthentication = response.authType === "hsa2";
		if (this.twoFactorAuthentication) {
			throw Error("Two-factor-authentication is required.")
		}
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
		// Do a complete new /accountLogin
		const lastAccountLoginResult = await this.accountLogin(this.auth.xAppleTwosvTrustToken);
		// Cookies from this can be used
		this.auth.fillCookies(lastAccountLoginResult.headers.get("set-cookie"));
	}

	private async __securityCode(body: { securityCode: { code: string }}): Promise<Response> {
		const signInReferer = new URL("/appleauth/auth/signin", this.baseURL);
		const xAppleIDSessionId = this.clientSetting.xAppleIDSessionId !== null ? this.clientSetting.xAppleIDSessionId : "";
		signInReferer.searchParams.append("widgetKey", xAppleIDSessionId);
		signInReferer.searchParams.append("locale", this.clientSetting.locale);
		signInReferer.searchParams.append("font", "sf");
		const url = new URL("/appleauth/auth/verify/trusteddevice/securitycode", this.baseURL);
		const headers = {
			'Content-Type': 'application/json',
			'Referer': signInReferer.href,
			'Host': this.baseURL.hostname,
			'Cookie': this.auth.cookieString,
			'X-Apple-Widget-Key': this.clientSetting.xAppleWidgetKey,
			'X-Apple-I-FD-Client-Info': JSON.stringify(this.clientSetting.xAppleIFDClientInfo),
			'X-Apple-ID-Session-Id': xAppleIDSessionId,
			'scnt': this.clientSetting.scnt !== null ? this.clientSetting.scnt : ""
		}
		return fetch(url, {
			method: "post",
			headers: {...headers, ...this.clientSetting.defaultHeaders},
			body: JSON.stringify(body)
		})
	}

	async trust() {
		const sigInReferer = new URL("/appleauth/auth/signin", this.baseURL);
		sigInReferer.searchParams.append("widgetKey", this.clientSetting.xAppleWidgetKey);
		sigInReferer.searchParams.append("locale", this.clientSetting.locale);
		sigInReferer.searchParams.append("font", "sf");
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
		}
		return fetch(url, {
			method: "post",
			headers: {...headers, ...this.clientSetting.defaultHeaders}
		})
	}

	get twoFactorAuthenticationIsRequired() {
		return this.twoFactorAuthentication && !this.auth.xAppleTwosvTrustToken && !this.securityCode;
	}
}
