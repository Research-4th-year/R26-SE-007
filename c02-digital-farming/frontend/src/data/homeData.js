// ─── Home Screen Data ─────────────────────────────────────────────────────────
// All data loaded dynamically – no hard-coding inside components.

// ── Paddy Varieties ──────────────────────────────────────────────────────────
export const HOME_VARIETIES = [
  {
    id: 'bg352',
    code: 'Bg 352',
    english_name: 'Bg 352',
    sinhala_name: 'බීජී 352',
    rice_type_en: 'White Nadu',
    rice_type_si: 'සුදු නාඩු',
    category: 'BG',
    duration_days: 105,
    yield_t_ha: 6.8,
    suitable_zone: 'All Zones',
    suitable_zone_si: 'සියලු කලාප',
    suitable_season: ['Yala', 'Maha'],
    disease_resistance: 'Moderate',
    fertilizer_kg_ha: { urea: 160, tsp: 50, mop: 55 },
    districts: ['Anuradhapura', 'Polonnaruwa', 'Kurunegala', 'Hambantota', 'Kandy'],
    description_en: 'High-yielding white Nadu variety with good disease resistance. Suitable for both Yala and Maha seasons across all agro-climatic zones.',
    description_si: 'ඉහළ අස්වැන්නක් ඇති සුදු නාඩු ප්‍රභේදයකි. රෝග ඔරොත්තු දීම සාමාන්‍ය මට්ටමේ ඇති අතර යල හා මහ යන කන්නවල දෙකේදීම ගොවිතැන් කළ හැකිය.',
    image: 'rice-plant',
    accent: '#2E7D32',
    badge: 'Popular'
  },
  {
    id: 'bg366',
    code: 'Bg 366',
    english_name: 'Bg 366',
    sinhala_name: 'බීජී 366',
    rice_type_en: 'White Nadu',
    rice_type_si: 'සුදු නාඩු',
    category: 'BG',
    duration_days: 105,
    yield_t_ha: 7.0,
    suitable_zone: 'All Zones',
    suitable_zone_si: 'සියලු කලාප',
    suitable_season: ['Yala', 'Maha'],
    disease_resistance: 'Good',
    fertilizer_kg_ha: { urea: 155, tsp: 48, mop: 52 },
    districts: ['Anuradhapura', 'Polonnaruwa', 'Kurunegala', 'Ampara', 'Trincomalee'],
    description_en: 'Highest-yielding BG series variety. Excellent milling quality and good resistance to major paddy diseases.',
    description_si: 'BG ශ්‍රේණියේ ඉහළම අස්වැන්නක් දෙන ප්‍රභේදයයි. මෝල් ගුණය ඉතා හොඳ අතර ප්‍රධාන රෝගවලට ඔරොත්තු දීමද හොඳය.',
    image: 'rice-plant',
    accent: '#1B5E20',
    badge: 'High Yield'
  },
  {
    id: 'at362',
    code: 'At 362',
    english_name: 'At 362',
    sinhala_name: 'ඇට් 362',
    rice_type_en: 'Red Kekulu',
    rice_type_si: 'රතු කැකුළු',
    category: 'AT',
    duration_days: 115,
    yield_t_ha: 6.2,
    suitable_zone: 'Dry Zone',
    suitable_zone_si: 'වියළි කලාපය',
    suitable_season: ['Yala', 'Maha'],
    disease_resistance: 'Good',
    fertilizer_kg_ha: { urea: 140, tsp: 42, mop: 45 },
    districts: ['Anuradhapura', 'Polonnaruwa', 'Hambantota', 'Ampara', 'Monaragala'],
    description_en: 'Drought-tolerant red Kekulu variety developed for the dry zone. Rich in nutrients and popular in traditional markets.',
    description_si: 'වියළි කලාපය සඳහා නිපදවූ නියං ඔරොත්තු දෙන රතු කැකුළු ප්‍රභේදයකි. පාරම්පරික වෙළඳ පොළේ ජනප්‍රිය.',
    image: 'paddy-seed',
    accent: '#C49A00',
    badge: 'Drought Tolerant'
  },
  {
    id: 'bw367',
    code: 'Bw 367',
    english_name: 'Bw 367',
    sinhala_name: 'බීඩබ්ලිව් 367',
    rice_type_en: 'Red Samba',
    rice_type_si: 'රතු සම්බා',
    category: 'BW',
    duration_days: 110,
    yield_t_ha: 5.8,
    suitable_zone: 'Wet Zone',
    suitable_zone_si: 'තෙත් කලාපය',
    suitable_season: ['Maha'],
    disease_resistance: 'Moderate',
    fertilizer_kg_ha: { urea: 145, tsp: 44, mop: 48 },
    districts: ['Kandy', 'Matale', 'Kegalle', 'Ratnapura', 'Galle', 'Matara'],
    description_en: 'Wet-zone adapted Red Samba variety with moderate disease resistance. Best grown during the Maha season.',
    description_si: 'තෙත් කලාපයට ගැලපෙන රතු සම්බා ප්‍රභේදයකි. මහ කන්නයේ ගොවිතැන් කිරීම සිදු කිරීම වඩාත් හොඳය.',
    image: 'paddy-seed',
    accent: '#8B4513',
    badge: 'Wet Zone'
  },
  {
    id: 'ld368',
    code: 'Ld 368',
    english_name: 'Ld 368',
    sinhala_name: 'එල්ඩී 368',
    rice_type_en: 'Red Kekulu',
    rice_type_si: 'රතු කැකුළු',
    category: 'LD',
    duration_days: 118,
    yield_t_ha: 5.6,
    suitable_zone: 'Southern Zone',
    suitable_zone_si: 'දකුණු කලාපය',
    suitable_season: ['Yala', 'Maha'],
    disease_resistance: 'Good',
    fertilizer_kg_ha: { urea: 130, tsp: 40, mop: 42 },
    districts: ['Galle', 'Matara', 'Hambantota', 'Monaragala'],
    description_en: 'Developed specifically for the southern agro-climatic zone. Good disease resistance and suitable for both seasons.',
    description_si: 'දකුණු කෘෂිදේශගුණික කලාපය සඳහා විශේෂයෙන් නිපදවන ලදි. රෝග ඔරොත්තු දීම හොඳ අතර කන්නය දෙකේදීම ගොවිතැන් කළ හැකිය.',
    image: 'rice-plant',
    accent: '#5D4037',
    badge: 'Southern Zone'
  }
];

// ── Fertilizers ───────────────────────────────────────────────────────────────
export const HOME_FERTILIZERS = [
  {
    id: 'urea',
    name: 'Urea',
    sinhala_name: 'යූරියා',
    nutrient: 'Nitrogen (N)',
    nutrient_si: 'නයිට්‍රජන් (N)',
    purpose_en: 'Promotes vigorous leaf and stem growth, giving plants deep green colour.',
    purpose_si: 'කොළ හා කඳ ශක්‍යමත් ලෙස වර්ධනය කරයි. ශාකයට තද කොළ පාට ලබා දෙයි.',
    application_stage_en: 'Basal dressing + Active tillering stage',
    application_stage_si: 'මූලික යෙදීම + ක්‍රියාකාරී ශාඛා අවස්ථාව',
    dosage_kg_ha: '150 – 170 kg/ha',
    image: 'fertilizer-urea',
    accent: '#2196F3',
    icon: '🌿'
  },
  {
    id: 'tsp',
    name: 'TSP',
    sinhala_name: 'TSP පොහොර',
    nutrient: 'Phosphorus (P)',
    nutrient_si: 'පොස්පරස් (P)',
    purpose_en: 'Crucial for root development, flowering and energy transfer within the plant.',
    purpose_si: 'මූල සංවර්ධනය, මල් පිපීම සහ ශාකය තුළ ශක්තිය ගලා යාම සඳහා අත්‍යවශ්‍ය.',
    application_stage_en: 'Entirely as basal dressing before transplanting',
    application_stage_si: 'බද්ධ කිරීමට පෙර සම්පූර්ණයෙන් මූලික යෙදීම ලෙස',
    dosage_kg_ha: '40 – 55 kg/ha',
    image: 'fertilizer-tsp',
    accent: '#FF9800',
    icon: '🌱'
  },
  {
    id: 'mop',
    name: 'MOP',
    sinhala_name: 'MOP පොහොර',
    nutrient: 'Potassium (K)',
    nutrient_si: 'පොටෑසියම් (K)',
    purpose_en: 'Improves plant strength, grain filling, drought tolerance and disease resistance.',
    purpose_si: 'ශාකයේ ශක්තිය, ධාන්‍ය පිරවීම, නියං ඔරොත්තු දීම හා රෝග ප්‍රතිරෝධකතාව ඉහළ නංවයි.',
    application_stage_en: 'Panicle initiation and heading stages',
    application_stage_si: 'කරල් ඇතිවීම හා හිස ඉසිලීමේ අවස්ථාවන්හිදී',
    dosage_kg_ha: '45 – 60 kg/ha',
    image: 'fertilizer-mop',
    accent: '#9C27B0',
    icon: '💪'
  }
];

// ── Seasons ───────────────────────────────────────────────────────────────────
export const HOME_SEASONS = [
  {
    id: 'maha',
    name: 'Maha',
    sinhala_name: 'මහ කන්නය',
    months_en: 'September – March',
    months_si: 'සැප්තැම්බර් – මාර්තු',
    icon: '🌧️',
    rainfall: 'High (1,200 – 2,000 mm)',
    rainfall_si: 'ඉහළ (1,200 – 2,000 mm)',
    description_en: 'Main cultivation season with heavy northeast monsoon rains. Higher disease pressure; regular monitoring is essential.',
    description_si: 'ඊසාන මෝසම් වර්ෂාව සමඟ ප්‍රධාන වගා කන්නය. රෝග පීඩනය වැඩිය; නිතිපතා අධීක්ෂණය අත්‍යවශ්‍ය.',
    varieties_recommended: ['Bg 352', 'Bg 366', 'Bw 367', 'Ld 368'],
    tips_en: ['Monitor for rice blast during high humidity', 'Ensure drainage channels are clear', 'Apply fungicides at panicle initiation'],
    tips_si: ['ඉහළ ආර්ද්‍රතාවයේදී කළු දළ රෝගය නිරීක්ෂණය කරන්න', 'ජලාපවාහන නළ හිස් ව ඇත්දැයි බලන්න', 'කරල් ඇතිවීමේදී දිලීර නාශක යෙදීම'],
    gradient: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
    accent: '#42A5F5'
  },
  {
    id: 'yala',
    name: 'Yala',
    sinhala_name: 'යල කන්නය',
    months_en: 'May – August',
    months_si: 'මැයි – අගෝස්තු',
    icon: '☀️',
    rainfall: 'Low (600 – 1,200 mm)',
    rainfall_si: 'අඩු (600 – 1,200 mm)',
    description_en: 'Dry season with southwest monsoon. Water management is critical; drought-tolerant varieties are preferred.',
    description_si: 'නිරිත දිග මෝසම සමඟ වියළි කන්නය. ජල කළමනාකරණය ඉතා වැදගත්; නියං ඔරොත්තු දෙන ප්‍රභේද නිර්දේශිතය.',
    varieties_recommended: ['Bg 352', 'At 362', 'Ld 368'],
    tips_en: ['Practise intermittent irrigation to save water', 'Use drought-tolerant varieties', 'Watch for stem borer during dry spells'],
    tips_si: ['ජලය ඉතිරි කිරීමට විරාමාත්මක වාරිමාර්ගය භාවිතා කරන්න', 'නියං ඔරොත්තු දෙන ප්‍රභේද භාවිතා කරන්න', 'වියළි කාලවලදී කඳ සිදුරු කරන්නා නිරීක්ෂණය කරන්න'],
    gradient: 'linear-gradient(135deg, #E65100 0%, #BF360C 100%)',
    accent: '#FFA726'
  }
];

// ── Districts ──────────────────────────────────────────────────────────────────
export const HOME_DISTRICTS = [
  {
    zone: 'Dry Zone',
    zone_si: 'වියළි කලාපය',
    icon: '🌵',
    color: '#C49A00',
    bg: 'rgba(196,154,0,0.08)',
    avg_rainfall_mm: '800 – 1,500',
    climate_en: 'Hot and arid. Two distinct dry periods. Irrigation-dependent agriculture.',
    climate_si: 'උණුසුම් සහ අර්ධ ශුෂ්ක. ජල කළමනාකරණය ඉතා වැදගත්.',
    districts: [
      { name: 'Anuradhapura', si: 'අනුරාධපුරය' },
      { name: 'Polonnaruwa', si: 'පොළොන්නරුව' },
      { name: 'Hambantota', si: 'හම්බන්තොට' },
      { name: 'Ampara', si: 'අම්පාර' },
      { name: 'Trincomalee', si: 'ත්‍රිකුණාමලය' },
      { name: 'Monaragala', si: 'මොණරාගල' }
    ],
    recommended_varieties: ['Bg 352', 'At 362', 'Ld 368']
  },
  {
    zone: 'Wet Zone',
    zone_si: 'තෙත් කලාපය',
    icon: '🌿',
    color: '#2E7D32',
    bg: 'rgba(46,125,50,0.08)',
    avg_rainfall_mm: '2,000 – 3,500',
    climate_en: 'High annual rainfall. Suitable for high-water-need varieties. Disease pressure higher.',
    climate_si: 'ඉහළ වාර්ෂික වර්ෂාපතනය. ජල ඉල්ලුම වැඩි ප්‍රභේද ගොවිතැනට සුදුසුය.',
    districts: [
      { name: 'Kandy', si: 'මහනුවර' },
      { name: 'Matale', si: 'මාතලේ' },
      { name: 'Galle', si: 'ගාල්ල' },
      { name: 'Matara', si: 'මාතර' },
      { name: 'Kalutara', si: 'කළුතර' },
      { name: 'Ratnapura', si: 'රත්නපුරය' }
    ],
    recommended_varieties: ['Bg 366', 'Bw 367']
  },
  {
    zone: 'Intermediate Zone',
    zone_si: 'අතරමැදි කලාපය',
    icon: '🌤️',
    color: '#0288D1',
    bg: 'rgba(2,136,209,0.08)',
    avg_rainfall_mm: '1,500 – 2,000',
    climate_en: 'Moderate rainfall. Transitional climate supporting a wide range of varieties.',
    climate_si: 'මධ්‍යස්ථ වර්ෂාපතනය. පුළුල් ප්‍රභේද පරාසයකට ගැලපෙන දේශගුණය.',
    districts: [
      { name: 'Kurunegala', si: 'කුරුණෑගල' },
      { name: 'Badulla', si: 'බදුල්ල' },
      { name: 'Nuwara Eliya', si: 'නුවරඑළිය' },
      { name: 'Kegalle', si: 'කෑගල්ල' }
    ],
    recommended_varieties: ['Bg 352', 'Bg 366', 'At 362']
  }
];

// ── Quick Access Nav ──────────────────────────────────────────────────────────
export const QUICK_ACCESS = [
  { id: 'variety',   icon: '🌱', label_en: 'Select Paddy Variety',  label_si: 'වී ප්‍රභේදය තෝරන්න',   route: '/farmer-guide', color: '#2E7D32' },
  { id: 'monitor',   icon: '📡', label_en: 'Monitor Field',          label_si: 'ක්‍ෂේත්‍රය නිරීක්ෂණය',   route: '/digital-twin', color: '#0288D1' },
  { id: 'disease',   icon: '🤖', label_en: 'AI Disease Detection',   label_si: 'AI රෝග හඳුනාගැනීම',    route: '/disease',      color: '#D32F2F' },
  { id: 'fertilizer',icon: '🌾', label_en: 'Fertilizer Plan',        label_si: 'පොහොර සැලැස්ම',         route: '/fertilizer',   color: '#C49A00' },
  { id: 'yield',     icon: '📈', label_en: 'Yield Prediction',       label_si: 'අස්වැන්න පුරෝකථනය',    route: '/yield',        color: '#7B1FA2' },
  { id: 'npk',       icon: '💧', label_en: 'NPK Analysis',           label_si: 'NPK විශ්ලේෂණය',          route: '/npk',          color: '#00796B' }
];
