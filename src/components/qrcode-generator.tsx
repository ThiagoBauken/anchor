'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, QrCode as QrCodeIcon } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  projectName: string;
}

export default function QRCodeGenerator({ url, projectName }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrSize, setQrSize] = useState(512);
  const [includeText, setIncludeText] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [url, qrSize]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      await QRCode.toCanvas(canvasRef.current, url, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction for better scanning
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = (format: 'png' | 'svg' = 'png') => {
    if (format === 'png' && canvasRef.current) {
      // Download PNG from canvas
      const link = document.createElement('a');
      link.download = `qrcode-${projectName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else if (format === 'svg') {
      // Generate SVG QR code
      QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2
      }).then(svg => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = `qrcode-${projectName.replace(/\s+/g, '-').toLowerCase()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      });
    }
  };

  const downloadPrintable = () => {
    // Create a printable version with text
    const printCanvas = document.createElement('canvas');
    const ctx = printCanvas.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    // Set canvas size (A4 proportions at 300 DPI)
    const width = 2480; // ~210mm at 300 DPI
    const height = 3508; // ~297mm at 300 DPI
    printCanvas.width = width;
    printCanvas.height = height;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // QR Code (centered, large)
    const qrSize = 1800;
    const qrX = (width - qrSize) / 2;
    const qrY = 400;

    ctx.drawImage(canvasRef.current, qrX, qrY, qrSize, qrSize);

    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(projectName, width / 2, 300);

    // Instructions
    ctx.font = '60px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Escaneie o QR Code para visualizar', width / 2, qrY + qrSize + 150);
    ctx.fillText('as inspeções de ancoragem', width / 2, qrY + qrSize + 230);

    // AnchorView branding
    ctx.font = '48px Arial';
    ctx.fillStyle = '#999999';
    ctx.fillText('AnchorView - Sistema de Gerenciamento de Ancoragens', width / 2, height - 200);

    // Download
    const link = document.createElement('a');
    link.download = `qrcode-printable-${projectName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = printCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCodeIcon className="w-5 h-5" />
          QR Code
        </CardTitle>
        <CardDescription>
          Imprima este QR Code e cole na entrada do prédio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Preview */}
        <div className="bg-white p-6 rounded-lg border flex items-center justify-center">
          <div className="text-center">
            <canvas
              ref={canvasRef}
              className="mx-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <p className="text-sm text-gray-600 mt-4">{projectName}</p>
            <p className="text-xs text-gray-400 mt-1">
              Escaneie para visualizar as inspeções
            </p>
          </div>
        </div>

        {/* Size Control */}
        <div>
          <Label>Tamanho do QR Code: {qrSize}px</Label>
          <Input
            type="range"
            min="256"
            max="2048"
            step="128"
            value={qrSize}
            onChange={(e) => setQrSize(parseInt(e.target.value))}
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recomendado: 512px para tela, 1024px+ para impressão
          </p>
        </div>

        {/* Download Buttons */}
        <div className="space-y-2">
          <Button
            onClick={() => downloadQRCode('png')}
            className="w-full"
            variant="default"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar QR Code (PNG)
          </Button>

          <Button
            onClick={() => downloadQRCode('svg')}
            className="w-full"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar QR Code (SVG - Vetorial)
          </Button>

          <Button
            onClick={downloadPrintable}
            className="w-full"
            variant="secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Versão para Impressão (A4)
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">
            Instruções de Impressão:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use o formato SVG para impressão em alta qualidade</li>
            <li>• Imprima em tamanho A4 ou maior</li>
            <li>• Use papel de boa qualidade ou plastifique</li>
            <li>• Cole em local visível e protegido da chuva</li>
            <li>• Teste o QR Code com seu celular antes de colar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
