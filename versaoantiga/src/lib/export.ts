
"use client";

import type { AnchorPoint, AnchorTest, Project, User } from "@/types";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType, ImageRun, PageOrientation, Header, Footer, PageNumber, HeightRule, HorizontalPositionAlign, VerticalPositionAlign, WidthType } from 'docx';
import { saveAs } from 'file-saver';

// Base64 encoded logo for watermarks - a small, transparent 1x1 pixel PNG
const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const fetchAsDataURL = async (url: string): Promise<string> => {
    if (url.startsWith('data:')) {
        return url;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch image from ${url}, status: ${response.status}`);
            return 'https://placehold.co/600x400.png'; // Fallback
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = (error) => {
                console.error("FileReader error:", error);
                reject('https://placehold.co/600x400.png'); // Fallback on read error
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error(`Error fetching URL ${url}`, e);
        return 'https://placehold.co/600x400.png'; // Fallback on network error
    }
};

const createImageRun = async (url: string, width: number, height: number): Promise<ImageRun> => {
    const dataUrl = await fetchAsDataURL(url);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new ImageRun({
        data: blob,
        transformation: {
            width,
            height,
        },
    });
};


const getDataAndPhotos = async (project: Project, points: AnchorPoint[], tests: AnchorTest[], activeFloorPlan: string | null) => {
    const photoPromises = points.flatMap(point => {
        const pointTest = tests.find(t => t.pontoId === point.id);
        const photosToFetch = [];
        if (point.foto) photosToFetch.push({ type: 'Ponto', photo: point.foto, pointNumber: point.numeroPonto, lacre: point.numeroLacre || 'N/A' });
        if (pointTest?.fotoTeste) photosToFetch.push({ type: 'Teste', photo: pointTest.fotoTeste, pointNumber: point.numeroPonto, lacre: point.numeroLacre || 'N/A' });
        if (pointTest?.fotoPronto) photosToFetch.push({ type: 'Finalizado', photo: pointTest.fotoPronto, pointNumber: point.numeroPonto, lacre: point.numeroLacre || 'N/A' });
        return photosToFetch;
    });

    const processedPhotos = await Promise.all(
      photoPromises.map(async ({ type, photo, pointNumber, lacre }) => {
          const title = `Ponto #${pointNumber} (Lacre: ${lacre}) - ${type}`;
          const dataUrl = await fetchAsDataURL(photo);
          return { src: dataUrl, title };
      })
    );
    
    // Use the activeFloorPlan URL to find the correct map element
    const mapElement = activeFloorPlan ? document.getElementById(`export-map-${activeFloorPlan}`) : null;
    let mapImage = '';
    if (mapElement) {
        try {
            const { offsetWidth, offsetHeight } = mapElement;
            mapImage = await toPng(mapElement, { 
                quality: 1.0, 
                pixelRatio: 2,
                width: offsetWidth,
                height: offsetHeight,
                backgroundColor: 'white' // Set a background color to avoid transparency issues
            });
        } catch (error) {
            console.error('Error generating map image:', error);
            mapImage = 'https://placehold.co/800x600.png';
        }
    } else {
        console.warn('Map element for export not found. Active floor plan:', activeFloorPlan);
    }
    
    const floorPlanImages = await Promise.all(
      (project.floorPlanImages || []).map(img => fetchAsDataURL(img))
    );
    const projectWithDataUrls = {...project, floorPlanImages};
    
    const tableData = points.map(point => {
      const test = tests.find(t => t.pontoId === point.id);
      return {
          numeroPonto: point.numeroPonto,
          localizacao: point.localizacao || '-',
          tipoEquipamento: point.tipoEquipamento || '-',
          numeroLacre: point.numeroLacre || '-',
          status: test?.resultado || 'Não Testado',
          carga: test?.carga || '-',
          tempo: test?.tempo || '-',
          tecnico: test?.tecnico || '-',
          dataTeste: test ? new Date(test.dataHora).toLocaleDateString('pt-BR') : '-',
          observacoes: test?.observacoes || point.observacoes || '-',
      };
    }).sort((a, b) => {
        const numA = parseInt(a.numeroPonto.replace(/\D/g,''), 10);
        const numB = parseInt(b.numeroPonto.replace(/\D/g,''), 10);
        return numA - numB;
    });


    return {
        tableData: tableData,
        photoData: processedPhotos,
        mapImage,
        project: projectWithDataUrls
    };
};

export const exportToExcel = (points: AnchorPoint[], tests: AnchorTest[], fileName: string) => {
  // Excel export doesn't need the map, so we can pass null
  getDataAndPhotos({} as Project, points, tests, null).then(({ tableData }) => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  });
};

export const exportToCSV = (points: AnchorPoint[], tests: AnchorTest[], fileName: string) => {
  // CSV export doesn't need the map
  getDataAndPhotos({} as Project, points, tests, null).then(({ tableData }) => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([`\uFEFF${csvOutput}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    saveAs(blob, `${fileName}.csv`);
  });
};

export const exportToJSON = (points: AnchorPoint[], tests: AnchorTest[], fileName: string) => {
  const data = { points, tests };
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  saveAs(blob, `${fileName}.json`);
};

// Helper to add a watermark to each page
const addWatermark = (doc: jsPDF, logoDataUrl: string) => {
    const totalPages = doc.internal.pages.length - 1; 
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(150);
        doc.setFontSize(80);
        doc.setGState(new (doc as any).GState({opacity: 0.1}));
        doc.text(
            'AnchorView', 
            doc.internal.pageSize.getWidth() / 2, 
            doc.internal.pageSize.getHeight() / 2, 
            { align: 'center', angle: 45 }
        );
        doc.setGState(new (doc as any).GState({opacity: 1})); // Reset GState
    }
};

export const generatePdfReport = async (project: Project, points: AnchorPoint[], tests: AnchorTest[], users: User[], logoDataUrl: string | null, activeFloorPlan: string | null) => {
    const { tableData, photoData, mapImage } = await getDataAndPhotos(project, points, tests, activeFloorPlan);
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    let currentY = 15;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const addHeaderAndFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('LAUDO TÉCNICO DE INSPEÇÃO DE PONTOS DE ANCORAGEM', pageWidth / 2, margin, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Conforme NBR 16325-1 / NR-35 / NR-18', pageWidth / 2, margin + 5, { align: 'center' });
            doc.setLineWidth(0.5);
            doc.line(margin, margin + 8, pageWidth - margin, margin + 8);
            
            // Footer
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
            doc.text(`${project.name || 'AnchorView Report'}`, margin, doc.internal.pageSize.getHeight() - 10);
        }
    };

    const addSectionTitle = (title: string, yPos: number): number => {
        if (yPos > 260) {
            doc.addPage();
            yPos = margin + 15;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPos);
        return yPos + 10;
    };

    const addText = (text: string | string[], yPos: number): number => {
        const textLines = Array.isArray(text) ? text : doc.splitTextToSize(text, pageWidth - margin * 2);
        const textHeight = doc.getTextDimensions(textLines).h;
        if (yPos + textHeight > 280) {
            doc.addPage();
            yPos = margin + 15;
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(textLines, margin, yPos);
        return yPos + textHeight + 2;
    };
    
    // --- PAGE 1: COVER ---
    currentY = addSectionTitle('1. DADOS DO EMPREENDIMENTO', currentY);
    currentY = addText([
        `Nome do Condomínio/Edificação: ${project.name || 'Não informado'}`,
        `Endereço: ${project.obraAddress || 'Não informado'}`,
        `CNPJ: ${project.obraCNPJ || 'Não informado'}`,
    ], currentY);

    currentY = addSectionTitle('2. DADOS DO CONTRATADO', currentY);
    currentY = addText([
        `Empresa Executora: ${project.contratanteName || 'Não informado'}`,
        `CNPJ: ${project.cnpjContratado || 'Não informado'}`,
        `Responsável Técnico: ${project.responsavelTecnico || 'Não informado'}`,
        `CREA/CAU: ${project.registroCREA || 'Não informado'}`,
        `Contato: ${project.contato || 'Não informado'}`,
    ], currentY);

    currentY = addSectionTitle('3. OBJETIVO DO LAUDO', currentY);
    currentY = addText('Avaliar e atestar as condições técnicas dos pontos de ancoragem instalados na estrutura da edificação, visando garantir sua resistência, segurança e conformidade com as normas técnicas vigentes para atividades com risco de queda em altura.', currentY);
    
    currentY = addSectionTitle('4. DOCUMENTOS E NORMAS REFERENCIADAS', currentY);
    currentY = addText([
        '- NR-35 – Trabalho em Altura',
        '- NR-18 – Condições e Meio Ambiente de Trabalho na Indústria da Construção',
        '- NBR 16325-1:2014 – Dispositivos de ancoragem para sistemas de proteção contra quedas',
        '- Projeto de Instalação de Ancoragens (se houver)',
        '- ART (Anotação de Responsabilidade Técnica)'
    ], currentY);
    
    currentY = addSectionTitle('5. METODOLOGIA DE INSPEÇÃO', currentY);
    addText([
        '- Verificação visual e tátil dos pontos de ancoragem, olhais, placas de base, soldas, parafusos e buchas;',
        '- Inspeção da integridade estrutural das bases onde estão fixados;',
        '- Testes de tração realizados com dinamômetro (se aplicável);',
        '- Registro fotográfico;',
        '- Identificação dos pontos por numeração e croqui de localização.'
    ], currentY);


    // --- PAGE 2: TABLE ---
    doc.addPage();
    currentY = margin + 15;
    currentY = addSectionTitle('6. TABELA DE PONTOS E INSPEÇÕES', currentY);

    (doc as any).autoTable({
        startY: currentY,
        head: [['Ponto', 'Localização', 'Equipamento', 'Lacre', 'Status', 'Carga', 'Tempo', 'Técnico', 'Data']],
        body: tableData.map(d => [d.numeroPonto, d.localizacao, d.tipoEquipamento, d.numeroLacre, d.status, d.carga, d.tempo, d.tecnico, d.dataTeste]),
        theme: 'grid',
        headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 1.5 },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 25 } },
        didDrawPage: (data: any) => { currentY = data.cursor.y + 10; },
    });
    currentY = (doc as any).autoTable.previous.finalY + 10;

    // --- PAGE 3: MAP ---
    if (mapImage) {
        doc.addPage();
        currentY = margin + 15;
        currentY = addSectionTitle('7. MAPA DOS PONTOS', currentY);
        try {
            const mapHeight = (pageWidth - margin * 2) * 0.7;
            if (currentY + mapHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                currentY = margin + 15;
            }
            doc.addImage(mapImage, 'PNG', margin, currentY, pageWidth - (margin * 2), 0);
            currentY += mapHeight + 10;
        } catch(e) {
            console.error("Error adding map image to PDF:", e);
            currentY = addText("Erro ao renderizar a imagem do mapa.", currentY);
        }
    }

    // --- PHOTO APPENDIX PAGES ---
    if (photoData.length > 0) {
        doc.addPage();
        currentY = margin + 15;
        currentY = addSectionTitle('8. REGISTRO FOTOGRÁFICO', currentY);
        
        const photoHeight = 65;
        const photoWidth = (pageWidth - margin * 2 - 10) / 2;
        const spacing = 10;

        for (let i = 0; i < photoData.length; i += 2) {
            if (currentY + photoHeight + 15 > pageHeight - margin) {
                doc.addPage();
                currentY = margin + 15;
                currentY = addSectionTitle('8. REGISTRO FOTOGRÁFICO (continuação)', currentY);
            }

            // Photo 1 (left)
            const photo1 = photoData[i];
            try {
                const photoX1 = margin;
                doc.addImage(photo1.src, 'JPEG', photoX1, currentY, photoWidth, photoHeight, undefined, 'FAST');
                doc.setFontSize(8);
                doc.text(photo1.title, photoX1, currentY + photoHeight + 5);
            } catch(e) {
                console.error("Error adding photo 1 to PDF:", e);
                doc.text("Erro ao carregar imagem", margin, currentY + photoHeight / 2);
            }

            // Photo 2 (right)
            if (i + 1 < photoData.length) {
                const photo2 = photoData[i + 1];
                try {
                    const photoX2 = margin + photoWidth + spacing;
                    doc.addImage(photo2.src, 'JPEG', photoX2, currentY, photoWidth, photoHeight, undefined, 'FAST');
                    doc.setFontSize(8);
                    doc.text(photo2.title, photoX2, currentY + photoHeight + 5);
                } catch(e) {
                    console.error("Error adding photo 2 to PDF:", e);
                    doc.text("Erro ao carregar imagem", margin + photoWidth + spacing, currentY + photoHeight/2);
                }
            }
            
            currentY += photoHeight + 15;
        }
    }
    
    // FINALIZATION
    if (logoDataUrl) {
      addWatermark(doc, logoDataUrl);
    }
    addHeaderAndFooter();

    doc.save(`${project.name.replace(/\s+/g, '_') || 'relatorio'}_tecnico.pdf`);
};

const createWatermarkImageRun = async (url: string): Promise<ImageRun> => {
    const dataUrl = await fetchAsDataURL(url);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new ImageRun({
        data: blob,
        transformation: {
            width: 500,
            height: 500,
        },
        floating: {
            horizontalPosition: {
                align: HorizontalPositionAlign.CENTER,
            },
            verticalPosition: {
                align: VerticalPositionAlign.CENTER,
            },
            behindDocument: true,
        },
    });
};

export const exportToWord = async (project: Project, points: AnchorPoint[], tests: AnchorTest[], users: User[], logoDataUrl: string | null, fileName: string, activeFloorPlan: string | null) => {
    const { tableData, photoData, mapImage } = await getDataAndPhotos(project, points, tests, activeFloorPlan);
    const allApproved = points.length > 0 && points.every(p => p.status === 'Aprovado');

    const watermarkHeader = logoDataUrl ? new Header({
        children: [new Paragraph({
            children: [await createWatermarkImageRun(logoDataUrl)],
        })]
    }) : undefined;

    // Create a table for photos
    const photoTableRows = [];
    for (let i = 0; i < photoData.length; i += 2) {
        const photo1 = photoData[i];
        const photo2 = photoData[i + 1]; // Can be undefined

        const cell1Children = [];
        try {
            cell1Children.push(new Paragraph({
                children: [await createImageRun(photo1.src, 225, 168)],
                alignment: AlignmentType.CENTER,
            }));
        } catch (e) { console.error("Error creating image run for photo1", e); }
        cell1Children.push(new Paragraph({
            text: photo1.title,
            alignment: AlignmentType.CENTER,
            style: "strong",
            spacing: { after: 200 }
        }));

        const cell1 = new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            children: cell1Children,
        });
        
        const cell2Children = [];
        if (photo2) {
            try {
                cell2Children.push(new Paragraph({
                    children: [await createImageRun(photo2.src, 225, 168)],
                    alignment: AlignmentType.CENTER,
                }));
            } catch (e) { console.error("Error creating image run for photo2", e); }
            cell2Children.push(new Paragraph({
                text: photo2.title,
                alignment: AlignmentType.CENTER,
                style: "strong",
                spacing: { after: 200 }
            }));
        } else {
            cell2Children.push(new Paragraph(""));
        }

        const cell2 = new TableCell({
             width: { size: 4500, type: WidthType.DXA },
             children: cell2Children
        });

        photoTableRows.push(new TableRow({ children: [cell1, cell2] }));
    }
    
    const photoTable = new Table({
        width: { size: 100, type: WidthType.PERCENT },
        rows: photoTableRows,
        columnWidths: [4500, 4500],
        borders: {
            top: { style: "none", size: 0, color: "FFFFFF" },
            bottom: { style: "none", size: 0, color: "FFFFFF" },
            left: { style: "none", size: 0, color: "FFFFFF" },
            right: { style: "none", size: 0, color: "FFFFFF" },
            insideHorizontal: { style: "none", size: 0, color: "FFFFFF" },
            insideVertical: { style: "none", size: 0, color: "FFFFFF" },
        }
    });

    const tableHeader = new TableRow({
        children: ['Ponto', 'Localização', 'Equipamento', 'Lacre', 'Status', 'Carga (kgf)', 'Tempo (min)', 'Técnico', 'Data', 'Obs.'].map(text => 
            new TableCell({ 
                children: [new Paragraph({ text, style: 'strong', alignment: AlignmentType.CENTER })],
                verticalAlign: 'center',
            })
        ),
        tableHeader: true,
    });
    
    const dataRows = tableData.map(d => new TableRow({
        children: [
            d.numeroPonto,
            d.localizacao,
            d.tipoEquipamento,
            d.numeroLacre,
            d.status,
            d.carga,
            d.tempo,
            d.tecnico,
            d.dataTeste,
            d.observacoes
        ].map(text => new TableCell({ children: [new Paragraph({ text, alignment: AlignmentType.CENTER })], verticalAlign: 'center' }))
    }));
    
    const dataTable = new Table({
        width: { size: 100, type: WidthType.PERCENT },
        columnWidths: [800, 1500, 1500, 800, 900, 800, 800, 1200, 1000, 1500],
        rows: [tableHeader, ...dataRows],
    });


    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "Normal", name: "Normal", basedOn: "Normal", next: "Normal", run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 120 } } },
                { id: "strong", name: "Strong", basedOn: "Normal", run: { bold: true } },
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 32, bold: true }, paragraph: { spacing: { before: 240, after: 120 } } },
                { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", run: { size: 24, bold: true }, paragraph: { spacing: { after: 120 } } },
                { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { size: 48, bold: true }, paragraph: { spacing: { after: 240 } } },
            ],
        },
        sections: [{
            ...(watermarkHeader && { headers: { default: watermarkHeader } }),
            footers: {
                 default: new Footer({
                      children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${project.name || 'AnchorView Report'}\t\t\t` }),
                                new TextRun({ children: [PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES] }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                      ],
                 }),
            },
            children: [
                new Paragraph({ text: 'LAUDO TÉCNICO DE INSPEÇÃO DE PONTOS DE ANCORAGEM', style: "Title", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: 'Conforme NBR 16325-1 / NR-35 / NR-18', style: "Heading3", alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                
                new Paragraph({ text: '1. DADOS DO EMPREENDIMENTO', style: "Heading1" }),
                new Paragraph(`Nome do Condomínio/Edificação: ${project.name || 'Não informado'}`),
                new Paragraph(`Endereço: ${project.obraAddress || 'Não informado'}`),
                new Paragraph(`CNPJ: ${project.obraCNPJ || 'Não informado'}`),
                
                new Paragraph({ text: '2. DADOS DO CONTRATADO', style: "Heading1" }),
                new Paragraph(`Empresa Executora: ${project.contratanteName || 'Não informado'}`),
                new Paragraph(`CNPJ: ${project.cnpjContratado || 'Não informado'}`),
                new Paragraph(`Responsável Técnico: ${project.responsavelTecnico || 'Não informado'}`),
                new Paragraph(`CREA/CAU: ${project.registroCREA || 'Não informado'}`),
                new Paragraph(`Contato: ${project.contato || 'Não informado'}`),
                
                new Paragraph({ text: '3. OBJETIVO DO LAUDO', style: "Heading1" }),
                new Paragraph('Avaliar e atestar as condições técnicas dos pontos de ancoragem instalados na estrutura da edificação, visando garantir sua resistência, segurança e conformidade com as normas técnicas vigentes para atividades com risco de queda em altura.'),
                
                new Paragraph({ text: '4. DOCUMENTOS E NORMAS REFERENCIADAS', style: "Heading1" }),
                new Paragraph({ text: '- NR-35 – Trabalho em Altura', bullet: { level: 0 } }),
                new Paragraph({ text: '- NR-18 – Condições e Meio Ambiente de Trabalho na Indústria da Construção', bullet: { level: 0 } }),
                new Paragraph({ text: '- NBR 16325-1:2014 – Dispositivos de ancoragem para sistemas de proteção contra quedas', bullet: { level: 0 } }),
                new Paragraph({ text: '- Projeto de Instalação de Ancoragens (se houver)', bullet: { level: 0 } }),
                new Paragraph({ text: '- ART (Anotação de Responsabilidade Técnica)', bullet: { level: 0 } }),

                new Paragraph({ text: '5. METODOLOGIA DE INSPEÇÃO', style: "Heading1" }),
                new Paragraph({ text: '- Verificação visual e tátil dos pontos de ancoragem, olhais, placas de base, soldas, parafusos e buchas;', bullet: { level: 0 } }),
                new Paragraph({ text: '- Inspeção da integridade estrutural das bases onde estão fixados;', bullet: { level: 0 } }),
                new Paragraph({ text: '- Testes de tração realizados com dinamômetro (se aplicável);', bullet: { level: 0 } }),
                new Paragraph({ text: '- Registro fotográfico;', bullet: { level: 0 } }),
                new Paragraph({ text: '- Identificação dos pontos por numeração e croqui de localização.', bullet: { level: 0 } }),
                
                new Paragraph({ text: '6. DESCRIÇÃO DOS PONTOS DE ANCORAGEM INSPECIONADOS', style: "Heading1" }),
                new Paragraph(`Foram inspecionados um total de ${points.length} pontos de ancoragem neste projeto.`),
                
                new Paragraph({ text: '7. CONDIÇÃO GERAL DOS PONTOS', style: "Heading1" }),
                new Paragraph(`Após a avaliação, constatou-se que os pontos de ancoragem listados encontram-se ${allApproved ? 'em conformidade' : 'parcialmente ou totalmente fora de conformidade'} com os requisitos mínimos exigidos para utilização em sistemas de retenção de queda.`),

                new Paragraph({ text: '8. TABELA DE PONTOS E INSPEÇÕES', style: "Heading1", pageBreakBefore: true }),
                dataTable,

                new Paragraph({ text: '9. MAPA DOS PONTOS', style: "Heading1", pageBreakBefore: true }),
                ...(mapImage ? [new Paragraph({ children: [await createImageRun(mapImage, 600, 450)], alignment: AlignmentType.CENTER })] : [new Paragraph('Mapa não disponível.')]),

                new Paragraph({ text: '10. REGISTRO FOTOGRÁFICO', style: "Heading1", pageBreakBefore: true }),
                photoTable,
            ],
        }],
    });
    
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${fileName}.docx`);
    }).catch(e => {
        console.error("Error creating DOCX blob:", e);
    });
};
