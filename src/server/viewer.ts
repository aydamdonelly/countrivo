import { cache } from "react";
import { GUEST_VIEWER, type Viewer } from "@/ui/types";

/** The relaunched site has no account or sign-in surface. */
export const getViewer = cache(async (): Promise<Viewer> => ({ ...GUEST_VIEWER }));
export const getPendingRequestCount = cache(async (): Promise<number> => 0);
