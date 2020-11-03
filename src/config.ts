
export interface Config {
    port: number;
    debugLogging: boolean;
    databaseUrl: string;
    entities: string[];
    PROJECT_URL: string;
    SNAPSHOT: string;
    SOURCE_DISK: string;
    SOURCE_DISK_ZONE: string;
}

const isDevMode = process.env.NODE_ENV === "dev";
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)

const config: Config = {
    port: isDevMode ? 4040 : 5050,
    debugLogging: isDevMode,
    databaseUrl: isDevMode ? "mongodb://localhost:27017/gcp" : "mongodb://database/gcp",
    entities: isDevMode ? ["src/entities/*.ts"] : ["dist/entities/*.js"],
    PROJECT_URL: "projects/gcp-test-293701",
    SNAPSHOT: "snapshot-1",
    SOURCE_DISK: "gcp-test",
    SOURCE_DISK_ZONE: "us-central1-a",
};

export { config };
