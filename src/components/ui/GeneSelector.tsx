import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Plus, Copy } from 'lucide-react';

interface GeneSelectorProps {
  allGenes: string[];
  selectedGenes: string[];
  onChange: (genes: string[]) => void;
  placeholder?: string;
  singleSelect?: boolean;
}

export function GeneSelector({ allGenes, selectedGenes, onChange, placeholder = "Search for a gene...", singleSelect = false }: GeneSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    const lowerInput = inputValue.toLowerCase();
    // Return top 20 matches
    return allGenes
      .filter(gene => gene.toLowerCase().includes(lowerInput) && !selectedGenes.includes(gene))
      .slice(0, 20);
  }, [inputValue, allGenes, selectedGenes]);

  const addGene = (gene: string) => {
    if (singleSelect) {
        onChange([gene]);
    } else {
        if (!selectedGenes.includes(gene)) {
          onChange([...selectedGenes, gene]);
        }
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeGene = (geneToRemove: string) => {
    onChange(selectedGenes.filter(g => g !== geneToRemove));
  };

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    
    // Split by comma, newline, tab, space
    const potentials = bulkInput.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    
    // Validate against allGenes to avoid 404s/bad requests
    // Using a Set for O(1) lookup of allGenes would be faster if allGenes is large, 
    // strictly speaking we should probably memoize a Set of allGenes in the parent or here.
    // Given React render cycles, creating a set here is okay if not too frequent.
    const validGenesSet = new Set(allGenes);
    
    const newGenes: string[] = [];
    const invalidGenes: string[] = [];

    potentials.forEach(p => {
       // Check exact match first
       if (validGenesSet.has(p)) {
           if (!selectedGenes.includes(p)) newGenes.push(p);
       } else {
           // Maybe check case-insensitive?
           // For now assume case matters as gene names usually do (though human/mouse differ).
           // If the user types "cd3d" but the gene is "CD3D", we might want to handle that.
           // Let's try to find a case-insensitive match if exact fails.
           const match = allGenes.find(g => g.toLowerCase() === p.toLowerCase());
           if (match) {
               if (!selectedGenes.includes(match)) newGenes.push(match);
           } else {
               invalidGenes.push(p);
           }
       }
    });

    if (newGenes.length > 0) {
      onChange([...selectedGenes, ...newGenes]);
      setBulkInput('');
      setShowBulkInput(false);
    }
    
    if (invalidGenes.length > 0) {
        alert(`Could not find ${invalidGenes.length} genes: ${invalidGenes.join(', ')}`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Genes Chips */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedGenes.map(gene => (
          <span key={gene} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {gene}
            <button
              type="button"
              onClick={() => removeGene(gene)}
              className="ml-1.5 inline-flex items-center justify-center text-blue-400 hover:text-blue-600 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selectedGenes.length === 0 && (
          <span className="text-sm text-gray-500 italic">No genes selected</span>
        )}
      </div>

      {/* Input / Controls */}
      <div className="relative">
        <div className="flex gap-2">
            <div className="relative flex-grow" ref={suggestionsRef}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && inputValue.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {allGenes.length === 0 ? (
                            <div className="p-3 text-sm text-gray-400 italic text-center">
                                Loading gene index...
                            </div>
                        ) : suggestions.length > 0 ? (
                            suggestions.map(gene => (
                                <div
                                    key={gene}
                                    onClick={() => addGene(gene)}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                    {gene}
                                </div>
                            ))
                        ) : (
                             <div className="p-2 text-sm text-gray-500 text-center">
                                 No matches found
                             </div>
                        )}
                    </div>
                )}
            </div>
            
            {!singleSelect && (
            <button
                onClick={() => setShowBulkInput(!showBulkInput)}
                className={`p-2 border rounded-md transition-colors ${showBulkInput ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                title="Paste multiple genes"
            >
                <Copy className="w-4 h-4" />
            </button>
            )}
        </div>

        {/* Bulk Input Area */}
        {showBulkInput && (
            <div className="mt-2 p-3 bg-gray-50 border rounded-md transition-all">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Paste list of genes (comma, space, or newline separated)
                </label>
                <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm font-mono h-24 mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="GENE1, GENE2&#10;GENE3"
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setShowBulkInput(false)}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBulkAdd}
                        className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Genes
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
