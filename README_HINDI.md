# Personal AI — आसान हिंदी में सेटअप

यह वेबसाइट + installable PWA का शुरुआती प्रोजेक्ट है। यह Android APK नहीं है, लेकिन HTTPS पर चलने के बाद इसे मोबाइल में ऐप की तरह इंस्टॉल किया जा सकता है। बाद में इसी वेबसाइट को APK में पैक किया जा सकता है।

## क्या चाहिए
- GitHub अकाउंट
- Render अकाउंट
- Google AI Studio से Gemini API key (अगर उपलब्ध मुफ्त quota चाहिए)
- API key को कभी भी `public` फोल्डर या GitHub कोड में न डालें।

## Render पर वेबसाइट चलाने के लिए
1. इस ZIP को खोलें और अंदर की सभी फाइलें GitHub repository में upload करें।
2. Render में **New → Web Service** चुनें और अपनी GitHub repository connect करें।
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Deploy करें।
6. Render service की **Environment** सेटिंग में `GEMINI_API_KEY` नाम का variable बनाएँ और उसकी value में अपनी API key डालें। Save करके redeploy करें।
7. Render की `https://...onrender.com` वेबसाइट खोलकर सवाल पूछें।

## APK कैसे बनेगी?
वेबसाइट HTTPS पर सही चलने के बाद Android पर Chrome में खोलें। मेन्यू में “Install app” या “Add to Home screen” आए तो उसे चुनें। यह PWA इंस्टॉल है, सामान्य APK फ़ाइल नहीं। असली APK बनाने के लिए बाद में PWA Builder जैसे टूल से पैक किया जा सकता है।

## ध्यान दें
- AI जवाबों के लिए इंटरनेट चाहिए।
- Google AI Studio के मॉडल, मुफ्त quota और उपलब्धता बदल सकते हैं।
- API key निजी रखें; खर्च/सीमा के लिए अपने Google AI Studio खाते की शर्तें जाँचें।
- यदि Render की free service सो जाती है तो पहली request में देर हो सकती है।
