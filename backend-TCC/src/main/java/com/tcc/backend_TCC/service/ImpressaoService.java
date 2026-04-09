package com.tcc.backend_TCC.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;

@Service
public class ImpressaoService {

    // ── Paleta de Cores (Preto, Branco e Tons de Cinza) ──────────
    private static final Color PRETO = Color.BLACK;
    private static final Color CINZA_ESCURO = new Color(80, 80, 80);
    private static final Color CINZA_CLARO = new Color(230, 230, 230);
    private static final Color BRANCO = Color.WHITE;

    // ── Fontes Profissionais e Didáticas ─────────────────────────
    private static final Font F_TITULO = new Font(Font.HELVETICA, 18, Font.BOLD, PRETO);
    private static final Font F_SUBTITULO = new Font(Font.HELVETICA, 10, Font.NORMAL, CINZA_ESCURO);
    private static final Font F_SEC_HEADER = new Font(Font.HELVETICA, 10, Font.BOLD, BRANCO);
    private static final Font F_LABEL = new Font(Font.HELVETICA, 9, Font.BOLD, PRETO);
    private static final Font F_NORMAL = new Font(Font.HELVETICA, 9, Font.NORMAL, PRETO);
    private static final Font F_DESTAQUE_TOTAL = new Font(Font.HELVETICA, 16, Font.BOLD, PRETO);

    @Autowired
    private OrdemServicoRepository osRepository;

    public byte[] gerarPdfOs(Long osId) throws Exception {
        OrdemServico os = osRepository.findById(osId)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        // ════════════════════════════════════════════════════════
        // CABEÇALHO (Limpo e sem sobreposições)
        // ════════════════════════════════════════════════════════
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{60, 40}); // 60% esquerda, 40% direita

        // Esquerda: Dados da Empresa
        PdfPCell leftHeader = new PdfPCell();
        leftHeader.setBorder(Rectangle.BOTTOM);
        leftHeader.setBorderColor(CINZA_ESCURO);
        leftHeader.setPaddingBottom(10f);
        leftHeader.addElement(new Paragraph("BAZANI MECÂNICA", F_TITULO));
        leftHeader.addElement(new Paragraph("Sistema de Gestão de Ordens de Serviço", F_SUBTITULO));

        // Direita: Número da OS e Data
        PdfPCell rightHeader = new PdfPCell();
        rightHeader.setBorder(Rectangle.BOTTOM);
        rightHeader.setBorderColor(CINZA_ESCURO);
        rightHeader.setPaddingBottom(10f);

        Paragraph osNum = new Paragraph("ORDEM DE SERVIÇO #" + os.getId(), F_TITULO);
        osNum.setAlignment(Element.ALIGN_RIGHT);
        rightHeader.addElement(osNum);

        Paragraph status = new Paragraph("Status: " + safe(os.getStatus() != null ? os.getStatus() : "Em andamento"), F_LABEL);
        status.setAlignment(Element.ALIGN_RIGHT);
        rightHeader.addElement(status);

        Paragraph dataTxt = new Paragraph("Data: " + safe(os.getDataRegisto()), F_NORMAL);
        dataTxt.setAlignment(Element.ALIGN_RIGHT);
        rightHeader.addElement(dataTxt);

        headerTable.addCell(leftHeader);
        headerTable.addCell(rightHeader);
        document.add(headerTable);
        document.add(spacer(15f));

        // ════════════════════════════════════════════════════════
        // SEÇÃO — DADOS DO CLIENTE
        // ════════════════════════════════════════════════════════
        document.add(buildSectionHeader("DADOS DO CLIENTE"));

        PdfPTable tCliente = new PdfPTable(4);
        tCliente.setWidthPercentage(100);
        tCliente.setWidths(new float[]{15, 35, 15, 35});

        addInfoRow(tCliente, "Cliente:", safe(os.getCliente() != null ? os.getCliente().getNome() : null),
                "CPF:",     safe(os.getCliente() != null ? os.getCliente().getCpf() : null));
        addInfoRow(tCliente, "Telefone:", safe(os.getCliente() != null ? os.getCliente().getTelefone() : null),
                "Endereço:", safe(os.getCliente() != null ? os.getCliente().getEndereco() : null));

        document.add(tCliente);
        document.add(spacer(30f));

        // ════════════════════════════════════════════════════════
        // SEÇÃO — DESCRIÇÃO DO SERVIÇO (Foco Principal)
        // ════════════════════════════════════════════════════════
        document.add(buildSectionHeader("DESCRIÇÃO DO SERVIÇO"));

        PdfPTable tDesc = new PdfPTable(1);
        tDesc.setWidthPercentage(100);

        PdfPCell descCell = new PdfPCell();
        descCell.setPadding(10f);
        descCell.setBorderColor(PRETO);
        descCell.setMinimumHeight(80f); // Garante um bom espaço mesmo se o texto for pequeno

        // Quilometragem menor e discreta acima da descrição
        String kmTexto = (os.getQuilometragem() != null) ? os.getQuilometragem() + " km" : "Sem viagem";
        Paragraph kmP = new Paragraph("Quilometragem: " + kmTexto, F_LABEL);
        kmP.setSpacingAfter(8f);
        descCell.addElement(kmP);

        // A Descrição em si
        Paragraph obsP = new Paragraph(safe(os.getObservacao()), F_NORMAL);
        descCell.addElement(obsP);

        tDesc.addCell(descCell);
        document.add(tDesc);
        document.add(spacer(30f));

        // ════════════════════════════════════════════════════════
        // SEÇÃO — SERVIÇOS DO CATÁLOGO
        // ════════════════════════════════════════════════════════
        if (os.getItensServico() != null && !os.getItensServico().isEmpty()) {
            document.add(buildSectionHeader("SERVIÇOS DO CATÁLOGO"));

            PdfPTable tSvc = new PdfPTable(2);
            tSvc.setWidthPercentage(100);
            tSvc.setWidths(new float[]{80, 20});

            tSvc.addCell(buildTableHeader("Descrição"));
            tSvc.addCell(buildTableHeader("Valor (R$)"));

            for (var item : os.getItensServico()) {
                tSvc.addCell(styledCell(safe(item.getNomeServico()), Element.ALIGN_LEFT));
                tSvc.addCell(styledCell("R$ " + safe(item.getPrecoTabela()), Element.ALIGN_CENTER));
            }
            document.add(tSvc);
            document.add(spacer(15f));
        }

        // ════════════════════════════════════════════════════════
        // SEÇÃO — MECÂNICOS ENVOLVIDOS (Só Nomes)
        // ════════════════════════════════════════════════════════
        if (os.getMecanicos() != null && !os.getMecanicos().isEmpty()) {
            document.add(buildSectionHeader("MECÂNICOS ENVOLVIDOS"));

            PdfPTable tMec = new PdfPTable(1);
            tMec.setWidthPercentage(100);

            for (var m : os.getMecanicos()) {
                String nome = m.getMecanico() != null ? safe(m.getMecanico().getNome()) : "N/A";
                PdfPCell mecCell = new PdfPCell(new Paragraph("• " + nome, F_NORMAL));
                mecCell.setBorder(Rectangle.BOTTOM);
                mecCell.setBorderColor(CINZA_CLARO);
                mecCell.setPadding(6f);
                tMec.addCell(mecCell);
            }
            document.add(tMec);
            document.add(spacer(20f));
        }

        // ════════════════════════════════════════════════════════
        // VALOR TOTAL E ASSINATURA (Lado a Lado)
        // ════════════════════════════════════════════════════════
        PdfPTable tBottom = new PdfPTable(2);
        tBottom.setWidthPercentage(100);
        tBottom.setWidths(new float[]{40, 60}); // 40% para Total, 60% para Assinatura
        tBottom.setSpacingBefore(10f);

        // Caixa do Valor Total (Esquerda)
        PdfPCell totalCell = new PdfPCell();
        totalCell.setBorder(Rectangle.BOX);
        totalCell.setBorderWidth(1.5f);
        totalCell.setBorderColor(PRETO);
        totalCell.setBackgroundColor(CINZA_CLARO);
        totalCell.setPadding(15f);
        totalCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph lblTotal = new Paragraph("TOTAL A PAGAR", F_LABEL);
        lblTotal.setAlignment(Element.ALIGN_CENTER);
        totalCell.addElement(lblTotal);

        String totalFormatado = "R$ " + (os.getValorTotal() != null ? os.getValorTotal() : "0.00");
        Paragraph valTotal = new Paragraph(totalFormatado, F_DESTAQUE_TOTAL);
        valTotal.setAlignment(Element.ALIGN_CENTER);
        valTotal.setSpacingBefore(5f);
        totalCell.addElement(valTotal);

        // Área de Assinatura (Direita)
        PdfPCell sigCell = new PdfPCell();
        sigCell.setBorder(Rectangle.NO_BORDER);
        sigCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        sigCell.setPaddingTop(30f);

        Paragraph linhaAssinatura = new Paragraph("____________________________________________________", F_NORMAL);
        linhaAssinatura.setAlignment(Element.ALIGN_CENTER);
        sigCell.addElement(linhaAssinatura);

        Paragraph lblAssinatura = new Paragraph("Assinatura do Cliente", F_LABEL);
        lblAssinatura.setAlignment(Element.ALIGN_CENTER);
        lblAssinatura.setSpacingBefore(5f);
        sigCell.addElement(lblAssinatura);

        tBottom.addCell(totalCell);
        tBottom.addCell(sigCell);
        document.add(tBottom);

        // ════════════════════════════════════════════════════════
        // RODAPÉ
        // ════════════════════════════════════════════════════════
        document.add(spacer(30f));
        Paragraph rodape = new Paragraph("Documento gerado pelo Sistema Bazani Mecânica e Autopeças", F_SUBTITULO);
        rodape.setAlignment(Element.ALIGN_CENTER);
        document.add(rodape);

        document.close();
        return baos.toByteArray();
    }

    // ════════════════════════════════════════════════════════════
    // FUNÇÕES AUXILIARES (HELPERS)
    // ════════════════════════════════════════════════════════════

    private PdfPTable buildSectionHeader(String titulo) {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Paragraph(titulo, F_SEC_HEADER));
        cell.setBackgroundColor(PRETO); // Fundo Preto
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(6f);
        t.addCell(cell);
        return t;
    }

    private PdfPCell buildTableHeader(String texto) {
        PdfPCell cell = new PdfPCell(new Paragraph(texto, F_LABEL));
        cell.setBackgroundColor(CINZA_CLARO);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(PRETO);
        cell.setPadding(6f);
        return cell;
    }

    private void addInfoRow(PdfPTable table, String l1, String v1, String l2, String v2) {
        table.addCell(labelCell(l1));
        table.addCell(valueCell(v1));
        table.addCell(labelCell(l2));
        table.addCell(valueCell(v2));
    }

    private PdfPCell labelCell(String texto) {
        PdfPCell c = new PdfPCell(new Paragraph(texto, F_LABEL));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(CINZA_CLARO);
        c.setPadding(6f);
        return c;
    }

    private PdfPCell valueCell(String texto) {
        PdfPCell c = new PdfPCell(new Paragraph(texto, F_NORMAL));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(CINZA_CLARO);
        c.setPadding(6f);
        return c;
    }

    private PdfPCell styledCell(String texto, int align) {
        PdfPCell c = new PdfPCell(new Paragraph(texto, F_NORMAL));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(CINZA_CLARO);
        c.setPadding(6f);
        c.setHorizontalAlignment(align);
        return c;
    }

    private Chunk spacer(float height) {
        return new Chunk(" \n", new Font(Font.HELVETICA, height));
    }

    // Agora o "safe" aceita Objetos (como LocalDate ou BigDecimal) e transforma em texto
    private String safe(Object val) {
        return (val != null && !val.toString().isBlank()) ? val.toString() : "N/A";
    }
}