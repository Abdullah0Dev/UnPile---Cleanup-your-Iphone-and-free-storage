/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
}

export async function searchPexelsImages(
  query: string,
  count: number = 1,
): Promise<{ imageUrl: string; alt: string; photographer: string }[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ PEXELS_API_KEY not set – skipping image search.");
    return [];
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    if (!res.ok) {
      console.warn(`Pexels search failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const data: PexelsSearchResponse = await res.json();

    return data.photos.map((photo) => ({
      imageUrl: photo.src.original,
      alt: photo.alt || query,
      photographer: photo.photographer,
    }));
  } catch (err: any) {
    console.warn(`Pexels request error: ${err.message}`);
    return [];
  }
}
