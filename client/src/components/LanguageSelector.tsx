import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

const languages = [
  { code: 'pt-BR', flag: '🇧🇷', name: 'Português (BR)' },
  { code: 'en-US', flag: '🇺🇸', name: 'English (US)' },
  { code: 'es-ES', flag: '🇪🇸', name: 'Español (ES)' },
  { code: 'fr-FR', flag: '🇫🇷', name: 'Français (FR)' },
  { code: 'de-DE', flag: '🇩🇪', name: 'Deutsch (DE)' },
  { code: 'it-IT', flag: '🇮🇹', name: 'Italiano (IT)' },
  { code: 'ja-JP', flag: '🇯🇵', name: '日本語 (JP)' },
  { code: 'zh-CN', flag: '🇨🇳', name: '中文 (CN)' },
  { code: 'ko-KR', flag: '🇰🇷', name: '한국어 (KR)' },
  { code: 'ru-RU', flag: '🇷🇺', name: 'Русский (RU)' },
  { code: 'ar-SA', flag: '🇸🇦', name: 'العربية (SA)' },
  { code: 'hi-IN', flag: '🇮🇳', name: 'हिंदी (IN)' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');

  // Não fazer query em páginas públicas (login, registro, etc)
  const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/start'];
  const isPublicPage = publicPages.includes(location);
  
  const { data: userData } = trpc.user.getProfile.useQuery(undefined, {
    enabled: !isPublicPage,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const updateLanguage = trpc.user.updateLanguage.useMutation({
    onError: (error) => {
      console.error('[LanguageSelector] Erro ao atualizar idioma:', error);
    },
  });

  useEffect(() => {
    if (userData) {
      if (!userData.language) {
        // Usuário não tem idioma salvo, mostrar popup
        setOpen(true);
      } else {
        // Carregar idioma salvo
        setSelectedLanguage(userData.language);
        i18n.changeLanguage(userData.language);
        localStorage.setItem('language', userData.language);
      }
    }
  }, [userData, i18n]);

  const handleSelectLanguage = async (code: string) => {
    setSelectedLanguage(code);
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    
    // Só salvar no backend se não for página pública
    if (!isPublicPage) {
      try {
        await updateLanguage.mutateAsync({ language: code });
      } catch (error) {
        console.error('[LanguageSelector] Erro ao salvar idioma:', error);
      }
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Selecione seu idioma</DialogTitle>
          <DialogDescription>
            Escolha o idioma que você prefere usar na plataforma
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={selectedLanguage === lang.code ? 'default' : 'outline'}
              className="h-16 text-lg justify-start"
              onClick={() => handleSelectLanguage(lang.code)}
            >
              <span className="text-3xl mr-3">{lang.flag}</span>
              <span>{lang.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
