import { useState, useEffect } from 'react';

interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

const cache: TranslationCache = {};

export function useTranslation(language: string) {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (text: string, targetLang: string): Promise<string> => {
    // Se for português, retornar original
    if (targetLang === 'pt-BR') {
      return text;
    }

    // Verificar cache
    const cacheKey = `${text}`;
    if (cache[cacheKey]?.[targetLang]) {
      return cache[cacheKey][targetLang];
    }

    try {
      setIsTranslating(true);

      // Mapear códigos de idioma
      const langMap: { [key: string]: string } = {
        'pt-BR': 'pt',
        'en-US': 'en',
        'es-ES': 'es',
        'fr-FR': 'fr',
        'de-DE': 'de',
        'it-IT': 'it',
        'zh-CN': 'zh',
        'ja-JP': 'ja',
        'ru-RU': 'ru',
        'ar-SA': 'ar',
        'hi-IN': 'hi',
        'ko-KR': 'ko',
      };

      const targetCode = langMap[targetLang] || 'en';

      // Usar API gratuita de tradução (MyMemory)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=pt|${targetCode}`
      );

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText;
        
        // Salvar no cache
        if (!cache[cacheKey]) {
          cache[cacheKey] = {};
        }
        cache[cacheKey][targetLang] = translated;
        
        return translated;
      }

      return text; // Retornar original se falhar
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  const translateObject = async (obj: any, targetLang: string): Promise<any> => {
    if (targetLang === 'pt-BR') {
      return obj;
    }

    const translated: any = {};
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        translated[key] = await translate(obj[key], targetLang);
      } else {
        translated[key] = obj[key];
      }
    }

    return translated;
  };

  return {
    translate,
    translateObject,
    isTranslating,
  };
}
