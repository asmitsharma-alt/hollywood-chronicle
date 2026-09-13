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
      { id: 1, rank: 1, title: 'Pushpa 2: The Rule', poster: 'https://image.tmdb.org/t/p/w500/1T21FblunT0y8fz7YaW8JMYgUKm.jpg', backdrop: 'https://image.tmdb.org/t/p/original/5nEyyLkElpD7zkqh41aSkTCchcc.jpg', rating: 9.1, releaseDate: '2026', popularity: 120, studioEstimate: '₹280 Cr' },
      { id: 2, rank: 2, title: 'Kalki 2898 AD', poster: 'https://image.tmdb.org/t/p/w500/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg', backdrop: 'https://image.tmdb.org/t/p/original/o8XSR1SONnjcsv84NRu6Mwsl5io.jpg', rating: 8.8, releaseDate: '2026', popularity: 110, studioEstimate: '₹210 Cr' },
      { id: 3, rank: 3, title: 'Stree 2 (Maddock Films)', poster: 'https://image.tmdb.org/t/p/w500/nfnhwfUEFuSOxxf4jDdBlY6Lccw.jpg', backdrop: 'https://image.tmdb.org/t/p/original/fVV0A67kDjTTQ4CvUn8LoletRmI.jpg', rating: 8.4, releaseDate: '2026', popularity: 95, studioEstimate: '₹145 Cr' },
      { id: 4, rank: 4, title: 'Dune: Part Two (IMAX Encore)', poster: 'https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg', backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520QIe.jpg', rating: 8.6, releaseDate: '2026', popularity: 84, studioEstimate: '$28.3M' },
      { id: 5, rank: 5, title: 'Gladiator II', poster: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg', backdrop: 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnExvufEmbL1ovV.jpg', rating: 7.8, releaseDate: '2026', popularity: 72, studioEstimate: '$19.1M' },
      { id: 6, rank: 6, title: 'Nosferatu (Focus Features)', poster: 'https://image.tmdb.org/t/p/w500/5qGIxdEO841C0tdY8vOdLoRVrr0.jpg', backdrop: '', rating: 8.1, releaseDate: '2026', popularity: 65, studioEstimate: '$14.8M' }
    ];
  }
}

export async function searchMediaImage(query: string): Promise<string> {
  if (!query) return '';

  try {
    // 1. Primary multi-search
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const hit = (data.results || []).find((item: any) => item.backdrop_path || item.poster_path || item.profile_path);
      if (hit) {
        if (hit.backdrop_path) return `${IMAGE_BASE_URL}/original${hit.backdrop_path}`;
        if (hit.poster_path) return `${IMAGE_BASE_URL}/w780${hit.poster_path}`;
        if (hit.profile_path) return `${IMAGE_BASE_URL}/original${hit.profile_path}`;
      }
    }

    // 2. Fallback: Search person if query has star name
    const personRes = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`,
      { next: { revalidate: 3600 } }
    );
    if (personRes.ok) {
      const pData = await personRes.json();
      const personHit = (pData.results || []).find((p: any) => p.profile_path);
      if (personHit) return `${IMAGE_BASE_URL}/original${personHit.profile_path}`;
    }

    return '';
  } catch {
    return '';
  }
}
