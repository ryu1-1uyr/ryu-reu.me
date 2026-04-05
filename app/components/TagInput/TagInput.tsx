"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
};

export default function TagInput({ value, onChange }: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data: { id: string; name: string }[]) =>
        setSuggestions(data.map((t) => t.name))
      )
      .catch(() => {});
  }, []);

  const addTag = useCallback(
    (name: string) => {
      const normalized = name.trim().normalize("NFKC");
      if (!normalized || value.includes(normalized)) return;
      onChange([...value, normalized]);
      setInput("");
    },
    [value, onChange]
  );

  const removeTag = useCallback(
    (name: string) => {
      onChange(value.filter((t) => t !== name));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const unusedSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <div className="space-y-2">
      {/* 選択済みタグ + 入力 */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded border-2 border-illustration-stroke/30 bg-elements-background/60 focus-within:border-elements-button/50 transition-colors">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-elements-button/20 text-elements-button"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-elements-headline transition-colors"
            >
              x
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "タグを入力..." : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-elements-headline placeholder:text-elements-paragraph/50 outline-none"
        />
      </div>

      {/* 既存タグの候補 */}
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unusedSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="px-2 py-0.5 rounded-full text-xs border border-elements-button/30 text-elements-paragraph hover:bg-elements-button/10 hover:text-elements-button transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
