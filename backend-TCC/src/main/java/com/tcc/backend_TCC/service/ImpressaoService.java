package com.tcc.backend_TCC.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.model.OrdemServicoItem;
import com.tcc.backend_TCC.model.OrdemServicoMecanico;
import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.lowagie.text.pdf.PdfGState;
import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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

    @Transactional(readOnly = true)
    public byte[] gerarPdfOs(Long osId) throws Exception {
        OrdemServico os = osRepository.findById(osId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("OS não encontrada"));

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, baos);

        document.open();

        // ════════════════════════════════════════════════════════
        // CABEÇALHO COM LOGOTIPO
        // ════════════════════════════════════════════════════════
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{65, 35});

        PdfPCell leftHeader = new PdfPCell();
        leftHeader.setBorder(Rectangle.BOTTOM);
        leftHeader.setBorderColor(CINZA_ESCURO);
        leftHeader.setPaddingBottom(10f);

        // Tentar carregar logotipo do classpath
        java.net.URL logoUrl = getClass().getResource("/static/logo-bazani.png");
        com.lowagie.text.Image logoImg = null;
        if (logoUrl != null) {
            try {
                logoImg = com.lowagie.text.Image.getInstance(logoUrl);
                logoImg.scaleToFit(75f, 75f);
            } catch (Exception e) {
                System.err.println("Erro ao carregar logotipo para o PDF: " + e.getMessage());
            }
        }

        if (logoImg != null) {
            PdfPTable logoTextTable = new PdfPTable(2);
            logoTextTable.setWidthPercentage(100);
            logoTextTable.setWidths(new float[]{20, 80});

            PdfPCell cLogo = new PdfPCell(logoImg);
            cLogo.setBorder(Rectangle.NO_BORDER);
            cLogo.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cLogo.setPadding(0f);
            logoTextTable.addCell(cLogo);

            PdfPCell cText = new PdfPCell();
            cText.setBorder(Rectangle.NO_BORDER);
            cText.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cText.setPadding(0f);
            cText.setPaddingLeft(10f);
            cText.addElement(new Paragraph("BAZANI MECÂNICA", F_TITULO));
            cText.addElement(new Paragraph("Sistema de Gestão de Ordens de Serviço", F_SUBTITULO));
            logoTextTable.addCell(cText);

            leftHeader.addElement(logoTextTable);
        } else {
            leftHeader.addElement(new Paragraph("BAZANI MECÂNICA", F_TITULO));
            leftHeader.addElement(new Paragraph("Sistema de Gestão de Ordens de Serviço", F_SUBTITULO));
        }

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

        String dataFormatada = os.getDataRegisto() != null ? os.getDataRegisto().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A";
        Paragraph dataTxt = new Paragraph("Data: " + dataFormatada, F_NORMAL);
        dataTxt.setAlignment(Element.ALIGN_RIGHT);
        rightHeader.addElement(dataTxt);

        headerTable.addCell(leftHeader);
        headerTable.addCell(rightHeader);
        document.add(headerTable);
        document.add(spacer(15f));

        // ════════════════════════════════════════════════════════
        // DADOS DO CLIENTE
        // ════════════════════════════════════════════════════════
        document.add(buildSectionHeader("Dados do Cliente"));

        PdfPTable tCliente = new PdfPTable(4);
        tCliente.setWidthPercentage(100);
        tCliente.setWidths(new float[]{15, 35, 15, 35});

        addInfoRow(tCliente, "Cliente:", safe(os.getCliente() != null ? os.getCliente().getNome() : null),
                "CPF:",     safe(os.getCliente() != null ? os.getCliente().getCpf() : null));
        addInfoRow(tCliente, "Telefone:", safe(os.getCliente() != null ? os.getCliente().getTelefone() : null),
                "Endereço:", safe(os.getCliente() != null ? os.getCliente().getLogradouro() : null));

        document.add(tCliente);
        document.add(spacer(15f));

        // ════════════════════════════════════════════════════════
        // INFORMAÇÕES DO SERVIÇO E VEÍCULO
        // ════════════════════════════════════════════════════════
        document.add(buildSectionHeader("Informações do Serviço"));

        PdfPTable tDesc = new PdfPTable(1);
        tDesc.setWidthPercentage(100);

        PdfPCell descCell = new PdfPCell();
        descCell.setPadding(10f);
        descCell.setBorderColor(CINZA_CLARO);
        descCell.setBorderWidth(1f);
        descCell.setMinimumHeight(60f);

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
        document.add(spacer(15f));

        // ════════════════════════════════════════════════════════
        // MATEMÁTICA E DETALHAMENTO DE VALORES (SERVIÇOS + KM)
        // ════════════════════════════════════════════════════════
        BigDecimal totalGeral = os.getValorTotal() != null ? os.getValorTotal() : BigDecimal.ZERO;
        BigDecimal qtdKm = os.getQuilometragem() != null ? BigDecimal.valueOf(os.getQuilometragem()) : BigDecimal.ZERO;
        BigDecimal precoKm = os.getValorKm() != null ? os.getValorKm() : BigDecimal.ZERO;
        BigDecimal custoKm = qtdKm.multiply(precoKm).setScale(2, RoundingMode.HALF_UP);

        BigDecimal valorServicos = totalGeral.subtract(custoKm);
        if (valorServicos.compareTo(BigDecimal.ZERO) < 0) {
            valorServicos = BigDecimal.ZERO;
        }

        boolean temServicos = os.getItensServico() != null && !os.getItensServico().isEmpty();
        boolean temCustoKm = custoKm.compareTo(BigDecimal.ZERO) > 0;

        if (temServicos || temCustoKm) {
            document.add(buildSectionHeader("Detalhamento de Valores"));

            PdfPTable tSvc = new PdfPTable(2);
            tSvc.setWidthPercentage(100);
            tSvc.setWidths(new float[]{80, 20});

            tSvc.addCell(buildTableHeader("Descrição"));
            tSvc.addCell(buildTableHeader("Valor (R$)"));

            // 1. Adiciona os Serviços do Catálogo
            if (temServicos) {
                for (var item : os.getItensServico()) {
                    tSvc.addCell(styledCell(safe(item.getItemServico() != null ? item.getItemServico().getNomeServico() : "Serviço"), Element.ALIGN_LEFT));
                    tSvc.addCell(styledCell("R$ " + String.format("%.2f", item.getPrecoCobrado() != null ? item.getPrecoCobrado() : BigDecimal.ZERO).replace(".", ","), Element.ALIGN_RIGHT));
                }
            }

            // 2. Adiciona o Custo da Deslocação (KM) como um item faturado
            if (temCustoKm) {
                String lblCustoKm = "Deslocação (" + String.format("%.1f", os.getQuilometragem()).replace(".", ",") + " km)";
                tSvc.addCell(styledCell(lblCustoKm, Element.ALIGN_LEFT));
                tSvc.addCell(styledCell("R$ " + String.format("%.2f", custoKm).replace(".", ","), Element.ALIGN_RIGHT));
            }

            document.add(tSvc);
            document.add(spacer(15f));
        }

        // ════════════════════════════════════════════════════════
        // MECÂNICOS
        // ════════════════════════════════════════════════════════
        if (os.getMecanicos() != null && !os.getMecanicos().isEmpty()) {
            document.add(buildSectionHeader("Mecânicos Envolvidos"));

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
            document.add(spacer(15f));
        }

        // ════════════════════════════════════════════════════════
        // VALOR TOTAL E ASSINATURA (LIMPO E SEM CAIXAS ESCURAS)
        // ════════════════════════════════════════════════════════
        PdfPTable tBottom = new PdfPTable(2);
        tBottom.setWidthPercentage(100);
        tBottom.setWidths(new float[]{45, 55});
        tBottom.setSpacingBefore(15f);

        // Subtabela de resumo financeiro (lado esquerdo) - Limpo parecido com comissão
        PdfPCell summaryCell = new PdfPCell();
        summaryCell.setBorder(Rectangle.NO_BORDER);
        summaryCell.setPadding(0f);

        PdfPTable resumo = new PdfPTable(2);
        resumo.setWidthPercentage(100);
        resumo.setWidths(new float[]{60, 40});

        addResumoLinhaOS(resumo, "Total dos Serviços:", valorServicos);
        if (temCustoKm) {
            addResumoLinhaOS(resumo, "Deslocação (" + String.format("%.1f", os.getQuilometragem()).replace(".", ",") + " km):", custoKm);
        }

        PdfPCell lblTotal = new PdfPCell(new Paragraph("TOTAL A PAGAR:", new Font(Font.HELVETICA, 10, Font.BOLD, PRETO)));
        lblTotal.setBorder(Rectangle.TOP);
        lblTotal.setBorderColor(PRETO);
        lblTotal.setBorderWidth(1.0f);
        lblTotal.setPadding(6f);
        lblTotal.setPaddingLeft(0f);
        resumo.addCell(lblTotal);

        PdfPCell valTotal = new PdfPCell(new Paragraph("R$ " + String.format("%.2f", totalGeral).replace(".", ","), new Font(Font.HELVETICA, 11, Font.BOLD, PRETO)));
        valTotal.setBorder(Rectangle.TOP);
        valTotal.setBorderColor(PRETO);
        valTotal.setBorderWidth(1.0f);
        valTotal.setPadding(6f);
        valTotal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        resumo.addCell(valTotal);

        summaryCell.addElement(resumo);

        // Caixa de Assinatura (lado direito)
        PdfPCell sigCell = new PdfPCell();
        sigCell.setBorder(Rectangle.NO_BORDER);
        sigCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        sigCell.setPadding(0f);
        sigCell.setPaddingTop(30f);

        Paragraph linhaAssinatura = new Paragraph("____________________________________________________", F_NORMAL);
        linhaAssinatura.setAlignment(Element.ALIGN_CENTER);
        sigCell.addElement(linhaAssinatura);

        Paragraph lblAssinatura = new Paragraph("Assinatura do Cliente", F_LABEL);
        lblAssinatura.setAlignment(Element.ALIGN_CENTER);
        lblAssinatura.setSpacingBefore(5f);
        sigCell.addElement(lblAssinatura);

        tBottom.addCell(summaryCell);
        tBottom.addCell(sigCell);
        document.add(tBottom);

        // ════════════════════════════════════════════════════════
        // RODAPÉ (Modificado para letra menor e transparente)
        // ════════════════════════════════════════════════════════
        document.add(spacer(50f));
        Font fonteRodapePequena = new Font(F_SUBTITULO.getBaseFont(), 8f, F_SUBTITULO.getStyle(), F_SUBTITULO.getColor());
        Paragraph rodape = new Paragraph("Documento gerado pelo Sistema Bazani Mecânica e Autopeças", fonteRodapePequena);
        rodape.setAlignment(Element.ALIGN_CENTER);
        try {
            PdfGState estadoGraficoTransparente = new PdfGState();
            estadoGraficoTransparente.setFillOpacity(0.5f);

            PdfContentByte cb = writer.getDirectContent();
            cb.saveState();
            cb.setGState(estadoGraficoTransparente);

            document.add(rodape);
            cb.restoreState();

        } catch (Exception e) {
            document.add(rodape);
            e.printStackTrace();
        }

        document.close();
        return baos.toByteArray();
    }

    private PdfPTable buildSectionHeader(String titulo) {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Paragraph(titulo.toUpperCase(), new Font(Font.HELVETICA, 10, Font.BOLD, PRETO)));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(PRETO);
        cell.setBorderWidth(1.0f);
        cell.setPadding(4f);
        cell.setPaddingLeft(0f);
        cell.setPaddingBottom(6f);
        t.addCell(cell);
        return t;
    }

    private PdfPCell buildTableHeader(String texto) {
        PdfPCell cell = new PdfPCell(new Paragraph(texto, F_LABEL));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(PRETO);
        cell.setBorderWidth(1.0f);
        cell.setPadding(6f);
        cell.setPaddingLeft(0f);
        return cell;
    }

    private void addResumoLinhaOS(PdfPTable table, String label, BigDecimal valor) {
        PdfPCell c1 = new PdfPCell(new Paragraph(label, F_LABEL));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPadding(6f);
        c1.setPaddingLeft(0f);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Paragraph("R$ " + String.format("%.2f", valor).replace(".", ","), F_NORMAL));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setPadding(6f);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(c2);
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

    @Transactional(readOnly = true)
    public byte[] gerarPdfComissao(Long funcId, LocalDate inicio, LocalDate fim) throws Exception {
        Pessoa func = pessoaRepository.findById(funcId).orElseThrow();
        // Busca as OSs onde ele trabalhou e que estão CONCLUÍDAS
        List<OrdemServicoMecanico> participacoes = mecanicoRepository.buscarComissoesMes(funcId, inicio, fim);

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, baos);
        document.open();

        // ════════════════════════════════════════════════════════
        // CABEÇALHO COM LOGOTIPO
        // ════════════════════════════════════════════════════════
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{65, 35});

        PdfPCell leftHeader = new PdfPCell();
        leftHeader.setBorder(Rectangle.BOTTOM);
        leftHeader.setBorderColor(CINZA_ESCURO);
        leftHeader.setPaddingBottom(10f);

        // Tentar carregar logotipo do classpath
        java.net.URL logoUrl = getClass().getResource("/static/logo-bazani.png");
        com.lowagie.text.Image logoImg = null;
        if (logoUrl != null) {
            try {
                logoImg = com.lowagie.text.Image.getInstance(logoUrl);
                logoImg.scaleToFit(75f, 75f);
            } catch (Exception e) {
                System.err.println("Erro ao carregar logotipo para o PDF: " + e.getMessage());
            }
        }

        if (logoImg != null) {
            PdfPTable logoTextTable = new PdfPTable(2);
            logoTextTable.setWidthPercentage(100);
            logoTextTable.setWidths(new float[]{20, 80});

            PdfPCell cLogo = new PdfPCell(logoImg);
            cLogo.setBorder(Rectangle.NO_BORDER);
            cLogo.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cLogo.setPadding(0f);
            logoTextTable.addCell(cLogo);

            PdfPCell cText = new PdfPCell();
            cText.setBorder(Rectangle.NO_BORDER);
            cText.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cText.setPadding(0f);
            cText.setPaddingLeft(10f);
            cText.addElement(new Paragraph("BAZANI MECÂNICA", F_TITULO));
            cText.addElement(new Paragraph("Sistema de Gestão de Ordens de Serviço", F_SUBTITULO));
            logoTextTable.addCell(cText);

            leftHeader.addElement(logoTextTable);
        } else {
            leftHeader.addElement(new Paragraph("BAZANI MECÂNICA", F_TITULO));
            leftHeader.addElement(new Paragraph("Sistema de Gestão de Ordens de Serviço", F_SUBTITULO));
        }

        PdfPCell rightHeader = new PdfPCell();
        rightHeader.setBorder(Rectangle.BOTTOM);
        rightHeader.setBorderColor(CINZA_ESCURO);
        rightHeader.setPaddingBottom(10f);

        Paragraph relTitulo = new Paragraph("RELATÓRIO DE COMISSÕES", F_TITULO);
        relTitulo.setAlignment(Element.ALIGN_RIGHT);
        rightHeader.addElement(relTitulo);

        Paragraph funcNome = new Paragraph("Funcionário: " + func.getNome() + " (" + safe(func.getCargo()) + ")", F_LABEL);
        funcNome.setAlignment(Element.ALIGN_RIGHT);
        rightHeader.addElement(funcNome);

        String periodoText = String.format("%02d/%d", inicio.getMonthValue(), inicio.getYear());
        Paragraph periodoTxt = new Paragraph("Período: " + periodoText, F_NORMAL);
        periodoTxt.setAlignment(Element.ALIGN_RIGHT);
        rightHeader.addElement(periodoTxt);

        headerTable.addCell(leftHeader);
        headerTable.addCell(rightHeader);
        document.add(headerTable);
        document.add(spacer(15f));

        // ════════════════════════════════════════════════════════
        // DADOS DAS COMISSÕES
        // ════════════════════════════════════════════════════════
        document.add(buildSectionHeader("Comissões do Período"));

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
            BigDecimal valorComissaoOs = p.getValorAtribuido() != null ? p.getValorAtribuido() : BigDecimal.ZERO;

            String dataOS = p.getOrdemServico().getDataRegisto() != null ? p.getOrdemServico().getDataRegisto().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A";

            table.addCell(styledCell(dataOS, Element.ALIGN_LEFT));
            table.addCell(styledCell(p.getOrdemServico().getId().toString(), Element.ALIGN_CENTER));
            table.addCell(styledCell(p.getOrdemServico().getCliente().getNome(), Element.ALIGN_LEFT));
            table.addCell(styledCell("R$ " + String.format("%.2f", valorComissaoOs).replace(".", ","), Element.ALIGN_RIGHT));

            totalComissao = totalComissao.add(valorComissaoOs);
        }
        document.add(table);
        document.add(spacer(15f));

        // ════════════════════════════════════════════════════════
        // FECHAMENTO FINANCEIRO E ASSINATURA (LIMPO)
        // ════════════════════════════════════════════════════════
        PdfPTable tBottom = new PdfPTable(2);
        tBottom.setWidthPercentage(100);
        tBottom.setWidths(new float[]{45, 55});
        tBottom.setSpacingBefore(15f);

        // Subtabela de resumo financeiro (lado esquerdo) - idêntico ao estilo da OS
        PdfPCell summaryCell = new PdfPCell();
        summaryCell.setBorder(Rectangle.NO_BORDER);
        summaryCell.setPadding(0f);

        PdfPTable resumo = new PdfPTable(2);
        resumo.setWidthPercentage(100);
        resumo.setWidths(new float[]{60, 40});

        BigDecimal salarioBase = BigDecimal.valueOf(func.getSalarioBase() != null ? func.getSalarioBase() : 0);
        BigDecimal totalReceber = salarioBase.add(totalComissao);

        addResumoLinhaOS(resumo, "Salário Base:", salarioBase);
        addResumoLinhaOS(resumo, "Total Comissões:", totalComissao);

        PdfPCell lblTotal = new PdfPCell(new Paragraph("TOTAL A RECEBER:", new Font(Font.HELVETICA, 10, Font.BOLD, PRETO)));
        lblTotal.setBorder(Rectangle.TOP);
        lblTotal.setBorderColor(PRETO);
        lblTotal.setBorderWidth(1.0f);
        lblTotal.setPadding(6f);
        lblTotal.setPaddingLeft(0f);
        resumo.addCell(lblTotal);

        PdfPCell valTotal = new PdfPCell(new Paragraph("R$ " + String.format("%.2f", totalReceber).replace(".", ","), new Font(Font.HELVETICA, 11, Font.BOLD, PRETO)));
        valTotal.setBorder(Rectangle.TOP);
        valTotal.setBorderColor(PRETO);
        valTotal.setBorderWidth(1.0f);
        valTotal.setPadding(6f);
        valTotal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        resumo.addCell(valTotal);

        summaryCell.addElement(resumo);

        // Caixa de Assinatura (lado direito)
        PdfPCell sigCell = new PdfPCell();
        sigCell.setBorder(Rectangle.NO_BORDER);
        sigCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        sigCell.setPadding(0f);
        sigCell.setPaddingTop(30f);

        Paragraph linhaAssinatura = new Paragraph("____________________________________________________", F_NORMAL);
        linhaAssinatura.setAlignment(Element.ALIGN_CENTER);
        sigCell.addElement(linhaAssinatura);

        Paragraph lblAssinatura = new Paragraph("Assinatura do Funcionário", F_LABEL);
        lblAssinatura.setAlignment(Element.ALIGN_CENTER);
        lblAssinatura.setSpacingBefore(5f);
        sigCell.addElement(lblAssinatura);

        tBottom.addCell(summaryCell);
        tBottom.addCell(sigCell);
        document.add(tBottom);

        // ════════════════════════════════════════════════════════
        // RODAPÉ (Modificado para letra menor e transparente)
        // ════════════════════════════════════════════════════════
        document.add(spacer(50f));
        Font fonteRodapePequena = new Font(F_SUBTITULO.getBaseFont(), 8f, F_SUBTITULO.getStyle(), F_SUBTITULO.getColor());
        Paragraph rodape = new Paragraph("Documento gerado pelo Sistema Bazani Mecânica e Autopeças", fonteRodapePequena);
        rodape.setAlignment(Element.ALIGN_CENTER);
        try {
            PdfGState estadoGraficoTransparente = new PdfGState();
            estadoGraficoTransparente.setFillOpacity(0.5f);

            PdfContentByte cb = writer.getDirectContent();
            cb.saveState();
            cb.setGState(estadoGraficoTransparente);

            document.add(rodape);
            cb.restoreState();

        } catch (Exception e) {
            document.add(rodape);
            e.printStackTrace();
        }

        document.close();
        return baos.toByteArray();
    }
}