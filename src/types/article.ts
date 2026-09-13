export interface ArticleSource {
  name: string;
  url: string;
  stance?: 'corroborated' | 'primary' | 'rumor';
}

export interface Article {
  $id?: string;
  title: string;
  slug: string;
  lead_paragraph: string;
  body_markdown: string;
  category: 'Cinema' | 'Television' | 'Industry' | 'Box Office' | 'Awards' | 'Music' | string;
  author: string;
  verification_score: string;
  verification_summary: string;
  sources_json: string;
  image_url: string;
  image_caption: string;
  published_at: string;
  edition: string;
  is_breaking: boolean;
  status: 'published' | 'draft';
  $createdAt?: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  popularity: number;
}
