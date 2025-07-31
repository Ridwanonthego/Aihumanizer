
export interface AnalysisDetail {
  rating: string;
  analysis: string;
}

export interface AnalysisResult {
  aiScore: number;
  summary: string;
  perplexity: AnalysisDetail;
  burstiness: AnalysisDetail;
  uniformity: AnalysisDetail;
}
