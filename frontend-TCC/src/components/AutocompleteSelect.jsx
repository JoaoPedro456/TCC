import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

export function AutocompleteSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Selecione...',
  emptyMessage = 'Nenhum resultado encontrado',
  required = false,
  className = '',
  pageSize = 5,
  fetchOptions = null // Se fornecido, busca no backend
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [asyncOptions, setAsyncOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  // Fecha o painel ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca assíncrona debounced
  useEffect(() => {
    if (!fetchOptions) return;
    
    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchOptions(searchTerm);
        setAsyncOptions(results || []);
      } catch (err) {
        setAsyncOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm, fetchOptions]);

  // Reseta para a página 1 ao pesquisar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const currentOptions = fetchOptions ? asyncOptions : options;

  // Encontra a opção selecionada (pode vir tanto do options original, para initial value, quanto do fetch)
  let selectedOption = currentOptions.find(opt => String(opt.value) === String(value));
  if (!selectedOption && fetchOptions && options.length > 0) {
     selectedOption = options.find(opt => String(opt.value) === String(value));
  }

  // Filtra as opções pelo termo digitado APENAS se for sincronizado (sem fetchOptions)
  const filteredOptions = fetchOptions ? currentOptions : currentOptions.filter(opt => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.searchString && opt.searchString.toLowerCase().includes(term))
    );
  });

  // Paginação das opções filtradas
  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOptions = filteredOptions.slice(startIndex, endIndex);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    // Não limpa o searchTerm se fetchOptions estiver ativo, para poder ver o nome (embora a trigger já mostre o selecionado)
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Gatilho (Trigger) que imita o input select */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center select-none hover:border-slate-350 transition-colors"
      >
        <span className={selectedOption ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400">
          {selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-red-500 p-0.5 rounded transition-colors"
              title="Limpar seleção"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`transition-transform duration-250 ${isOpen ? 'rotate-180 text-slate-900' : ''}`} />
        </div>
      </div>

      {/* Input oculto para suportar validação nativa de required, se houver */}
      <input
        type="text"
        className="sr-only"
        value={value}
        onChange={() => {}}
        required={required}
        tabIndex={-1}
      />

      {/* Painel do Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2.5 space-y-2.5 animate-[slideIn_0.2s_ease-out]">
          {/* Barra de busca interna */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()} // impede fechar ao clicar no input
              className="w-full border border-slate-200 pl-8 pr-3 py-2 rounded-lg text-xs outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Lista de Opções */}
          <div className="space-y-1 max-h-[200px] overflow-y-auto pr-0.5">
            {isLoading ? (
              <div className="py-5 text-center text-slate-400 text-xs font-medium">
                Buscando...
              </div>
            ) : paginatedOptions.length === 0 ? (
              <div className="py-5 text-center text-slate-400 text-xs font-medium">
                {emptyMessage}
              </div>
            ) : (
              paginatedOptions.map(opt => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col items-start gap-0.5 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {opt.sublabel}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Paginação interna */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1 text-[11px] text-slate-500 font-medium select-none">
              <span>
                Pág. {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(p - 1, 1)); }}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(p + 1, totalPages)); }}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
