// Define your exported module types here.
export type AnalysisResult = {
  screenshots: string[];
  duplicates: string[][];
  blurry: string[];
  livePhotos: string[];
  totalSavingsBytes: number;
};

export type ProgressEvent = {
  progress: number;
  category: string;
};
