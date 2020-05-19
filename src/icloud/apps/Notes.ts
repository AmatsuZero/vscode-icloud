import { EventEmitter } from "events";
import fetch, { Response } from "node-fetch";
import { URL } from 'url';
import iCloudSession from "../session";

enum NodeRecordType {
	folder = "Folder",
	note = "Note",
	noteUserSpecific = "Note_UserSpecific"
}

const zones = (syncToken?: string) => Object.freeze({
	"zones": [
		{
			"zoneID": {
				"zoneName": "Notes",
				"zoneType": "REGULAR_CUSTOM_ZONE"
			},
			"desiredKeys": [
				"TitleEncrypted",
				"SnippetEncrypted",
				"FirstAttachmentUTIEncrypted",
				"FirstAttachmentThumbnail",
				"FirstAttachmentThumbnailOrientation",
				"ModificationDate",
				"Deleted",
				"Folders",
				"Folder",
				"Attachments",
				"ParentFolder",
				"Folder",
				"Note",
				"LastViewedModificationDate",
				"MinimumSupportedNotesVersion"
			],
			"desiredRecordTypes": [
				"Note",
				"SearchIndexes",
				"Folder",
				"PasswordProtectedNote",
				"User",
				"Users",
				"Note_UserSpecific",
				"cloudkit.share"
			],
			"syncToken": syncToken,
			"reverse": true
		}
	]
});

interface NoteRecord {
	recordType: NodeRecordType
	recordName: string
}

export default class CloudNotes extends EventEmitter {
	private _records: NoteRecord[] = [];
	requestId: number = 0;
	private session: iCloudSession;
	private _host?: URL;

	constructor(session: iCloudSession) {
		super();
		this.session = session;
	}

	get baseURL(): URL {
		if (this._host !== undefined) {
			return this._host;
		}
		const host = this.session.push.account["webservices"]["ckdatabasews"] as string;
		this._host = new URL(host);
		return this._host;
	}

	private _buildURL(path: string, params?: Map<string, string>): URL {
		const url = new URL(path, this.baseURL);
		url.searchParams.append("clientBuildNumber", this.session.push.clientMasteringNumber);
		url.searchParams.append("clientId", this.session.push.clientID);
		url.searchParams.append("clientMasteringNumber", this.session.push.clientMasteringNumber);
		const dsid = this.session.push.account["disInfo"]["dsid"];
		if (dsid !== undefined) {
			url.searchParams.append("dsid", dsid);
		}
		if (params !== undefined) {
			for (let [key, value] of params) {
				url.searchParams.append(key, value);
			}
		}
		return url;
	}

	private async _zone(syncToken?: string) {
		const body = zones(syncToken);
		const url = this._buildURL("/database/1/com.apple.notes/production/private/changes/zone");

	}

	private async _lookup(records: NoteRecord[]): Promise<Response> {
		const body = JSON.stringify({
			"records": records.map(record => ({
				"recordName": typeof record === "object" ? record.recordName : record
			})),
			"zoneID": {
				"zoneName": "Notes"
			}
		});
		const params = new Map();
		params.set("remapEnums", "true");
		params.set("ckjsVersion", "2.0");
		const headers = {
			'Host': this.baseURL.hostname,
			'Cookie': this.session.auth.cookieString,
			'Content-Length': body.length.toString()
		};
		const url = this._buildURL("/database/1/com.apple.notes/production/private/records/lookup", params);
		return fetch(url, {
			headers: {...headers, ...this.session.push.defaultHeaders},
			body
		});
	}

	private get _folders(): NoteRecord[] {
		return this._records.filter(record => record.recordType === NodeRecordType.folder)
	}

	private get _notes(): NoteRecord[] {
		return this._records.filter(record => record.recordType === NodeRecordType.note
			|| record.recordType == NodeRecordType.noteUserSpecific)
	}
}
