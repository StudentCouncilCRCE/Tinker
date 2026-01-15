import axios, { AxiosError, type AxiosResponse } from "axios";
import { ConsoleLogWriter } from "drizzle-orm";
import { toast } from "sonner";
import type { ApiResponse } from "~/utilities/types/api.types";

export const axiosClient = axios.create({
},);

axiosClient.interceptors.response.use(
    function onFulfilled(response: AxiosResponse) {
        const data: ApiResponse = response.data;
        if (data.success) toast.success(data.message);
        return response;
    }, function onRejected(error: AxiosError<ApiResponse>) {
        const data: ApiResponse = error.response?.data ?? {
            success: false, error: { message: "An unknown client side error occurred." }
        };
        if (!data.success) toast.error(data.error.message);
        return Promise.reject(error);
    });