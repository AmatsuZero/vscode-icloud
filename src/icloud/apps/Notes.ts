import { EventEmitter } from "events";
import fetch, { Response } from "node-fetch";
import { URL } from 'url';
import * as zlib from "zlib";
import iCloudSession, { newID } from "../session";
import root from "../protobuf";

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

	private async _zone(syncToken?: string): Promise<Response> {
		const body = JSON.stringify(zones(syncToken));
		const url = this._buildURL("/database/1/com.apple.notes/production/private/changes/zone");
		const headers = {
			'Host': this.baseURL.hostname,
			'Cookie': this.session.auth.cookieString,
			'Content-Length': body.length.toString()
		};
		return fetch(url, {
			headers: { ...this.session.push.defaultHeaders, ...headers },
			body
		});
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
			headers: { ...this.session.push.defaultHeaders, ...headers },
			body
		});
	}

	private async _modify(body: string): Promise<Response> {
		const params = new Map();
		params.set("remapEnums", "true");
		params.set("ckjsVersion", "2.0");
		const url = this._buildURL("/database/1/com.apple.notes/production/private/records/modify");
		const headers = {
			'Host': url.hostname,
			'Cookie': this.session.auth.cookieString,
			'Content-Length': body.length.toString()
		};
		return fetch(url, {
			headers: { ...this.session.push.defaultHeaders, ...headers },
			body
		});
	}

	async createFolders(folders: string[]): Promise<Response> {
		// const operations = folders.map(folder => ({
		// 	"operationType": "create",
		// 	"record": {
		// 		"recordName": newID().toLowerCase(),
		// 		"fields": {
		// 			"TitleEncrypted": {
		// 				"value": Buffer.from(folder, "utf8").toString("base64")
		// 			}
		// 		},
		// 		"recordType": "Folder"
		// 	}
		// }));
		const body = JSON.stringify({
			"operations": [{
				"operationType": "create",
				"record": {
					"recordName": "d23e0ee1-7f72-41cd-b3c6-88e8d8452f51",
					"fields": {
						"TitleEncrypted": {
							"value": "TmV1",
							"type": "ENCRYPTED_BYTES"
						}
					},
					"recordType": "Folder"
				}
			}],
			"zoneID": {
				"zoneName": "Notes"
			}
		});

		return this._modify(body);
	}

	async resolve(...notes: any[]): Promise<any[]> {
		const url = this._buildURL("/database/1/com.apple.cloudkit/production/public/records/resolve");
		const body = JSON.stringify({
			"shortGUIDs": notes.map(note => ({
				"value": typeof note === "string" ? note : note.shortGUID
			}))
		});
		const headers = {
			'Host': url.hostname,
			'Cookie': this.session.auth.cookieString,
			'Content-Length': body.length.toString()
		};
		const response = await fetch(url, {
			headers: {...this.session.push.defaultHeaders, ...headers},
			body
		});
		const result = await response.json();
		const resuls: any[] = result.resuls;
		const records = resuls.map(res => res.rootRecord).map(record => {
			// Decrypt title & snippet
			record.fields.title = Buffer.from(record.fields.TitleEncrypted.value, "base64").toString();
			record.fields.snippet = Buffer.from(record.fields.SnippetEncrypted.value, "base64").toString();

			const data = Buffer.from(record.fields.TextDataEncrypted.value, "base64");
			record.fields.documentData = (data[0] === 0x1f && data[1] === 0x8b) ? zlib.gunzipSync(data) : zlib.inflateSync(data);
			
			// load protobuf definitions
			record.fields.document = root.lookup("versioned_document.Document", record.fields.documentData);
			record.fields.text = root.lookup("topotext.String", record.fields.document.version[record.fields.document.version.length - 1].data);

			return record;
		});
		return records;
	}

	private get _folders(): NoteRecord[] {
		return this._records.filter(record => record.recordType === NodeRecordType.folder);
	}

	private get _notes(): NoteRecord[] {
		return this._records.filter(record => record.recordType === NodeRecordType.note
			|| record.recordType === NodeRecordType.noteUserSpecific);
	}
}
