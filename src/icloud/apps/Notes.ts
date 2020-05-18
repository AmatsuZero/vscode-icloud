import { EventEmitter } from "events";

enum NodeRecordType {
	foler = "Folder",
	note = "Note",
	noteUserSpecific = "Note_UserSpecific"
}

interface NoteFolder {
	recordType: NodeRecordType
}

class CloudNotes extends EventEmitter {
	private _folders: string[] = [];
	private _records: string[] = [];
	private _notes: string[] = [];
	requestId: number = 0;

	fetch() {

	}

	private lookup() {

	}
}
