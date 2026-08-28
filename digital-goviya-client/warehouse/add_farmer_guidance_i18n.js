const fs = require('fs');
const path = require('path');

const enPath = path.join('i18n', 'en.ts');
const siPath = path.join('i18n', 'si.ts');

function inject(filePath, lang) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('farmerGuidance: {')) return;

  const enSnippet = `
    farmerGuidance: {
      title: "Farmer Crop Guidance",
      subtitle: "(වගා උපදෙස්)",
      infoPart1: "Your recommended variety (",
      infoPart2: ") has an approximate crop duration of ",
      infoPart3: ". The following guidance is organized according to crop age and Sri Lankan agricultural recommendations for the ",
      action: "Action",
      water: "Water",
      fertilizer: "Fertilizer",
      warning: "Warning",
      source: "Source"
    },
`;

  const siSnippet = `
    farmerGuidance: {
      title: "ගොවි බෝග මාර්ගෝපදේශය",
      subtitle: "(Crop Guidance)",
      infoPart1: "ඔබට නිර්දේශිත වී ප්‍රභේදය (",
      infoPart2: ") සඳහා දළ වශයෙන් බෝග කාල සීමාවක් ඇත: ",
      infoPart3: ". පහත මාර්ගෝපදේශය බෝගයේ වයස සහ ශ්‍රී ලංකා කෘෂිකාර්මික නිර්දේශයන්ට අනුව සකසා ඇත: ",
      action: "ක්‍රියාමාර්ගය",
      water: "ජලය",
      fertilizer: "පොහොර",
      warning: "අවවාදය",
      source: "මූලාශ්‍රය"
    },
`;

  const toInsert = lang === 'en' ? enSnippet : siSnippet;
  
  // Find where c02Farming starts and inject it right after
  content = content.replace(/c02Farming:\s*\{/, "c02Farming: {\n" + toInsert);
  
  fs.writeFileSync(filePath, content, 'utf8');
}

inject(enPath, 'en');
inject(siPath, 'si');
