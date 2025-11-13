import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface LanguagePopupProps {
  onLanguageSelect: (language: string) => void;
  onCurrencySelect?: (currency: string) => void;
}

export function LanguagePopup({ onLanguageSelect, onCurrencySelect }: LanguagePopupProps) {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  useEffect(() => {
    // Verificar se o usuário já selecionou um idioma
    const savedLanguage = localStorage.getItem('landing_language');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
    if (!savedLanguage) {
      // Mostrar popup após 500ms
      setTimeout(() => setOpen(true), 500);
    } else {
      onLanguageSelect(savedLanguage);
    }
  }, [onLanguageSelect]);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    localStorage.setItem('landing_language', language);
    onLanguageSelect(language);
  };

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const handleConfirm = () => {
    localStorage.setItem('landing_currency', selectedCurrency);
    if (onCurrencySelect) {
      onCurrencySelect(selectedCurrency);
    }
    setOpen(false);
  };

  const languages = [
    { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español (ES)', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'zh-CN', name: '中文 (CN)', flag: '🇨🇳' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
    { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar-SA', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-6 w-6" />
            Selecione seu idioma
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 mt-4 max-h-64 overflow-y-auto pr-2">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={selectedLanguage === lang.code ? 'default' : 'outline'}
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">Selecione sua moeda preferida</h3>
          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
            {['USD', 'BRL', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU'].map((currency) => (
              <Button
                key={currency}
                variant={selectedCurrency === currency ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCurrencySelect(currency)}
              >
                {currency}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Preços serão mostrados em USD com conversão
          </p>
        </div>

        <Button onClick={handleConfirm} className="w-full mt-4">
          Confirmar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
