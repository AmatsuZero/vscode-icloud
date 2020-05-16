import { EventEmitter } from "events";
import fs from "fs";
import iCloudSession from "./session";

enum iCloudState {
	ready = "ready",
	error = "err",
	progress = "progress"
}

export default class iCloud extends EventEmitter {
	// LoggedIn is false because we can't be sure that the session is valid
	isLoggedIn = false
	// enable push initially
	enablePush = false
	session: iCloudSession;
	sessionFile: string = "";

	constructor(userName: string, password: string, session: iCloudSession | string) {
		super();
		const defaultSession = new iCloudSession(userName, password);
		if (typeof session === "string") {
			this.sessionFile = (" " + session).substring(1);
			fs.readFile(session, "utf8", (err, contents) => {
				if (!err) this.session = Object.assign(defaultSession, JSON.parse(contents));
				this.prepare(userName);
			});
			this.session = defaultSession;
		} else {
			this.session = Object.assign(defaultSession, session);
			this.prepare(userName);
		}
	}

	private prepare(userName: string) {
		// Now, validate the session with checking for important aspects that show that the session can be used to get data (e.g. there need to be a token, some cookies and account info)
		this.isLoggedIn = this.session.auth.cookies.length > 0
			&& this.session.auth.token !== null
			&& Object.keys(this.session.account).length > 0
			&& (userName.length > 0 ? this.session.username === userName : true)
		if (this.isLoggedIn && this.isCookieValid) { // If the session is valid, the client is ready! Emit the 'ready' event of the (self) instance
			this.session.logins.push(new Date().getTime())
			this.emit(iCloudState.ready);
		} else {   // If not, the session is invalid: An error event occurs and username and password arguments will be used for logging in and creating a new session
			this.emit(iCloudState.error, {
				error: "Session is expired or invalid",
				code: 6
			});
			// 'progress' event of login is fired because it's an automatic aspect of the algorithm that it tries to login if the session was invalid
			this.emit(iCloudState.progress, {
				action: "start",
				parentAction: "login",
				progress: 0,
				message: "Trying to reset session and login"
			});
		}
	}

	login() {

	}

	get isCookieValid(): boolean {
		return this.session.auth.cookiesValidCheck();
	}
}
