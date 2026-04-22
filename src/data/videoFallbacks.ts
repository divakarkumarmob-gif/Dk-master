export const FALLBACK_VIDEOS: Record<string, string> = {
  // Biology
  "Living World": "I_pXG8v1v8g",
  "Biological Classification": "v8k8Ym9s_Yk",
  "Plant Kingdom": "M8zBebI_J10",
  "Animal Kingdom": "7lY6f4A5l_c",
  "Cell: The Unit of Life": "9vH_HToP_uY",
  "Cell Cycle and Cell Division": "8m9K3k2o-9M",
  "Photosynthesis in Higher Plants": "v_R_v8D-f8A",
  "Respiration in Plants": "z_B_O9U8g_4",
  "Human Reproduction": "k8X9p3v8X8k",
  "Evolution": "Y8r9p3v8X8k",
  "Biotechnology: Principles and Processes": "L8r9p3v8X8k",
  "Molecular Basis of Inheritance": "v8k8Ym9s_Yk",
  "Principles of Inheritance and Variation": "M8zBebI_J10",
  "Biomolecules": "9vH_HToP_uY",
  
  // Physics
  "Units and Measurements": "t2LpNoqN55E",
  "Motion in a Straight Line": "0r6F6r9Wc0M",
  "Laws of Motion": "p1fT7BfT6fA",
  "Work, Energy and Power": "Ivt5uP8P_uQ",
  "Gravitation": "f-rS_QyP77q",
  "Thermodynamics": "O9U8g_4z_Bc",
  "Electric Charges and Fields": "_uY9vH_HToP",
  "Current Electricity": "S8v8I8p3v8X",
  "Waves": "k0_U9p8yG2k",
  "Ray Optics": "0_u_mC_G_m0",
  "Alternating Current": "8V9zN-TzIeA",
  "Electromagnetic Induction": "p2XW_6iM8vE",
  "Semiconductors": "uUpR-C7i00k",
  "Dual Nature of Radiation and Matter": "9vH_HToP_uY",
  "Communication Systems": "8m9K3k2o-9M",
  
  // Chemistry
  "Chemical Kinetics": "V_R_v8D-f8A",
  "Solutions": "z_B_O9U8g_4",
  "Electrochemistry": "k8X9p3v8X8k",
  "Surface Chemistry": "Y8r9p3v8X8k",
  "Coordination Compounds": "L8r9p3v8X8k",
  "Haloalkanes and Haloarenes": "v8k8Ym9s_Yk",
  "Alcohols Phenols and Ethers": "M8zBebI_J10",
  "Aldehydes Ketones and Carboxylic Acids": "7lY6f4A5l_c",
  "Amines": "9vH_HToP_uY",
  "Biomolecules (Chem)": "8m9K3k2o-9M",
  "Polymers": "v_R_v8D-f8A",
  "Chemistry in Everyday Life": "z_B_O9U8g_4"
};

/**
 * Normalizes chapter names for matching.
 */
export const getFallbackVideoId = (chapter: string): string | null => {
  const clean = chapter.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, value] of Object.entries(FALLBACK_VIDEOS)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return value;
    }
  }
  return null;
};
