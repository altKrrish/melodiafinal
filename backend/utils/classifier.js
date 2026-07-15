import logger from '../config/logger.js';

// Pre-defined vocabulary mappings for Naive Bayes classification
const trainingData = {
  Happy: [
    'happy', 'smile', 'joy', 'sunshine', 'celebrate', 'fun', 'love', 'summer', 'good vibes',
    'feel good', 'paradise', 'bright', 'cheerful', 'party', 'optimistic', 'upbeat', 'dance',
    'disco', 'pop', 'funky', 'groove'
  ],
  Sad: [
    'sad', 'lonely', 'cry', 'tears', 'hurt', 'pain', 'broken', 'dark', 'heavy', 'blue',
    'melancholy', 'grief', 'tragedy', 'rainy', 'somber', 'lost', 'alone', 'broken heart',
    'depressing', 'miss', 'goodbye'
  ],
  Focused: [
    'focus', 'study', 'relax', 'chill', 'lofi', 'lo-fi', 'ambient', 'calm', 'peaceful',
    'meditation', 'sleep', 'coding', 'programming', 'developer', 'deep', 'soft', 'instrumental',
    'jazz', 'sleepy', 'study beats', 'chillhop'
  ],
  Workout: [
    'workout', 'gym', 'run', 'energy', 'power', 'beast', 'hardstyle', 'electro', 'techno',
    'intense', 'drive', 'remix', 'pump', 'training', 'hyper', 'fast', 'bass', 'boosted', 'heavy',
    'metal', 'aggro', 'phonk', 'cyberpunk'
  ]
};

// Prior probabilities P(C) - assuming uniform distribution
const priors = {
  Happy: 0.25,
  Sad: 0.25,
  Focused: 0.25,
  Workout: 0.25
};

/**
 * Classifies a song's mood using Naive Bayes text classification
 * @param {string} title Song title
 * @param {Array<string>} tags Song tags
 * @returns {Array<string>} List containing the predicted mood
 */
export const classifyMood = (title, tags = []) => {
  const text = `${title} ${(tags || []).join(' ')}`.toLowerCase();
  
  // Simple tokenization of word characters
  const tokens = text.match(/\w+/g) || [];
  
  let bestMood = 'Focused'; // default fallback
  let bestScore = -Infinity;
  
  const moods = ['Happy', 'Sad', 'Focused', 'Workout'];
  
  moods.forEach(mood => {
    // Score initialized to ln(P(C))
    let score = Math.log(priors[mood]);
    
    // Compute conditional probabilities P(W|C) for each token with Laplace smoothing
    tokens.forEach(token => {
      const matchCount = trainingData[mood].filter(keyword => {
        return token.includes(keyword) || keyword.includes(token);
      }).length;
      
      // P(W|C) = (matchCount + 1) / (vocabulary_size + training_keywords_count)
      const prob = (matchCount + 1) / (trainingData[mood].length + 100);
      score += Math.log(prob);
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestMood = mood;
    }
  });
  
  return [bestMood];
};

export default {
  classifyMood
};
