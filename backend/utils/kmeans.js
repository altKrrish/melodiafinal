import logger from '../config/logger.js';

/**
 * Extracts normalized numeric features from song metadata for clustering
 */
export const extractFeatures = (song) => {
  const titleLower = (song.title || '').toLowerCase();
  
  // 1. Tempo (BPM) Proxy (scale 60 to 180 bpm)
  let bpm = 100;
  if (titleLower.includes('lofi') || titleLower.includes('lo-fi') || titleLower.includes('relax') || titleLower.includes('chill') || titleLower.includes('sleep') || titleLower.includes('ambient')) {
    bpm = 75;
  } else if (titleLower.includes('electro') || titleLower.includes('techno') || titleLower.includes('house') || titleLower.includes('dance') || titleLower.includes('synthwave')) {
    bpm = 120;
  } else if (titleLower.includes('workout') || titleLower.includes('gym') || titleLower.includes('metal') || titleLower.includes('fast') || titleLower.includes('phonk') || titleLower.includes('hardstyle')) {
    bpm = 150;
  }
  
  // 2. Energy Proxy (scale 0.0 to 1.0)
  let energy = 0.5;
  if (titleLower.includes('lofi') || titleLower.includes('ambient') || titleLower.includes('peaceful') || titleLower.includes('sleep') || titleLower.includes('slowed') || titleLower.includes('rain')) {
    energy = 0.15;
  } else if (titleLower.includes('workout') || titleLower.includes('gym') || titleLower.includes('power') || titleLower.includes('beast') || titleLower.includes('intense') || titleLower.includes('hardstyle') || titleLower.includes('boosted')) {
    energy = 0.9;
  } else if (titleLower.includes('remix') || titleLower.includes('dance') || titleLower.includes('party') || titleLower.includes('techno') || titleLower.includes('cyberpunk') || titleLower.includes('neon')) {
    energy = 0.75;
  }
  
  // 3. Duration Proxy (scale up to 600 seconds)
  const duration = song.duration || 180;
  
  // Normalized features [0, 1]
  return {
    bpmNorm: (bpm - 60) / 120,
    energyNorm: energy,
    durationNorm: Math.min(duration, 600) / 600
  };
};

// Euclidean distance helper
const getDistance = (f1, f2) => {
  return Math.sqrt(
    Math.pow(f1.bpmNorm - f2.bpmNorm, 2) +
    Math.pow(f1.energyNorm - f2.energyNorm, 2) +
    Math.pow(f1.durationNorm - f2.durationNorm, 2)
  );
};

/**
 * Cluster user liked songs using K-Means clustering algorithm
 * @param {Array} songs List of song database objects
 * @param {number} k Number of clusters (default 3)
 * @returns {Object} Object containing lists of songs grouped by cluster
 */
export const runKMeansClustering = (songs, k = 3) => {
  if (!songs || songs.length === 0) {
    return [];
  }

  // If we have fewer songs than K, just place each in its own individual group
  const actualK = Math.min(songs.length, k);
  
  // Extract features for each song
  const dataPoints = songs.map(song => ({
    song,
    features: extractFeatures(song)
  }));

  // Initialize centroids
  let centroids = [];
  
  // Pick distinct starting features to guide clusters
  // 1. Chill: low bpm, low energy
  // 2. High Energy: high bpm, high energy
  // 3. Regular/Groove: moderate bpm, moderate energy
  const starterCentroids = [
    { bpmNorm: 0.125, energyNorm: 0.15, durationNorm: 0.3 }, // Chill
    { bpmNorm: 0.75, energyNorm: 0.9, durationNorm: 0.25 },   // High Energy
    { bpmNorm: 0.5, energyNorm: 0.55, durationNorm: 0.3 }    // Groove/Regular
  ];

  for (let i = 0; i < actualK; i++) {
    centroids.push({
      id: i,
      features: starterCentroids[i] || dataPoints[i].features
    });
  }

  let assignments = new Array(dataPoints.length).fill(-1);
  let iterations = 10;
  let converged = false;

  while (iterations > 0 && !converged) {
    converged = true;
    
    // 1. Assignment step
    dataPoints.forEach((dp, dpIdx) => {
      let minDistance = Infinity;
      let closestCentroidId = -1;
      
      centroids.forEach(c => {
        const d = getDistance(dp.features, c.features);
        if (d < minDistance) {
          minDistance = d;
          closestCentroidId = c.id;
        }
      });

      if (assignments[dpIdx] !== closestCentroidId) {
        assignments[dpIdx] = closestCentroidId;
        converged = false; // assignment changed, didn't converge yet
      }
    });

    // 2. Update step
    centroids.forEach(c => {
      const assignedPoints = dataPoints.filter((_, idx) => assignments[idx] === c.id);
      
      if (assignedPoints.length > 0) {
        let sumBpm = 0, sumEnergy = 0, sumDuration = 0;
        assignedPoints.forEach(ap => {
          sumBpm += ap.features.bpmNorm;
          sumEnergy += ap.features.energyNorm;
          sumDuration += ap.features.durationNorm;
        });

        c.features = {
          bpmNorm: sumBpm / assignedPoints.length,
          energyNorm: sumEnergy / assignedPoints.length,
          durationNorm: sumDuration / assignedPoints.length
        };
      }
    });

    iterations--;
  }

  // Form final clusters
  const clusters = [];
  for (let i = 0; i < actualK; i++) {
    const clusterCentroid = centroids[i].features;
    const clusterPoints = dataPoints.filter((_, idx) => assignments[idx] === i);
    
    if (clusterPoints.length === 0) continue;

    // Categorize human readable label based on average features
    let label = 'Vibe Mix';
    let gradient = 'from-[#6366F1] to-[#0EA5E9]'; // default neon blue/indigo
    
    if (clusterCentroid.energyNorm < 0.35) {
      label = 'Late Night Chill Mix';
      gradient = 'from-[#1E1B4B] via-[#4C1D95] to-[#8B5CF6]'; // deep violet glow
    } else if (clusterCentroid.energyNorm > 0.65) {
      label = 'High Energy Arcade';
      gradient = 'from-[#F43F5E] via-[#D946EF] to-[#8B5CF6]'; // neon hot pink/purple glow
    } else {
      label = 'Daily Groove Mix';
      gradient = 'from-[#0EA5E9] via-[#10B981] to-[#3B82F6]'; // cyan/emerald glow
    }

    clusters.push({
      clusterId: i,
      label,
      gradient,
      songs: clusterPoints.map(cp => cp.song)
    });
  }

  return clusters;
};

export default {
  extractFeatures,
  runKMeansClustering
};
