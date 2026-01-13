import { LagResultDto } from "../types/lag-result.dto";
import { DatabaseSizeDto } from "../types/database-size.dto";
import type { DownsampleResultDto } from "../types/downsample-result.dto";

class ApiService {
  private baseUrl: URL;

  constructor() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as unknown;
    if (typeof baseUrl !== "string") {
      throw new Error(
        "VITE_API_BASE_URL is not defined in environment variables",
      );
    }
    this.baseUrl = new URL(baseUrl);
  }

  async getLagData(from: string, to: string): Promise<LagResultDto[]> {
    const params = new URLSearchParams({
      from,
      to,
    });
    const url = new URL(`lag?${params}`, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lag data: ${response.statusText}`);
    }

    const data = (await response.json()) as (Omit<LagResultDto, "createdAt"> & {
      createdAt: string;
    })[];

    // Transform dates from strings to Date objects
    return data.map((batch) => ({
      ...batch,
      createdAt: new Date(batch.createdAt),
    }));
  }

  async getLagDownsample(
    from: string,
    to: string,
  ): Promise<DownsampleResultDto[]> {
    const params = new URLSearchParams({ from, to });
    const url = new URL(`lag/downsample?${params}`, this.baseUrl);

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch downsampled lag data: ${response.statusText}`,
      );
    }

    const raw = (await response.json()) as (Omit<
      DownsampleResultDto,
      "bucketStart" | "bucketEnd"
    > & {
      bucketStart: string;
      bucketEnd: string;
    })[];
    return raw.map((r) => ({
      ...r,
      bucketStart: new Date(r.bucketStart),
      bucketEnd: new Date(r.bucketEnd),
    }));
  }

  async getDatabaseSize(): Promise<DatabaseSizeDto> {
    const url = new URL("lag/size", this.baseUrl);

    const response = await fetch(url.toString(), {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch database size: ${response.statusText}`);
    }

    return (await response.json()) as DatabaseSizeDto;
  }
}

// Export a singleton instance
export const apiService = new ApiService();
