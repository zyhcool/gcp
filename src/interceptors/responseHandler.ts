import { Interceptor, InterceptorInterface, Action } from "routing-controllers";
import { Stream } from "stream";

@Interceptor()
export class ResponseHandler implements InterceptorInterface {
    intercept(action: Action, result: any) {
        if (result instanceof Stream) {
            return result;
        }
        return {
            success: true,
            data: result,
        };
    }
}
