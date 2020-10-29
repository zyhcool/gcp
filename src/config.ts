
export interface Config {
    port: number;
    debugLogging: boolean;
    databaseUrl: string;
    entities: string[];
}

const isDevMode = process.env.NODE_ENV === "dev";
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)

const config: Config = {
    port: isDevMode ? 4040 : 5050,
    debugLogging: isDevMode,
    databaseUrl: isDevMode ? "mongodb://localhost:27017/gcp" : "mongodb://database/gcp",
    entities: isDevMode ? ["src/entities/*.ts"] : ["dist/entities/*.js"],
};

export { config };
