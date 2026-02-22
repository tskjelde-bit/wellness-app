"use client";

// ---------------------------------------------------------------------------
// CharacterSelector -- selection for the three main characters
// ---------------------------------------------------------------------------

interface CharacterSelectorProps {
    selected: "Thea" | "Mari" | "Milfen";
    onSelect: (char: "Thea" | "Mari" | "Milfen") => void;
}

const CHARACTERS = [
    {
        id: "Thea",
        name: "Thea",
        desc: "Colanach 10:00 \u2013 Cola & Kokain Rush",
        emoji: "\u{1F471}",
    },
    {
        id: "Mari",
        name: "Mari",
        desc: "Tinderdate. Ulv i F\u00E5rekl\u00E6r \u2013 Kokain-Fueled Predator",
        emoji: "\u{1F43A}",
    },
    {
        id: "Milfen",
        name: "Milfen",
        desc: "Ekstremt Grov. Kukvandt \u2013 Kokain Queen",
        emoji: "\u{1F382}",
    },
] as const;

export function CharacterSelector({ selected, onSelect }: CharacterSelectorProps) {
    return (
        <div className="flex flex-col gap-3 w-full max-w-sm">
            {CHARACTERS.map((char) => (
                <button
                    key={char.id}
                    onClick={() => onSelect(char.id)}
                    className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${selected === char.id
                        ? "bg-gradient-to-b from-gray-800 to-gray-950 shadow-xl ring-2 ring-black"
                        : "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">{char.emoji}</span>
                        <div>
                            <h3 className={`font-black tracking-tight ${selected === char.id ? "text-white" : "text-gray-950"}`}>
                                {char.name}
                            </h3>
                            <p className={`text-xs font-bold uppercase tracking-wider ${selected === char.id ? "text-gray-300" : "text-gray-400"}`}>
                                {char.desc}
                            </p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
