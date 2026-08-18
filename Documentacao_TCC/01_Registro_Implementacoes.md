# Registro de Implementações - TCC

Este documento serve como um log centralizado de todas as implementações, regras de negócio e alterações feitas no sistema, para facilitar a escrita da documentação do seu TCC.

---

## 1. Módulo de Orçamentos e Ordens de Serviço (OS)

### 1.1 Conversão Automática (Virar OS)
- **Funcionalidade:** O sistema permite a conversão direta de um Orçamento para uma Ordem de Serviço.
- **Regra de Negócio:** Ao alterar o status de um orçamento para `APROVADO`, a OS é gerada automaticamente.
- **Comportamento:** O backend cria uma cópia exata dos dados do cliente, veículo, observações, valores (quilometragem e custo por km), além de espelhar todos os **serviços** e **materiais** listados no orçamento para a nova OS, evitando retrabalho (re-digitação).

### 1.2 Layout e Interface (Frontend)
- O campo "Veículo/Máquina" (Nome do Orçamento) atua como o título principal com destaque no layout (card do orçamento).
- O "Nome do Cliente" atua como um subtítulo secundário. 
- **Flexibilidade:** É permitido criar orçamentos sem vincular um cliente obrigatoriamente. Quando não há cliente, a interface exibe de forma amigável: *"Cliente sem cadastro"*.

---

## 2. Catálogo de Materiais

### 2.1 Gestão de Estoque/Catálogo
- **Funcionalidade:** Criação de uma página dedicada (`/materiais`) para realizar o CRUD (Criar, Ler, Atualizar e Excluir) de materiais usados na oficina.
- **Unidades de Medida Suportadas:** `unidade`, `kg`, `metro`, `barra`, `litros`.

### 2.2 Integração de Materiais na Emissão (OS e Orçamento)
- **Modal de Emissão:** Tanto a emissão de Orçamentos quanto a de OS possuem uma seção dedicada para **Materiais Aplicados**.
- **Tipos de Inserção:**
  1. **Do Catálogo:** O usuário pesquisa materiais previamente cadastrados (com auto-complete) e insere.
  2. **Material Avulso/Customizado:** O usuário pode inserir um material "on-the-fly" digitando nome, quantidade e preço na hora.
- **Comportamento de Interface:** A listagem de materiais permite editar a quantidade e o preço unitário dinamicamente, calculando o Subtotal instantaneamente.

---

## 3. Lógica Financeira e Regras de Negócio

### 3.1 Cálculo do Total a Pagar
- A fórmula de totalização da OS/Orçamento no Frontend e Backend respeita o cálculo:
  `Valor Total = (Total dos Serviços) + (Total dos Materiais) + (Quilometragem × Preço por KM) - Desconto (se houver)`

### 3.2 Regra de Comissão do Mecânico
- **Restrição de Base de Cálculo:** A comissão dos mecânicos é aplicada **estritamente** sobre o valor da Mão de Obra (Serviços).
- **Exclusões:** O cálculo do sistema deduz o *Custo de Deslocamento (KM)* e o *Valor Total dos Materiais* (incluindo peças e insumos vendidos por Kg, como ferro) da base de comissionamento.
- **Fórmula de Base de Comissão:** `Base Comissão = Valor Total Geral - Custo Deslocamento (KM) - Total de Materiais`

---

## 4. Geração de Relatórios e PDFs

### 4.1 Impressão Profissional (ImpressaoService)
- O sistema possui geração de relatórios PDF tanto para **Ordem de Serviço** quanto para **Orçamentos**.
- **Inclusão de Materiais:** O layout do documento foi ajustado para gerar tabelas separadas e claras para "Serviços Realizados" e "Materiais Aplicados", somando os subtotais separadamente antes de apresentar o Total Geral.
- O documento exibe informações cruciais como o termo de validade no caso de Orçamentos.

---

*Nota: Todas as implementações futuras e decisões de arquitetura serão documentadas na continuação deste arquivo para facilitar a criação da monografia e da defesa do TCC.*
