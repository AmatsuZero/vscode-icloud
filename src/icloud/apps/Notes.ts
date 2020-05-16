import path from "path";
import { EventEmitter } from "events";
import zlib from "zlib";
import protobuf from "protobufjs";
import got from "got";

class CloudNotes extends EventEmitter {
	private _folders: string[] = [];
	private _records: string[] = [];
	requestId: number = 0;

	fetch() {

	}

	private lookup() {

	}
}
