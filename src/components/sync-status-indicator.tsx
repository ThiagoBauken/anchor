
"use client";

import { useAnchorData } from "@/context/AnchorDataContext";
import { Cloud, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function SyncStatusIndicator() {
  const { syncStatus } = useAnchorData();

  const getStatusInfo = () => {
    switch (syncStatus) {
      case 'saving':
        return {
          icon: <Loader className="h-4 w-4 animate-spin text-blue-400" />,
          text: "Salvando...",
          tooltip: "Suas alterações estão sendo salvas no dispositivo.",
          variant: "secondary",
        };
      case 'saved':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-400" />,
          text: "Salvo",
          tooltip: "Todas as alterações foram salvas localmente no seu dispositivo.",
          variant: "secondary",
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-400" />,
          text: "Erro",
          tooltip: "Não foi possível salvar as alterações. Verifique o console para mais detalhes.",
          variant: "destructive",
        };
      case 'idle':
      default:
         return {
          icon: <Cloud className="h-4 w-4 text-muted-foreground" />,
          text: "Pronto",
          tooltip: "O sistema está pronto para salvar suas alterações.",
          variant: "secondary",
        };
    }
  };

  const { icon, text, tooltip, variant } = getStatusInfo();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant as any} className="cursor-help flex items-center gap-2 pl-2 pr-3 py-1.5">
            {icon}
            <span className="hidden sm:inline">{text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
