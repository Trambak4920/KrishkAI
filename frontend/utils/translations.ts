export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
];

type TranslationKeys = {
  [key: string]: { [lang: string]: string };
};

export const translations: TranslationKeys = {
  app_name: { en: 'KrishkAI', hi: 'कृषकAI', ta: 'கிருஷ்கAI', te: 'కృషక్AI', kn: 'ಕೃಷಕAI', mr: 'कृषकAI', bn: 'কৃষকAI' },
  welcome: { en: 'Welcome', hi: 'स्वागत है', ta: 'வரவேற்கிறோம்', te: 'స్వాగతం', kn: 'ಸ್ವಾಗತ', mr: 'स्वागत', bn: 'স্বাগতম' },
  home: { en: 'Home', hi: 'होम', ta: 'முகப்பு', te: 'హోమ్', kn: 'ಮುಖಪುಟ', mr: 'होम', bn: 'হোম' },
  crop_recommend: { en: 'Crop Advisor', hi: 'फसल सलाहकार', ta: 'பயிர் ஆலோசகர்', te: 'పంట సలహాదారు', kn: 'ಬೆಳೆ ಸಲಹೆಗಾರ', mr: 'पीक सल्लागार', bn: 'ফসল উপদেষ্টা' },
  disease_detect: { en: 'Crop Doctor', hi: 'फसल डॉक्टर', ta: 'பயிர் மருத்துவர்', te: 'పంట డాక్టర్', kn: 'ಬೆಳೆ ವೈದ್ಯ', mr: 'पीक डॉक्टर', bn: 'ফসল ডাক্তার' },
  knowledge_hub: { en: 'Knowledge Hub', hi: 'ज्ञान केंद्र', ta: 'அறிவு மையம்', te: 'జ్ఞాన కేంద్రం', kn: 'ಜ್ಞಾನ ಕೇಂದ್ರ', mr: 'ज्ञान केंद्र', bn: 'জ্ঞান কেন্দ্র' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल', ta: 'சுயவிவரம்', te: 'ప్రొఫైల్', kn: 'ಪ್ರೊಫೈಲ್', mr: 'प्रोफाइल', bn: 'প্রোফাইল' },
  credit_score: { en: 'Credit Score', hi: 'क्रेडिट स्कोर', ta: 'கடன் மதிப்பெண்', te: 'క్రెడిట్ స్కోర్', kn: 'ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್', mr: 'क्रेडिट स्कोर', bn: 'ক্রেডিট স্কোর' },
  marketplace: { en: 'Marketplace', hi: 'बाज़ार', ta: 'சந்தை', te: 'మార్కెట్', kn: 'ಮಾರುಕಟ್ಟೆ', mr: 'बाजार', bn: 'বাজার' },
  login: { en: 'Login', hi: 'लॉगिन', ta: 'உள்நுழை', te: 'లాగిన్', kn: 'ಲಾಗಿನ್', mr: 'लॉगिन', bn: 'লগইন' },
  register: { en: 'Register', hi: 'रजिस्टर', ta: 'பதிவு', te: 'నమోదు', kn: 'ನೋಂದಣಿ', mr: 'नोंदणी', bn: 'নিবন্ধন' },
  phone: { en: 'Phone Number', hi: 'फोन नंबर', ta: 'தொலைபேசி எண்', te: 'ఫోన్ నంబర్', kn: 'ಫೋನ್ ನಂಬರ್', mr: 'फोन नंबर', bn: 'ফোন নম্বর' },
  password: { en: 'Password', hi: 'पासवर्ड', ta: 'கடவுச்சொல்', te: 'పాస్వర్డ్', kn: 'ಪಾಸ್ವರ್ಡ್', mr: 'पासवर्ड', bn: 'পাসওয়ার্ড' },
  name: { en: 'Full Name', hi: 'पूरा नाम', ta: 'முழு பெயர்', te: 'పూర్తి పేరు', kn: 'ಪೂರ್ಣ ಹೆಸರು', mr: 'पूर्ण नाव', bn: 'পুরো নাম' },
  submit: { en: 'Submit', hi: 'जमा करें', ta: 'சமர்ப்பிக்க', te: 'సమర్పించు', kn: 'ಸಲ್ಲಿಸು', mr: 'सबमिट', bn: 'জমা দিন' },
  get_recommendation: { en: 'Get Recommendation', hi: 'सिफारिश प्राप्त करें', ta: 'பரிந்துரை பெறுங்கள்', te: 'సిఫారసు పొందండి', kn: 'ಶಿಫಾರಸು ಪಡೆಯಿರಿ', mr: 'शिफारस मिळवा', bn: 'সুপারিশ পান' },
  scan_crop: { en: 'Scan Crop', hi: 'फसल स्कैन करें', ta: 'பயிரை ஸ்கேன் செய்', te: 'పంటను స్కాన్ చేయండి', kn: 'ಬೆಳೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ', mr: 'पीक स्कॅन करा', bn: 'ফসল স্ক্যান করুন' },
  take_photo: { en: 'Take Photo', hi: 'फोटो लें', ta: 'புகைப்படம் எடு', te: 'ఫోటో తీయండి', kn: 'ಫೋಟೋ ತೆಗೆಯಿರಿ', mr: 'फोटो घ्या', bn: 'ছবি তুলুন' },
  gallery: { en: 'Choose from Gallery', hi: 'गैलरी से चुनें', ta: 'கேலரியிலிருந்து தேர்வு', te: 'గ్యాలరీ నుండి ఎంచుకోండి', kn: 'ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆ', mr: 'गॅलरीतून निवडा', bn: 'গ্যালারি থেকে বেছে নিন' },
  analyzing: { en: 'Analyzing...', hi: 'विश्लेषण हो रहा है...', ta: 'பகுப்பாய்வு...', te: 'విశ్లేషిస్తోంది...', kn: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...', mr: 'विश्लेषण...', bn: 'বিশ্লেষণ করা হচ্ছে...' },
  type_message: { en: 'Ask me anything about farming...', hi: 'खेती के बारे में कुछ भी पूछें...', ta: 'விவசாயம் பற்றி எதையும் கேளுங்கள்...', te: 'వ్యవసాయం గురించి ఏదైనా అడగండి...', kn: 'ಕೃಷಿ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ...', mr: 'शेतीबद्दल काहीही विचारा...', bn: 'কৃষি সম্পর্কে কিছু জিজ্ঞাসা করুন...' },
  terrain: { en: 'Terrain Type', hi: 'भूभाग प्रकार', ta: 'நிலப்பரப்பு வகை', te: 'భూభాగ రకం', kn: 'ಭೂಪ್ರದೇಶ ವಿಧ', mr: 'भूभाग प्रकार', bn: 'ভূখণ্ডের ধরন' },
  soil: { en: 'Soil Type', hi: 'मिट्टी का प्रकार', ta: 'மண் வகை', te: 'నేల రకం', kn: 'ಮಣ್ಣಿನ ವಿಧ', mr: 'मातीचा प्रकार', bn: 'মাটির ধরন' },
  temperature: { en: 'Temperature (°C)', hi: 'तापमान (°C)', ta: 'வெப்பநிலை (°C)', te: 'ఉష్ణోగ్రత (°C)', kn: 'ತಾಪಮಾನ (°C)', mr: 'तापमान (°C)', bn: 'তাপমাত্রা (°C)' },
  humidity: { en: 'Humidity (%)', hi: 'आर्द्रता (%)', ta: 'ஈரப்பதம் (%)', te: 'తేమ (%)', kn: 'ಆರ್ದ್ರತೆ (%)', mr: 'आर्द्रता (%)', bn: 'আর্দ্রতা (%)' },
  rainfall: { en: 'Rainfall (mm)', hi: 'वर्षा (mm)', ta: 'மழைப்பொழிவு (mm)', te: 'వర్షపాతం (mm)', kn: 'ಮಳೆ (mm)', mr: 'पाऊस (mm)', bn: 'বৃষ্টিপাত (mm)' },
  fertilizer: { en: 'Fertilizer Used', hi: 'उपयोग किया गया उर्वरक', ta: 'பயன்படுத்திய உரம்', te: 'వాడిన ఎరువు', kn: 'ಬಳಸಿದ ರಸಗೊಬ್ಬರ', mr: 'वापरलेले खत', bn: 'ব্যবহৃত সার' },
  problems: { en: 'Current Problems', hi: 'वर्तमान समस्याएं', ta: 'தற்போதைய பிரச்சனைகள்', te: 'ప్రస్తుత సమస్యలు', kn: 'ಪ್ರಸ್ತುತ ಸಮಸ್ಯೆಗಳು', mr: 'सध्याच्या समस्या', bn: 'বর্তমান সমস্যা' },
  logout: { en: 'Logout', hi: 'लॉगआउट', ta: 'வெளியேறு', te: 'లాగ్అవుట్', kn: 'ಲಾಗ್ಔಟ್', mr: 'लॉगआउट', bn: 'লগআউট' },
  language: { en: 'Language', hi: 'भाषा', ta: 'மொழி', te: 'భాష', kn: 'ಭಾಷೆ', mr: 'भाषा', bn: 'ভাষা' },
  no_account: { en: "Don't have an account?", hi: 'खाता नहीं है?', ta: 'கணக்கு இல்லையா?', te: 'ఖాతా లేదా?', kn: 'ಖಾತೆ ಇಲ್ಲವೇ?', mr: 'खाते नाही?', bn: 'অ্যাকাউন্ট নেই?' },
  have_account: { en: 'Already have an account?', hi: 'पहले से खाता है?', ta: 'ஏற்கனவே கணக்கு உள்ளதா?', te: 'ఇప్పటికే ఖాతా ఉందా?', kn: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?', mr: 'आधीच खाते आहे?', bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?' },
  state: { en: 'State', hi: 'राज्य', ta: 'மாநிலம்', te: 'రాష్ట్రం', kn: 'ರಾಜ್ಯ', mr: 'राज्य', bn: 'রাজ্য' },
  district: { en: 'District', hi: 'जिला', ta: 'மாவட்டம்', te: 'జిల్లా', kn: 'ಜಿಲ್ಲೆ', mr: 'जिल्हा', bn: 'জেলা' },
  check_eligibility: { en: 'Check Loan Eligibility', hi: 'ऋण पात्रता जांचें', ta: 'கடன் தகுதி சரிபார்', te: 'రుణ అర్హత తనిఖీ', kn: 'ಸಾಲ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ', mr: 'कर्ज पात्रता तपासा', bn: 'ঋণ যোগ্যতা যাচাই' },
  annual_income: { en: 'Annual Income (₹)', hi: 'वार्षिक आय (₹)', ta: 'ஆண்டு வருமானம் (₹)', te: 'వార్షిక ఆదాయం (₹)', kn: 'ವಾರ್ಷಿಕ ಆದಾಯ (₹)', mr: 'वार्षिक उत्पन्न (₹)', bn: 'বার্ষিক আয় (₹)' },
  land_area: { en: 'Land Area (Acres)', hi: 'भूमि क्षेत्र (एकड़)', ta: 'நிலப்பரப்பு (ஏக்கர்)', te: 'భూమి విస్తీర్ణం (ఎకరాలు)', kn: 'ಭೂಮಿ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)', mr: 'जमीन क्षेत्र (एकर)', bn: 'জমির আয়তন (একর)' },
  experience_years: { en: 'Farming Experience (Years)', hi: 'खेती का अनुभव (वर्ष)', ta: 'விவசாய அனுபவம் (ஆண்டுகள்)', te: 'వ్యవసాయ అనుభవం (సంవత్సరాలు)', kn: 'ಕೃಷಿ ಅನುಭವ (ವರ್ಷಗಳು)', mr: 'शेती अनुभव (वर्षे)', bn: 'কৃষি অভিজ্ঞতা (বছর)' },
  offline_data: { en: 'Offline Knowledge Base', hi: 'ऑफ़लाइन ज्ञान आधार', ta: 'ஆஃப்லைன் அறிவுத்தளம்', te: 'ఆఫ్‌లైన్ నాలెడ్జ్ బేస్', kn: 'ಆಫ್‌ಲೈನ್ ಜ್ಞಾನ ಮೂಲ', mr: 'ऑफलाइन ज्ञान आधार', bn: 'অফলাইন জ্ঞান ভাণ্ডার' },
};

export function t(key: string, lang: string = 'en'): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry['en'] || key;
}
