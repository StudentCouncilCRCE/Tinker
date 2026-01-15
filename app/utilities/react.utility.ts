import { toast } from "sonner";
import type { ApiResponse } from "./types/api.types";

export function toastResponse(data: ApiResponse) {
    if (!data.success) toast.error(data.error.message);
    else if (data.message) toast.success(data.message);
}