import axios from 'axios';
import ytSearch from 'yt-search';
import config from '../config/index.js';
import logger from '../config/logger.js';

// YouTube API Key (from environment variables, with fallback)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBppQSyZoT5E93sP-cnaIsydqKzgakjwuo';

function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Searches for tracks on YouTube
 * @param {string} query Search terms
 * @returns {Promise<Array>} List of mapped track objects
 */
export const searchYouTube = async (query) => {
  const searchQuery = query.includes('official') || query.includes('lyrics') 
    ? query 
    : `${query} official audio`;

  const tryApi = async (keyToUse) => {
    logger.info(`Searching YouTube API v3 for: "${searchQuery}" with key`);
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 15,
        key: keyToUse
      }
    });

    const items = response.data.items || [];
    if (items.length === 0) throw new Error("API returned 0 items");

    return items.map(item => ({
      _id: item.id.videoId,
      videoId: item.id.videoId,
      title: decodeHtml(item.snippet.title),
      artist: decodeHtml(item.snippet.channelTitle),
      coverImage: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
      duration: 180, // Default duration if not querying contentDetails
      audioUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: 'youtube'
    }));
  };

  try {
    return await tryApi(YOUTUBE_API_KEY);
  } catch (error) {
    logger.warn(`Primary YouTube search API failed: ${error.message}. Trying fallback API key.`);
    try {
      const fallbackKey = 'AIzaSyBppQSyZoT5E93sP-cnaIsydqKzgakjwuo';
      if (YOUTUBE_API_KEY !== fallbackKey) {
        return await tryApi(fallbackKey);
      }
    } catch (err2) {
      // fallthrough
    }
    logger.warn(`Fallback YouTube search API failed. Falling back to yt-search.`);
    return await searchYouTubeFallback(searchQuery);
  }
};

/**
 * Fallback search using yt-search
 */
const searchYouTubeFallback = async (query) => {
  try {
    logger.info(`Performing yt-search fallback for: "${query}"`);
    const result = await ytSearch(query);
    const videos = result.videos || [];
    
    return videos.slice(0, 15).map(video => ({
      _id: video.videoId,
      videoId: video.videoId,
      title: video.title,
      artist: video.author.name,
      coverImage: video.image || video.thumbnail || '',
      duration: video.seconds || 180,
      audioUrl: video.url,
      source: 'youtube'
    }));
  } catch (err) {
    logger.error(`yt-search fallback failed: ${err.message}`);
    return [];
  }
};

/**
 * Finds a YouTube video for a given track (title + artist) using yt-search (no API key required).
 * Used to resolve a playable YouTube videoId for Spotify search results.
 * @param {string} title Song title
 * @param {string} artist Artist name
 * @returns {Promise<{videoId: string, audioUrl: string, coverImage: string} | null>}
 */
export const findYouTubeVideoForTrack = async (title, artist) => {
  try {
    const query = `${title} ${artist} official audio`;
    logger.info(`Finding YouTube video for track: "${query}"`);
    const result = await ytSearch(query);
    const video = result.videos?.[0];
    if (!video) return null;
    return {
      videoId: video.videoId,
      audioUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      coverImage: video.image || video.thumbnail || ''
    };
  } catch (err) {
    logger.error(`findYouTubeVideoForTrack failed: ${err.message}`);
    return null;
  }
};

/**
 * Gets trending tracks (most popular music videos) from YouTube
 * @returns {Promise<Array>} List of mapped track objects
 */
export const getTrendingTracks = async () => {
  const tryApi = async (keyToUse) => {
    logger.info('Fetching trending music from YouTube API v3 with key');
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails',
        chart: 'mostPopular',
        videoCategoryId: '10', // Music category
        maxResults: 15,
        regionCode: 'US', // Required for serverless to not return empty
        key: keyToUse
      }
    });

    const items = response.data.items || [];
    if (items.length === 0) throw new Error("API returned 0 items");

    return items.map(item => {
      let durationSec = 180;
      try {
        const matches = item.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (matches) {
          const hours = parseInt(matches[1] || 0, 10);
          const minutes = parseInt(matches[2] || 0, 10);
          const seconds = parseInt(matches[3] || 0, 10);
          durationSec = (hours * 3600) + (minutes * 60) + seconds;
        }
      } catch (e) {
        // use default
      }

      return {
        _id: item.id,
        videoId: item.id,
        title: decodeHtml(item.snippet.title),
        artist: decodeHtml(item.snippet.channelTitle),
        coverImage: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        duration: durationSec,
        audioUrl: `https://www.youtube.com/watch?v=${item.id}`,
        source: 'youtube'
      };
    });
  };

  try {
    return await tryApi(YOUTUBE_API_KEY);
  } catch (error) {
    logger.warn(`Primary YouTube trending API failed: ${error.message}. Trying fallback API key.`);
    try {
      const fallbackKey = 'AIzaSyBppQSyZoT5E93sP-cnaIsydqKzgakjwuo';
      if (YOUTUBE_API_KEY !== fallbackKey) {
        return await tryApi(fallbackKey);
      }
    } catch (err2) {
       // fallthrough
    }
    logger.warn(`Fallback YouTube trending API failed. Falling back to yt-search.`);
    return await getTrendingFallback();
  }
};

/**
 * Fallback for trending tracks
 */
const getTrendingFallback = async () => {
  try {
    logger.info('Performing trending fallback using search for trending music');
    const queries = ['lofi beats official audio', 'cyberpunk synthwave music official audio', 'trending music mix official audio'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    return await searchYouTubeFallback(randomQuery);
  } catch (err) {
    logger.error(`Trending fallback failed: ${err.message}`);
    return [];
  }
};

export default {
  searchYouTube,
  getTrendingTracks
};
