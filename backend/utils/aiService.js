import { Configuration, OpenAIApi } from 'openai';
import config from '../config/index.js';
import logger from '../config/logger.js';
import axios from 'axios';

const getOpenRouterKey = () => {
  return process.env.OPENROUTER_API_KEY || config.OPENAI.openRouterKey || '';
};

const openai = new OpenAIApi(new Configuration({ 
  apiKey: getOpenRouterKey(),
  basePath: 'https://openrouter.ai/api/v1',
  baseOptions: {
    headers: {
      'HTTP-Referer': config.SERVER_URL || 'http://localhost:5000',
      'X-Title': 'Melodia',
    },
  },
}));

export const extractJsonObjectOrArray = (text) => {
  try {
    const cleaned = text
      .replace(/```json/gi, '')
      .replace(/```JSON/gi, '')
      .replace(/```/g, '')
      .trim();
    


    const objectStart = cleaned.indexOf('{');
    const objectEnd = cleaned.lastIndexOf('}');
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    
    let startIdx = -1;
    let endIdx = -1;
    
    if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
      startIdx = objectStart;
      endIdx = objectEnd;
    } else if (arrayStart !== -1) {
      startIdx = arrayStart;
      endIdx = arrayEnd;
    }
    
    let jsonText = cleaned;
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonText = cleaned.substring(startIdx, endIdx + 1);

    }

    try {
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (parseErr) {
      logger.error(`JSON parse failed: ${parseErr.message}`);
      throw parseErr;
    }
  } catch (error) {
    logger.error(`Failed to parse AI response text as JSON: ${error.message}. Raw text: ${text}`);
    throw error;
  }
};

export const generateSmartPlaylistName = async (criteria) => {
  try {
    const apiKey = getOpenRouterKey();
    const prompt = `Generate a creative playlist name based on these criteria:
    Moods: ${criteria.moods?.join(', ')}
    Genres: ${criteria.genres?.join(', ')}
    Keep it short (2-4 words) and catchy.`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.5-flash:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': config.SERVER_URL || 'http://localhost:5000',
          'X-Title': 'Melodia',
        },
        timeout: 10000,
      }
    );

    return response.data.choices[0]?.message?.content || 'My Playlist';
  } catch (error) {
    logger.error(`AI playlist naming failed: ${error.message}`);
    return 'My Playlist';
  }
};

export const generatePlaylistDescription = async (name, criteria) => {
  try {
    const apiKey = getOpenRouterKey();
    const prompt = `Write a short, engaging description for a Spotify-like playlist named "${name}" with:
    Moods: ${criteria.moods?.join(', ')}
    Genres: ${criteria.genres?.join(', ')}
    Keep it under 100 words.`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.5-flash:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': config.SERVER_URL || 'http://localhost:5000',
          'X-Title': 'Melodia',
        },
        timeout: 10000,
      }
    );

    return response.data.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error(`AI description generation failed: ${error.message}`);
    return '';
  }
};

export const generateAiPlaylist = async (userPrompt) => {
  try {
    const apiKey = getOpenRouterKey();
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'tencent/hy3:free',
        messages: [
          {
            role: 'system',
            content: 'You are a master music curator AI. Your task is to generate a highly creative, custom playlist based on the user\'s prompt. You MUST return ONLY a valid JSON object with EXACTLY three keys: "name" (a catchy, creative title for the playlist, max 6 words), "description" (a highly engaging description of the vibe, max 2 sentences), and "songs" (an array of exactly 30 unique song objects). Each song object must have "title" (string) and "artist" (string). CRITICAL RULES: 1. No duplicate songs or artists. 2. Output RAW JSON ONLY. No markdown, no backticks, no conversational text.'
          },
          {
            role: 'user',
            content: `Create a custom playlist based on this exact prompt: "${userPrompt}". Make sure the "name" and "description" fields perfectly capture the essence of this prompt. Include deep cuts and hidden gems, not just obvious hits. Random seed: ${Date.now()}`
          }
        ],
        temperature: 1.0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': config.SERVER_URL || 'http://localhost:5000',
          'X-Title': 'Melodia',
        },
        timeout: 15000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    return extractJsonObjectOrArray(content);
  } catch (error) {
    logger.warn(`AI playlist generation failed: ${error.message}. Returning fallback playlist curation.`);
    
    const promptLower = (userPrompt || '').toLowerCase();
    let name = 'Custom Mood Mix';
    let description = `A custom tailored soundtrack curated for your prompt: "${userPrompt}"`;
    let songs = [];

    let baseSongs = [];
    if (promptLower.includes('chill') || promptLower.includes('relax') || promptLower.includes('study') || promptLower.includes('lofi') || promptLower.includes('lo-fi')) {
      name = 'Lofi Study Chill';
      description = 'Chill lo-fi beats to relax, study, or focus to.';
      baseSongs = [
        { title: 'Lofi Rain', artist: 'Chillhop Café' },
        { title: 'Sunset Dreams', artist: 'Retro Beats' },
        { title: 'Morning Coffee', artist: 'Lo-Fi Jazz Collective' },
        { title: 'Midnight Chill', artist: 'Sleepy Head' },
        { title: 'Focus Flow', artist: 'Study Vibes' }
      ];
    } else if (promptLower.includes('workout') || promptLower.includes('run') || promptLower.includes('gym') || promptLower.includes('energy') || promptLower.includes('power')) {
      name = 'High Energy Workout';
      description = 'Fuel your workout with high BPM energy anthems.';
      baseSongs = [
        { title: 'Power Run', artist: 'Electro Beast' },
        { title: 'Gym Motivation', artist: 'Hardstyle King' },
        { title: 'Cyber Pulse', artist: 'Neon Voyager' },
        { title: 'Adrenaline Rush', artist: 'Synth Warrior' },
        { title: 'Finish Line', artist: 'The Champion' }
      ];
    } else if (promptLower.includes('cyber') || promptLower.includes('synth') || promptLower.includes('retro') || promptLower.includes('code') || promptLower.includes('programming')) {
      name = 'Cyberpunk Coding Flow';
      description = 'Synthwave and cyber beats for pure hacking state.';
      baseSongs = [
        { title: 'Neo Tokyo', artist: 'Perturbator' },
        { title: 'Nightcall', artist: 'Kavinsky' },
        { title: 'Laser Waves', artist: 'Lazerhawk' },
        { title: 'Code Injection', artist: 'Cyber Voyager' },
        { title: 'Turbo Drive', artist: 'Retro Future' }
      ];
    } else {
      name = 'Melodia Vibe Mix';
      baseSongs = [
        { title: 'Blinding Lights', artist: 'The Weeknd' },
        { title: 'Starboy', artist: 'The Weeknd' },
        { title: 'Get Lucky', artist: 'Daft Punk' },
        { title: 'Midnight City', artist: 'M83' },
        { title: 'Intro', artist: 'The xx' }
      ];
    }

    while (songs.length < 30) {
      const item = baseSongs[songs.length % baseSongs.length];
      songs.push({
        title: songs.length < baseSongs.length ? item.title : `${item.title} Vol. ${Math.floor(songs.length / baseSongs.length) + 1}`,
        artist: item.artist
      });
    }

    return { name, description, songs };
  }
};

export const generateSmartPlaylistFromLikes = async (likedSongs) => {
  const apiKey = getOpenRouterKey();
  const modelId = 'tencent/hy3:free';
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  const trackListString = likedSongs
    .map((song) => `"${song.title}" by ${song.artist}`)
    .join(', ');

  const prompt = `You are a music recommendation engine. Based on the user's favorite tracks: [${trackListString}], recommend exactly 10 NEW and UNIQUE songs they haven't heard before. Avoid recommending songs already in their favorites. You MUST respond with ONLY a raw JSON array of exactly 10 objects, where each object has a "title" and an "artist" key. Every song must be different - no duplicates. Include lesser-known tracks and hidden gems, not just popular hits. Current timestamp for randomness: ${Date.now()}. Do not exceed 10. DO NOT include markdown formatting, backticks, or any conversational text. OUTPUT RAW JSON ONLY.`;

  try {
    logger.info(`Requesting OpenRouter for smart playlist. Favorites count: ${likedSongs.length}`);
    const response = await axios.post(
      endpoint,
      {
        model: modelId,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': config.SERVER_URL || 'http://localhost:5000',
          'X-Title': 'Melodia',
        },
        timeout: 15000, // 15s timeout
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    const recommendedSongs = extractJsonObjectOrArray(content);

    if (Array.isArray(recommendedSongs)) {
      return recommendedSongs;
    } else {
      throw new Error('Recommended songs is not a JSON array');
    }
  } catch (error) {
    logger.warn(`OpenRouter AI smart recommendation failed: ${error.message}. Returning fallback playlist.`);
    
    const fallbackBase = [
      { title: 'Nightcall', artist: 'Kavinsky' },
      { title: 'Sunset', artist: 'The Midnight' },
      { title: 'Memory Reboot', artist: 'VØJ & Narvent' },
      { title: 'Midnight City', artist: 'M83' },
      { title: 'Resonance', artist: 'Home' },
      { title: 'After Dark', artist: 'Mr.Kitty' },
      { title: 'Tech Noir', artist: 'Gunship' },
      { title: 'Fly For Your Life', artist: 'Gunship' },
      { title: 'Intro', artist: 'The xx' },
      { title: 'Retro Future', artist: 'Synthwave' }
    ];
    const songs = [];
    while (songs.length < 30) {
      const item = fallbackBase[songs.length % fallbackBase.length];
      songs.push({
        title: songs.length < fallbackBase.length ? item.title : `${item.title} Vol. ${Math.floor(songs.length / fallbackBase.length) + 1}`,
        artist: item.artist
      });
    }
    return songs;
  }
};

export default {
  generateSmartPlaylistName,
  generatePlaylistDescription,
  generateAiPlaylist,
  generateSmartPlaylistFromLikes,
};
