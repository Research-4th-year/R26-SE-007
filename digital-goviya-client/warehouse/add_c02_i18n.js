const fs = require('fs');
const path = require('path');

const enPath = path.join('i18n', 'en.ts');
const siPath = path.join('i18n', 'si.ts');

function injectC02Farming(filePath, lang) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('c02Farming: {')) return;

  const skeleton = `
  c02Farming: {
    home: {
      eyebrow: "AI-POWERED FARMING INSIGHTS",
      title: "Smart Farming\\n& Advisory",
      subtitle: "Optimize your harvest with data-driven insights and disease detection.",
      introText: "Leverage advanced machine learning and real-time IoT data to manage your paddy fields.",
      
      iotDashboardTitle: "IoT Dashboard",
      iotDashboardDesc: "Monitor real-time sensor data from your ESP32 IoT device — temperature, humidity, soil moisture, NPK, and more.",
      iotDashboardBtn: "View Dashboard",
      
      varietyTitle: "Variety Prediction & Suitability",
      varietyDesc: "Find the best paddy variety for your district and check if your field is ready for planting.",
      varietyBtn: "Check Suitability",
      
      yieldTitle: "Yield Prediction",
      yieldDesc: "Predict your harvest yield based on field size, variety, and historical data.",
      yieldBtn: "Predict Yield",
      
      diseaseTitle: "Paddy Disease Detection",
      diseaseDesc: "Upload or capture a photo of a paddy leaf to identify diseases instantly using AI.",
      diseaseBtn: "Scan Leaf",
      
      fertilizerTitle: "Smart Fertilizer Guide",
      fertilizerDesc: "Calculate the exact fertilizer requirements based on Department of Agriculture guidelines.",
      fertilizerBtn: "Get Guide",
    }
  },
`;

  const siSkeleton = `
  c02Farming: {
    home: {
      eyebrow: "කෘතිම බුද්ධියෙන් බලගන්වන ගොවිතැන් තොරතුරු",
      title: "සුහුරු ගොවිතැන\\nසහ උපදේශන",
      subtitle: "දත්ත මත පදනම් වූ තොරතුරු සහ රෝග හඳුනාගැනීම සමඟ ඔබේ අස්වැන්න ප්‍රශස්ත කරන්න.",
      introText: "ඔබේ කුඹුරු කළමනාකරණය සඳහා උසස් යන්ත්‍ර ඉගෙනීම (Machine Learning) සහ තත්‍ය කාලීන IoT දත්ත භාවිතා කරන්න.",
      
      iotDashboardTitle: "IoT උපකරණ පුවරුව",
      iotDashboardDesc: "ඔබේ ESP32 IoT උපාංගයෙන් තත්‍ය කාලීන සංවේදක දත්ත නිරීක්ෂණය කරන්න — උෂ්ණත්වය, ආර්ද්‍රතාවය, පසෙහි තෙතමනය, NPK සහ තවත් දේ.",
      iotDashboardBtn: "උපකරණ පුවරුව බලන්න",
      
      varietyTitle: "ප්‍රභේද පුරෝකථනය සහ යෝග්‍යතාවය",
      varietyDesc: "ඔබේ දිස්ත්‍රික්කය සඳහා හොඳම වී ප්‍රභේදය සොයාගෙන ඔබේ කුඹුර සිටුවීමට සූදානම් දැයි පරීක්ෂා කරන්න.",
      varietyBtn: "යෝග්‍යතාවය පරීක්ෂා කරන්න",
      
      yieldTitle: "අස්වැන්න පුරෝකථනය",
      yieldDesc: "කුඹුරේ ප්‍රමාණය, ප්‍රභේදය සහ ඓතිහාසික දත්ත මත පදනම්ව ඔබේ අස්වැන්න පුරෝකථනය කරන්න.",
      yieldBtn: "අස්වැන්න පුරෝකථනය කරන්න",
      
      diseaseTitle: "වී රෝග හඳුනාගැනීම",
      diseaseDesc: "කෘතිම බුද්ධිය භාවිතයෙන් ක්ෂණිකව රෝග හඳුනා ගැනීම සඳහා වී ගසේ පත්‍රයක ඡායාරූපයක් උඩුගත කරන්න හෝ ලබා ගන්න.",
      diseaseBtn: "කොළය ස්කෑන් කරන්න",
      
      fertilizerTitle: "සුහුරු පොහොර මාර්ගෝපදේශය",
      fertilizerDesc: "කෘෂිකර්ම දෙපාර්තමේන්තුවේ මාර්ගෝපදේශ මත පදනම්ව නිශ්චිත පොහොර අවශ්‍යතා ගණනය කරන්න.",
      fertilizerBtn: "මාර්ගෝපදේශය ලබාගන්න",
    }
  },
`;

  // Find the last closing brace of the main object
  const lastBraceIndex = content.lastIndexOf('};');
  if (lastBraceIndex !== -1) {
    const toInsert = lang === 'en' ? skeleton : siSkeleton;
    content = content.slice(0, lastBraceIndex) + toInsert + content.slice(lastBraceIndex);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

injectC02Farming(enPath, 'en');
injectC02Farming(siPath, 'si');
