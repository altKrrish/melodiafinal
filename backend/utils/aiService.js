import { Configuration, OpenAIApi } from 'openai';
import config from '../config/index.js';
import logger from '../config/logger.js';

const openai = new OpenAIApi(new Configuration({ 
  apiKey: config.OPENAI.openRouterKey || config.OPENAI.apiKey,
  basePath: 'https://openrouter.ai/api/v1',
  baseOptions: {
    headers: {
      'HTTP-Referer': config.SERVER_URL,
      'X-Title': 'Melodia',
    },
  },
}));

export const generateSmartPlaylistName = async (criteria) => {
  try {
    const prompt = `Generate a creative playlist name based on these criteria:
    Moods: ${criteria.moods?.join(', ')}
    Genres: ${criteria.genres?.join(', ')}
    Keep it short (2-4 words) and catchy.`;

    const response = await openai.createChatCompletion({
      model: config.OPENAI_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 50,
    });

    return response.data.choices[0]?.message?.content || 'My Playlist';
  } catch (error) {
    logger.error(`AI playlist naming failed: ${error.message}`);
    return 'My Playlist';
  }
};

export const generatePlaylistDescription = async (name, criteria) => {
  try {
    const prompt = `Write a short, engaging description for a Spotify-like playlist named "${name}" with:
    Moods: ${criteria.moods?.join(', ')}
    Genres: ${criteria.genres?.join(', ')}
    Keep it under 100 words.`;

    const response = await openai.createChatCompletion({
      model: config.OPENAI_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 150,
    });

    return response.data.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error(`AI description generation failed: ${error.message}`);
    return '';
  }
};

export default {
  generateSmartPlaylistName,
  generatePlaylistDescription,
};
