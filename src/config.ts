
type Method = 'post' | 'put' | 'get' | 'delete'
interface IConfig {
    port: number;
    debugLogging: boolean;
    databaseUrl: string;
    entities: string[];
    PROJECT_ID: string;
    SERVICE_ACCOUNT: string;
    SKU_KEY: string;
    NETWORK_TAGS: Array<string>;
    SNAPSHOT: string;
    SOURCE_DISK: string;
    SOURCE_DISK_ZONE: string;
    EOG: {
        baseUrl: string,
        loginPath: string,
        loginMethod: Method,
        authPath: string,
        authMethod: Method,
        email: string,
        password: string,
        tokenExpireTime: number, // s
    };
    SECRET_FILE: string,
    SOURCE_INSTANCE: string,
    ENV: string
}

const isDevMode = process.env.NODE_ENV === "dev";
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)

const Config: IConfig = {
    port: isDevMode ? 4040 : 5050,
    debugLogging: isDevMode,
    databaseUrl: isDevMode ? "mongodb://localhost:8625/gcp" : "mongodb://database/gcp",
    entities: isDevMode ? ["src/entities/*.ts"] : ["dist/entities/*.js"],
    PROJECT_ID: "neat-bliss-301703",
    SERVICE_ACCOUNT: "gcptest@neat-bliss-301703.iam.gserviceaccount.com",
    SKU_KEY: "AIzaSyDr15tdXF5wQGPaKbYyvtkS8M3VfZjtYbE",
    NETWORK_TAGS: ['mongodb'],
    SNAPSHOT: "snapshot-1",
    SOURCE_DISK: "instance-1",
    SOURCE_DISK_ZONE: "us-central1-a",
    EOG: {
        baseUrl: 'http://34.96.179.189:880',
        loginPath: '/login',
        loginMethod: 'post',
        authPath: '/authorize',
        authMethod: 'post',
        email: '13105027620@163.com',
        password: '5c82bd64111990e96805554be1b25a16e656f86119fe622ac6213be0b0db07b4', // 哈希过的密码
        tokenExpireTime: 1 * 60 * 60,
    },
    SECRET_FILE: '/var/projects/gcp/auth/auth.json',
    SOURCE_INSTANCE: 'instance-1',
    ENV: 'qa',
};

export { Config };
