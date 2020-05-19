import CloudNotes from "./Notes"
import iCloudApps from "./cloudApplications";
import iCloudSession from "../session";

export default class Apps {
    notes: CloudNotes;

    constructor(session: iCloudSession) {
        this.notes = new CloudNotes(session);
    }

    static getTopics(): string[] {
        const topics: string[] = [];
        Object.values(iCloudApps).forEach(value => {
            for (let [k, v] of Object.entries(value)) {
                if (k === "pushTopic" && v !== null && v !== undefined) {
                    topics.push(v as string);
                }
            }
        });
        return topics;
    }
}