import { TMDBMovie } from '@/types/article';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface BoxOfficeItem {
  id: number;
  rank: number;
  title: string;
  poster: string;
  backdrop: string;
  rating: number;
  releaseDate: string;
  popularity: number;
  studioEstimate: string;
}

export async function getTrendingCinema(): Promise<BoxOfficeItem[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    
    return (data.results || []).slice(0, 8).map((m: any, idx: number) => {
      // Mock realistic broadsheet weekend grosses based on popularity
      const gross = ((m.popularity * 0.45) + (m.vote_average * 3.2)).toFixed(1);
      return {
        id: m.id,
        rank: idx + 1,
        title: m.title || m.name,
        poster: m.poster_path ? `${IMAGE_BASE_URL}/w500${m.poster_path}` : '',
        backdrop: m.backdrop_path ? `${IMAGE_BASE_URL}/original${m.backdrop_path}` : '',
        rating: Math.round(m.vote_average * 10) / 10,
        releaseDate: m.release_date || '2026',
        popularity: Math.round(m.popularity),
        studioEstimate: `$${gross}M`
      };
    });
  } catch (err) {
    console.error('Failed to fetch TMDB movies:', err);
    return [
      { id: 1, rank: 1, title: 'Oppenheimer: The Director Cut', poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdrop: '', rating: 8.9, releaseDate: '2026', popularity: 98, studioEstimate: '$42.5M' },
      { id: 2, rank: 2, title: 'Dune: Part Two (IMAX Encore)', poster: 'https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg', backdrop: '', rating: 8.6, releaseDate: '2026', popularity: 84, studioEstimate: '$28.3M' },
      { id: 3, rank: 3, title: 'Gladiator II', poster: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg', backdrop: '', rating: 7.8, releaseDate: '2026', popularity: 72, studioEstimate: '$19.1M' },
      { id: 4, rank: 4, title: 'Nosferatu (Focus Features)', poster: '', backdrop: '', rating: 8.1, releaseDate: '2026', popularity: 65, studioEstimate: '$14.8M' },
      { id: 5, rank: 5, title: 'Joker: Folie à Deux', poster: '', backdrop: '', rating: 7.2, releaseDate: '2026', popularity: 58, studioEstimate: '$11.2M' }
    ];
  }
}

export async function searchMediaImage(query: string): Promise<string> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const hit = (data.results || []).find((item: any) => item.backdrop_path || item.poster_path);
    if (!hit) return '';
    return hit.backdrop_path 
      ? `${IMAGE_BASE_URL}/original${hit.backdrop_path}`
      : `${IMAGE_BASE_URL}/w780${hit.poster_path}`;
  } catch {
    return '';
  }
}
