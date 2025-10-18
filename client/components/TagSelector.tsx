import { useState, Fragment } from "react";
import { Combobox, Transition } from "@headlessui/react";

interface Tag {
  id: string | number;
  name: string;
}

interface TagSelectorProps {
  tags?: Tag[];               // all available tags
  selected?: Tag[];           // currently selected tags
  onChange: (tags: Tag[]) => void;
}

export const TagSelector = ({ tags = [], selected = [], onChange }: TagSelectorProps) => {
  const [query, setQuery] = useState("");

  const filteredTags =
    query === ""
      ? tags
      : tags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (tag: Tag) => {
    if (!selected.find((t) => t.id === tag.id)) {
      onChange([...selected, tag]);
    }
    setQuery("");
  };

  const handleCreate = () => {
    if (!query.trim()) return;
    const newTag: Tag = { id: `new-${Date.now()}`, name: query.trim() };
    onChange([...selected, newTag]);
    setQuery("");
  };

  const removeTag = (id: string | number) => {
    onChange(selected.filter((t) => t.id !== id));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((t) => (
          <span
            key={t.id}
            className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1 text-sm"
          >
            {t.name}
            <button type="button" onClick={() => removeTag(t.id)} className="ml-1">&times;</button>
          </span>
        ))}
      </div>

      <Combobox value="" onChange={(val: Tag) => handleSelect(val)}>
        <div className="relative">
          <Combobox.Input
            className="w-full border rounded px-2 py-1"
            placeholder="Select or create tag..."
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            value={query}
          />
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options className="absolute mt-1 w-full bg-white border rounded max-h-60 overflow-auto z-50">
              {filteredTags.length === 0 && query !== "" ? (
                <div className="px-2 py-1 text-sm text-gray-500">Press Enter to create "{query}"</div>
              ) : (
                filteredTags.map((tag) => (
                  <Combobox.Option
                    key={tag.id}
                    value={tag}
                    className={({ active }) =>
                      `cursor-pointer px-2 py-1 ${active ? "bg-blue-100" : ""}`
                    }
                  >
                    {tag.name}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};
