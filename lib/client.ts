"use client";

import axios, { AxiosError } from "axios";
import type { ApiError } from "./types";

export async function apiGet<T>(url: string): Promise<T> {
  const response = await axios.get<{ data: T }>(url);
  return response.data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await axios.post<{ data: T }>(url, body);
  return response.data.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await axios.put<{ data: T }>(url, body);
  return response.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await axios.patch<{ data: T }>(url, body);
  return response.data.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await axios.delete<{ data: T }>(url);
  return response.data.data;
}

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.data?.error ?? axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
