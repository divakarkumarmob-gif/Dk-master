export const videoFallbacks: Record<string, string> = {
  'Units and Measurements': 'j9W9LpZ8T_U',
  'Some Basic Concepts of Chemistry': '1XW6S1A1_IA',
  'The Living World': 'Xm2N4R7f_pY'
};

export const getFallbackVideoId = (topic: string) => {
    return videoFallbacks[topic] || null;
};
