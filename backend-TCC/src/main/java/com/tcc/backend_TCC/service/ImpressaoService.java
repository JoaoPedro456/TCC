package com.tcc.backend_TCC.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;

@Service
public class ImpressaoService {

    private static final Color AZUL = new Color(59, 130, 246);
    private static final Color SLATE = new Color(30, 41, 59);
    private static final Color CINZA_TEXTO = new Color(50, 50, 50);
    private static final Color CINZA_CLARO = new Color(110, 110, 130);
    private static final Color VERDE = new Color(22, 163, 74);
    private static final Color CINZA_FUNDO = new Color(241, 245, 249);

    private static final Font TITULO = new Font(Font.HELVETICA, 18, Font.BOLD, AZUL);
    private static final Font SUBTITULO = new Font(Font.HELVETICA, 11, Font.BOLD, SLATE);
    private static final Font NORMAL = new Font(Font.HELVETICA, 10, Font.NORMAL, CINZA_TEXTO);
    private static final Font NEGRITO = new Font(Font.HELVETICA, 10, Font.BOLD, CINZA_TEXTO);
    private static final Font PEQUENO = new Font(Font.HELVETICA, 8, Font.ITALIC, CINZA_CLARO);
    private static final Font VALOR = new Font(Font.HELVETICA, 12, Font.BOLD, VERDE);

    @Autowired
    private OrdemServicoRepository osRepository;

    public byte[] gerarPdfOs(Long osId) throws Exception {
        OrdemServico os = osRepository.findById(osId)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));

        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        Paragraph titulo = new Paragraph("ORDEM DE SERVICO", TITULO);
        titulo.setAlignment(Element.ALIGN_CENTER);
        titulo.setSpacingAfter(5);
        document.add(titulo);

        Paragraph osInfo = new Paragraph("OS #" + os.getId() + " | " + os.getDataRegisto(), PEQUENO);
        osInfo.setAlignment(Element.ALIGN_CENTER);
        osInfo.setSpacingAfter(15);
        document.add(osInfo);

        document.add(Chunk.NEWLINE);
        Phrase sep = new Phrase("____________________________________________________________________", PEQUENO);
        document.add(sep);
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("INFORMACOES DO CLIENTE", SUBTITULO));
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Cliente: " + (os.getCliente() != null ? os.getCliente().getNome() : "N/A"), NORMAL));
        document.add(new Paragraph("CPF: " + (os.getCliente() != null && os.getCliente().getCpf() != null ? os.getCliente().getCpf() : "N/A"), NORMAL));
        document.add(new Paragraph("Telefone: " + (os.getCliente() != null && os.getCliente().getTelefone() != null ? os.getCliente().getTelefone() : "N/A"), NORMAL));
        document.add(new Paragraph("Endereco: " + (os.getCliente() != null && os.getCliente().getEndereco() != null ? os.getCliente().getEndereco() : "N/A"), NORMAL));

        document.add(Chunk.NEWLINE);
        document.add(sep);
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("DESCRICAO DO SERVICO", SUBTITULO));
        document.add(Chunk.NEWLINE);
        document.add(new Paragraph(os.getObservacao() != null ? os.getObservacao() : "N/A", NORMAL));
        document.add(Chunk.NEWLINE);
        document.add(sep);
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("QUILOMETRAGEM: " + (os.getQuilometragem() != null ? os.getQuilometragem() + " km" : "N/A"), NORMAL));
        document.add(Chunk.NEWLINE);
        document.add(sep);
        document.add(Chunk.NEWLINE);

        if (os.getItensServico() != null && !os.getItensServico().isEmpty()) {
            document.add(new Paragraph("SERVICOS REALIZADOS", SUBTITULO));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{80, 20});

            PdfPCell h1 = new PdfPCell(new Paragraph("Servico", NEGRITO));
            PdfPCell h2 = new PdfPCell(new Paragraph("Valor", NEGRITO));
            h1.setBackgroundColor(CINZA_FUNDO);
            h2.setVerticalAlignment(Element.ALIGN_CENTER);
            h2.setBackgroundColor(CINZA_FUNDO);
            table.addCell(h1);
            table.addCell(h2);

            for (var item : os.getItensServico()) {
                table.addCell(new Paragraph(item.getNomeServico(), NORMAL));
                PdfPCell valor = new PdfPCell(new Paragraph("R$ " + item.getPrecoTabela(), NORMAL));
                valor.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(valor);
            }

            document.add(table);
            document.add(Chunk.NEWLINE);
            document.add(sep);
            document.add(Chunk.NEWLINE);
        }

        if (os.getMecanicos() != null && !os.getMecanicos().isEmpty()) {
            document.add(new Paragraph("FUNCIONARIOS ENVOLVIDOS", SUBTITULO));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{40, 30, 30});

            PdfPCell m1 = new PdfPCell(new Paragraph("Nome", NEGRITO));
            PdfPCell m2 = new PdfPCell(new Paragraph("Cargo", NEGRITO));
            PdfPCell m3 = new PdfPCell(new Paragraph("Valor", NEGRITO));
            m3.setHorizontalAlignment(Element.ALIGN_CENTER);
            for (PdfPCell c : new PdfPCell[]{m1, m2, m3}) {
                c.setBackgroundColor(CINZA_FUNDO);
                table.addCell(c);
            }

            for (var m : os.getMecanicos()) {
                table.addCell(new Paragraph(m.getMecanico() != null ? m.getMecanico().getNome() : "N/A", NORMAL));
                table.addCell(new Paragraph(m.getMecanico() != null && m.getMecanico().getCargo() != null ? m.getMecanico().getCargo() : "N/A", NORMAL));
                PdfPCell valor = new PdfPCell(new Paragraph("R$ " + m.getValorAtribuido(), NORMAL));
                valor.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(valor);
            }

            document.add(table);
            document.add(Chunk.NEWLINE);
            document.add(sep);
            document.add(Chunk.NEWLINE);
        }

        document.add(new Paragraph("VALOR TOTAL", SUBTITULO));
        document.add(Chunk.NEWLINE);
        Paragraph valorTotal = new Paragraph("R$ " + (os.getValorTotal() != null ? os.getValorTotal() : "0,00"), VALOR);
        valorTotal.setAlignment(Element.ALIGN_CENTER);
        valorTotal.setSpacingAfter(20);
        document.add(valorTotal);

        document.add(Chunk.NEWLINE);
        document.add(Chunk.NEWLINE);
        document.add(Chunk.NEWLINE);

        PdfPTable assinaturas = new PdfPTable(2);
        assinaturas.setWidthPercentage(100);
        assinaturas.setSpacingBefore(40);
        assinatura(assinaturas, "_______________________________", "Oficina / Responsavel");
        assinatura(assinaturas, "_______________________________", "Cliente");
        document.add(assinaturas);

        document.add(Chunk.NEWLINE);
        Paragraph rodape = new Paragraph("Bazani Mecanica - Sistema de Gestao", PEQUENO);
        rodape.setAlignment(Element.ALIGN_CENTER);
        document.add(rodape);

        document.close();
        return baos.toByteArray();
    }

    private void assinatura(PdfPTable table, String linha, String descricao) {
        PdfPCell c1 = new PdfPCell(new Paragraph(linha, NORMAL));
        PdfPCell c2 = new PdfPCell(new Paragraph(linha, NORMAL));
        c1.setBorder(0);
        c2.setBorder(0);
        c1.setPaddingTop(10);
        c2.setPaddingTop(10);
        table.addCell(c1);
        table.addCell(c2);

        PdfPCell d1 = new PdfPCell(new Paragraph(descricao, PEQUENO));
        PdfPCell d2 = new PdfPCell(new Paragraph(descricao, PEQUENO));
        d1.setBorder(0);
        d2.setBorder(0);
        table.addCell(d1);
        table.addCell(d2);
    }
}
