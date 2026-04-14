package com.tcc.backend_TCC.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.model.OrdemServicoMecanico;
import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.lowagie.text.pdf.PdfGState;
import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

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
        PdfWriter writer = PdfWriter.getInstance(document, baos);

        document.open();

        // ════════════════════════════════════════════════════════
        // CABEÇALHO
        // ════════════════════════════════════════════════════════
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{60, 40});

        PdfPCell leftHeader = new PdfPCell();
        leftHeader.setBorder(Rectangle.BOTTOM);
        leftHeader.setBorderColor(CINZA_ESCURO);
        leftHeader.setPaddingBottom(10f);
        leftHeader.addElement(new Paragraph("BAZANI MECÂNICA", F_TITULO));
        leftHeader.addElement(new Paragraph("Sistema de Gestão de Ordens de Serviço", F_SUBTITULO));

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
        document.add(spacer(20f));

        // ════════════════════════════════════════════════════════
        // DADOS DO CLIENTE
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
        document.add(spacer(35f));

        // ════════════════════════════════════════════════════════
        // INFORMAÇÕES DO SERVIÇO E VEÍCULO
        // ════════════════════════════════════════════════════════
        document.add(buildSectionHeader("INFORMAÇÕES DO SERVIÇO"));

        PdfPTable tDesc = new PdfPTable(1);
        tDesc.setWidthPercentage(100);

        PdfPCell descCell = new PdfPCell();
        descCell.setPadding(10f);
        descCell.setBorderColor(PRETO);
        descCell.setMinimumHeight(80f);

        PdfPTable tInfoVeiculo = new PdfPTable(2);
        tInfoVeiculo.setWidthPercentage(100);
        tInfoVeiculo.setWidths(new float[]{50, 50});

        String veicTexto = (os.getVeiculo() != null) ? os.getVeiculo() : "Não informado";
        PdfPCell cVeiculo = new PdfPCell(new Paragraph("Veículo/Máquina: " + veicTexto, F_LABEL));
        cVeiculo.setBorder(Rectangle.NO_BORDER);
        cVeiculo.setPadding(0);
        cVeiculo.setPaddingBottom(10f);

        String kmInfo = "Sem viagem";
        if (os.getQuilometragem() != null && os.getQuilometragem() > 0) {
            kmInfo = String.format("%.1f", os.getQuilometragem()).replace(".", ",") + " km";
        }

        PdfPCell cKm = new PdfPCell(new Paragraph("Deslocação: " + kmInfo, F_LABEL));
        cKm.setBorder(Rectangle.NO_BORDER);
        cKm.setPadding(0);
        cKm.setPaddingBottom(10f);
        cKm.setHorizontalAlignment(Element.ALIGN_RIGHT);

        tInfoVeiculo.addCell(cVeiculo);
        tInfoVeiculo.addCell(cKm);
        descCell.addElement(tInfoVeiculo);

        Paragraph lblDesc = new Paragraph("Descrição detalhada:", F_LABEL);
        lblDesc.setSpacingAfter(4f);
        descCell.addElement(lblDesc);

        Paragraph obsP = new Paragraph(safe(os.getObservacao()), F_NORMAL);
        descCell.addElement(obsP);

        tDesc.addCell(descCell);
        document.add(tDesc);
        document.add(spacer(35f));

        // ════════════════════════════════════════════════════════
        // MATEMÁTICA E DETALHAMENTO DE VALORES (SERVIÇOS + KM)
        // ════════════════════════════════════════════════════════
        BigDecimal totalGeral = os.getValorTotal() != null ? os.getValorTotal() : BigDecimal.ZERO;
        BigDecimal qtdKm = os.getQuilometragem() != null ? BigDecimal.valueOf(os.getQuilometragem()) : BigDecimal.ZERO;
        BigDecimal precoKm = os.getValorKm() != null ? os.getValorKm() : BigDecimal.ZERO;
        BigDecimal custoKm = qtdKm.multiply(precoKm).setScale(2, RoundingMode.HALF_UP);

        boolean temServicos = os.getItensServico() != null && !os.getItensServico().isEmpty();
        boolean temCustoKm = custoKm.compareTo(BigDecimal.ZERO) > 0;

        if (temServicos || temCustoKm) {
            document.add(buildSectionHeader("DETALHAMENTO DE VALORES"));

            PdfPTable tSvc = new PdfPTable(2);
            tSvc.setWidthPercentage(100);
            tSvc.setWidths(new float[]{80, 20});

            tSvc.addCell(buildTableHeader("Descrição"));
            tSvc.addCell(buildTableHeader("Valor (R$)"));

            // 1. Adiciona os Serviços do Catálogo
            if (temServicos) {
                for (var item : os.getItensServico()) {
                    tSvc.addCell(styledCell(safe(item.getNomeServico()), Element.ALIGN_LEFT));
                    tSvc.addCell(styledCell("R$ " + String.format("%.2f", item.getPrecoTabela()).replace(".", ","), Element.ALIGN_CENTER));
                }
            }

            // 2. Adiciona o Custo da Deslocação (KM) como um item faturado
            if (temCustoKm) {
                String lblCustoKm = "Deslocação (" + String.format("%.1f", os.getQuilometragem()).replace(".", ",") + " km)";
                tSvc.addCell(styledCell(lblCustoKm, Element.ALIGN_LEFT));
                tSvc.addCell(styledCell("R$ " + String.format("%.2f", custoKm).replace(".", ","), Element.ALIGN_CENTER));
            }

            document.add(tSvc);
            document.add(spacer(20f));
        }

        // ════════════════════════════════════════════════════════
        // MECÂNICOS
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
            document.add(spacer(25f));
        }

        // ════════════════════════════════════════════════════════
        // VALOR TOTAL E ASSINATURA (LIMPO)
        // ════════════════════════════════════════════════════════
        PdfPTable tBottom = new PdfPTable(2);
        tBottom.setWidthPercentage(100);
        tBottom.setWidths(new float[]{45, 55});
        tBottom.setSpacingBefore(10f);

        // Caixa de Total
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

        String totalFmt = String.format("%.2f", totalGeral).replace(".", ",");
        Paragraph valTotal = new Paragraph("R$ " + totalFmt, F_DESTAQUE_TOTAL);
        valTotal.setAlignment(Element.ALIGN_CENTER);
        valTotal.setSpacingBefore(5f);
        totalCell.addElement(valTotal);

        // Caixa de Assinatura
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
        // RODAPÉ (Modificado para letra menor e transparente)
        // ════════════════════════════════════════════════════════

        document.add(spacer(60f));
        Font fonteRodapePequena = new Font(F_SUBTITULO.getBaseFont(), 8f, F_SUBTITULO.getStyle(), F_SUBTITULO.getColor());
        Paragraph rodape = new Paragraph("Documento gerado pelo Sistema Bazani Mecânica e Autopeças", fonteRodapePequena);
        rodape.setAlignment(Element.ALIGN_CENTER);
        try {
            PdfGState estadoGraficoTransparente = new PdfGState();
            estadoGraficoTransparente.setFillOpacity(0.5f); // 0.0f (totalmente transparente) a 1.0f (opaco). 0.5f é 50%.

            // Obtemos o conteúdo direto do writer para aplicar o estado
            PdfContentByte cb = writer.getDirectContent();
            cb.saveState();
            cb.setGState(estadoGraficoTransparente); // Aplica a transparência

            document.add(rodape);
            cb.restoreState(); // Restaura o estado original (volta a ser opaco para os próximos elementos)

        } catch (Exception e) {
            // Caso não consiga aplicar a transparência (ex: sem acesso ao writer),
            // adiciona o rodapé menor, mas opaco, como segurança.
            document.add(rodape);
            e.printStackTrace();
        }

        document.close();
        return baos.toByteArray();
    }

    private PdfPTable buildSectionHeader(String titulo) {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Paragraph(titulo, F_SEC_HEADER));
        cell.setBackgroundColor(PRETO);
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

    private String safe(Object val) {
        return (val != null && !val.toString().isBlank()) ? val.toString() : "N/A";
    }

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private OrdemServicoMecanicoRepository mecanicoRepository;

    public byte[] gerarPdfComissao(Long funcId, LocalDate inicio, LocalDate fim) throws Exception {
        Pessoa func = pessoaRepository.findById(funcId).orElseThrow();
        // Busca as OSs onde ele trabalhou e que estão CONCLUÍDAS
        List<OrdemServicoMecanico> participacoes = mecanicoRepository.buscarComissoesMes(funcId, inicio, fim);

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        document.open();

        // Cabeçalho do Relatório
        document.add(new Paragraph("RELATÓRIO DE COMISSÕES E PAGAMENTO", F_TITULO));
        document.add(new Paragraph("Funcionário: " + func.getNome() + " (" + func.getCargo() + ")", F_NORMAL));
        document.add(new Paragraph("Período: " + inicio.getMonthValue() + "/" + inicio.getYear(), F_SUBTITULO));
        document.add(spacer(20f));

        // Tabela de OSs realizadas
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{15, 20, 45, 20});

        table.addCell(buildTableHeader("Data"));
        table.addCell(buildTableHeader("OS #"));
        table.addCell(buildTableHeader("Cliente"));
        table.addCell(buildTableHeader("Comissão (R$)"));

        BigDecimal totalComissao = BigDecimal.ZERO;
        for (OrdemServicoMecanico p : participacoes) {
            // Agora o valorAtribuido já vem do banco calculado apenas sobre o serviço!
            BigDecimal valorComissaoOs = p.getValorAtribuido() != null ? p.getValorAtribuido() : BigDecimal.ZERO;

            table.addCell(styledCell(p.getOrdemServico().getDataRegisto().toString(), Element.ALIGN_LEFT));
            table.addCell(styledCell(p.getOrdemServico().getId().toString(), Element.ALIGN_CENTER));
            table.addCell(styledCell(p.getOrdemServico().getCliente().getNome(), Element.ALIGN_LEFT));
            table.addCell(styledCell("R$ " + String.format("%.2f", valorComissaoOs).replace(".", ","), Element.ALIGN_RIGHT));

            totalComissao = totalComissao.add(valorComissaoOs);
        }
        document.add(table);
        document.add(spacer(30f));

        // Fechamento Financeiro (A "Mágica" do Salário + Comissão)
        PdfPTable resumo = new PdfPTable(2);
        resumo.setWidthPercentage(50);
        resumo.setHorizontalAlignment(Element.ALIGN_RIGHT);

        BigDecimal salarioBase = BigDecimal.valueOf(func.getSalarioBase() != null ? func.getSalarioBase() : 0);
        BigDecimal totalGeral = salarioBase.add(totalComissao);

        addResumoLinha(resumo, "Salário Base:", salarioBase);
        addResumoLinha(resumo, "Total Comissões:", totalComissao);
        addResumoLinha(resumo, "TOTAL A RECEBER:", totalGeral);

        document.add(resumo);
        document.close();
        return baos.toByteArray();
    }

    private void addResumoLinha(PdfPTable table, String label, BigDecimal valor) {
        PdfPCell c1 = new PdfPCell(new Paragraph(label, F_LABEL));
        c1.setBorder(Rectangle.NO_BORDER);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Paragraph("R$ " + String.format("%.2f", valor), F_NORMAL));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(c2);
    }
}