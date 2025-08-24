import { LagResultDto } from '../types/lag-result.dto';

class ApiService {
  private baseUrl: URL;

  constructor() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL is not defined in environment variables');
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
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lag data: ${response.statusText}`);
    }

    const data: (Omit<LagResultDto, 'createdAt'> & { createdAt: string })[] = await response.json();

    // Transform dates from strings to Date objects
    return data.map((batch) => ({
      ...batch,
      createdAt: new Date(batch.createdAt),
    }));
  }
}

// Export a singleton instance
export const apiService = new ApiService();
