import { unstable_rethrow } from "next/navigation";
import { unexpectedError } from "@/server/http/incident";

type Handler<A extends unknown[]> = (...args: A) => Response | Promise<Response>;

// Every API route goes through this, see incident.ts for what the user and the log get.
export function safeRoute<A extends unknown[]>(handler: Handler<A>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      // redirect(), notFound() and Next's own bailouts work by throwing, they are not failures
      unstable_rethrow(err);
      return unexpectedError(err, args[0] instanceof Request ? args[0] : null);
    }
  };
}
