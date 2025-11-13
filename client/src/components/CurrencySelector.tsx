import { useCurrency } from "@/contexts/CurrencyContext";
import { Currency } from "@/hooks/useCurrency";
import { DollarSign, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const currencySymbols: Record<Currency, string> = {
  BRL: "R$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
};

const currencyNames: Record<Currency, string> = {
  BRL: "Real Brasileiro",
  EUR: "Euro",
  GBP: "Libra Esterlina",
  JPY: "Iene",
  CAD: "Dólar Canadense",
  AUD: "Dólar Australiano",
  CHF: "Franco Suíço",
};

export function CurrencySelector() {
  const { currency, setCurrency, loading, refresh } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <span className="text-base">{currencySymbols[currency]}</span>
            <span className="font-medium">{currency}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(currencySymbols) as Currency[]).map((curr) => (
            <DropdownMenuItem
              key={curr}
              onClick={() => setCurrency(curr)}
              className={currency === curr ? "bg-accent" : ""}
            >
              <span className="font-semibold mr-2">{currencySymbols[curr]}</span>
              <span>{currencyNames[curr]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        onClick={refresh}
        disabled={loading}
        className="h-9 w-9 p-0"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}

