export class Cache {
    private static cache = new Map<string, any>();

    static set(key: string, value: any) {
        this.cache.set(key, value);
    }

    static get(key: string) {
        return this.cache.get(key);
    }
}
