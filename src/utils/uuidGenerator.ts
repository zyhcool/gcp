import * as uuid from "uuid";

export function getUUid() {
    return uuid.v4().replace(/-/g, '');
}