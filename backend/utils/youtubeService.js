import axios from 'axios';
import ytSearch from 'yt-search';
import config from '../config/index.js';
import logger from '../config/logger.js';

// YouTube API Key (from environment variables only)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

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

  try {
    logger.info(`Searching YouTube API v3 for: "${searchQuery}"`);
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 15,
        key: YOUTUBE_API_KEY
      }
    });

    const items = response.data.items || [];
    if (items.length === 0) {
      return await searchYouTubeFallback(searchQuery);
    }

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
  } catch (error) {
    logger.warn(`YouTube search API failed: ${error.message}. Falling back to yt-search.`);
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
 * Gets trending tracks (most popular music videos) from YouTube
 * @returns {Promise<Array>} List of mapped track objects
 */
export const getTrendingTracks = async () => {
  try {
    logger.info('Fetching trending music from YouTube API v3');
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails',
        chart: 'mostPopular',
        videoCategoryId: '10', // Music category
        maxResults: 15,
        key: YOUTUBE_API_KEY
      }
    });

    const items = response.data.items || [];
    if (items.length === 0) {
      return await getTrendingFallback();
    }

    return items.map(item => {
      // Parse ISO 8601 duration (e.g. PT3M45S -> 225 seconds)
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
  } catch (error) {
    logger.warn(`YouTube trending API failed: ${error.message}. Falling back to yt-search.`);
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
