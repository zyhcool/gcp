import ping from 'ping'

export default class NetworkTest {
    private static target: string = 'www.google.com'

    public static async test(target: string = this.target) {
        const res = await ping.promise.probe(target)
        return !!res.alive
    }
}