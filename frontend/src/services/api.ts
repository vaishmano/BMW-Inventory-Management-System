import axios, { AxiosInstance } from "axios";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";
const api: AxiosInstance = axios.create({ baseURL: API_BASE, timeout: 10000 });

export type GetItemsParams = {
  q?: string;
  filters?: Array<{ column: string; op: string; value?: any }>;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
};

export async function getItems(params: GetItemsParams): Promise<any> {
  try {
    const qParams: any = {};
    if (params.q) qParams.q = params.q;
    if (params.page) qParams.page = params.page;
    if (params.pageSize) qParams.pageSize = params.pageSize;
    if (params.sortField) qParams.sortField = params.sortField;
    if (params.sortOrder) qParams.sortOrder = params.sortOrder;
    if (params.filters) qParams.filters = JSON.stringify(params.filters);

    const res = await api.get("/items", { params: qParams });
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.error || err.message || "Failed to fetch items";
    throw new Error(message);
  }
}

export async function getItem(id: number | string): Promise<any> {
  try {
    const res = await api.get(`/items/${id}`);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.error || err.message || "Failed to fetch item";
    throw new Error(message);
  }
}

export async function deleteItem(id: number | string): Promise<any> {
  try {
    const res = await api.delete(`/items/${id}`);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.error || err.message || "Failed to delete item";
    throw new Error(message);
  }
}
