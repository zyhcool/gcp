
type Method = 'post' | 'put' | 'get' | 'delete'
interface IConfig {
    port: number;
    debugLogging: boolean;
    databaseUrl: string;
    entities: string[];
    PROJECT_ID: string;
    SKU_KEY: string;
    NETWORK_TAGS: Array<string>;
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
}

const isDevMode = process.env.NODE_ENV === "dev";
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)

const Config: IConfig = {
    port: isDevMode ? 4040 : 5050,
    debugLogging: isDevMode,
    databaseUrl: isDevMode ? "mongodb://localhost:8625/gcp" : "mongodb://database/gcp",
    entities: isDevMode ? ["src/entities/*.ts"] : ["dist/entities/*.js"],
    PROJECT_ID: "gcp-test-293701",
    SKU_KEY: "AIzaSyDAya1jNjQmt1x7ViBWV01W-hafSuA6r7s",
    NETWORK_TAGS: ['mongodb'],
    EOG: {
        baseUrl: 'http://localhost:3100',
        loginPath: '/login',
        loginMethod: 'post',
        authPath: '/authorize',
        authMethod: 'put',
        email: 'zhengyuhua@bnqkl.net',
        password: 'fakepwd', // 哈希过的密码
        tokenExpireTime: 24 * 60 * 60,
    }
};

export { Config };
