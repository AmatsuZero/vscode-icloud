import * as protobuf from "protobufjs";
import { extname } from "path";
import * as fs from "fs";
import { Root } from "protobufjs";

class ProtobufSupport {
    private _paths: string[] = [];
    private _protobufRoot?: Root;

    get protoBufferFiles(): string[] {
        if (this._paths.length > 0) {
            return this._paths;
        }
        this._paths = fs.readdirSync(__dirname).filter(path => extname(path) === "proto");
        return this._paths;
    }

    get protobufRoot(): Root {
        if (this._protobufRoot === undefined) {
            this._protobufRoot = protobuf.loadSync(this._paths);
        }
        return this._protobufRoot;
    }

    lookupType(type: string, data: Uint8Array) {
        const obj = this.protobufRoot.lookupType(type);
        return obj.decode(data);
    }
}

export const ProtobufFiles = new ProtobufSupport();