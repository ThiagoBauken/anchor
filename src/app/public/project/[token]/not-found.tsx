import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <AlertTriangle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Projeto Não Encontrado
        </h1>

        <p className="text-gray-600 mb-6">
          Este link pode estar incorreto ou o projeto não está mais disponível publicamente.
        </p>

        <div className="bg-white rounded-lg p-6 border shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Possíveis motivos:</h2>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li>• O QR Code pode estar desatualizado</li>
            <li>• O projeto foi tornado privado pela administradora</li>
            <li>• O link pode ter sido digitado incorretamente</li>
          </ul>
        </div>

        <p className="text-sm text-gray-500">
          Entre em contato com a administradora do condomínio para mais informações.
        </p>
      </div>
    </div>
  );
}
