const fs = require('fs');
const path = require('path');

const enPath = path.join('i18n', 'en.ts');
const siPath = path.join('i18n', 'si.ts');

function inject(filePath, lang) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('diseaseDetection: {')) return;

  const enSnippet = `
    diseaseDetection: {
      headerTitle: "Disease Detection",
      cardTitle: "Upload Leaf Image",
      cardDesc: "Upload or snap a picture of a paddy leaf to check for Fungal or Bacterial diseases.",
      noImage: "No image selected",
      gallery: "Gallery",
      camera: "Camera",
      analyze: "Analyze Image",
      analysisResult: "Analysis Result",
      type: "Type",
      confidence: "Confidence",
      saveToProfile: "Save to Profile",
      pastPredictions: "Past Predictions"
    },
`;

  const siSnippet = `
    diseaseDetection: {
      headerTitle: "රෝග හඳුනාගැනීම",
      cardTitle: "කොළයේ ඡායාරූපයක් උඩුගත කරන්න",
      cardDesc: "දිලීර හෝ බැක්ටීරියා රෝග සඳහා පරීක්ෂා කිරීමට වී කොළයක ඡායාරූපයක් උඩුගත කරන්න හෝ ලබා ගන්න.",
      noImage: "ඡායාරූපයක් තෝරා නැත",
      gallery: "ගැලරිය",
      camera: "කැමරාව",
      analyze: "පරීක්ෂා කරන්න",
      analysisResult: "පරීක්ෂණ ප්‍රතිඵලය",
      type: "වර්ගය",
      confidence: "විශ්වාසය",
      saveToProfile: "පැතිකඩට සුරකින්න",
      pastPredictions: "පෙර පරීක්ෂණ"
    },
`;

  const toInsert = lang === 'en' ? enSnippet : siSnippet;
  content = content.replace(/c02Farming:\s*\{/, "c02Farming: {\n" + toInsert);
  fs.writeFileSync(filePath, content, 'utf8');
}

inject(enPath, 'en');
inject(siPath, 'si');
console.log('Translations injected');
