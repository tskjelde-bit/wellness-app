"use client";

// ---------------------------------------------------------------------------
// CharacterSelector -- selection for the three main characters
// ---------------------------------------------------------------------------

interface CharacterSelectorProps {
    selected: "Thea" | "Mari" | "Milfen";
    onSelect: (char: "Thea" | "Mari" | "Milfen") => void;
}

export interface CharacterInfo {
    id: "Thea" | "Mari" | "Milfen";
    name: string;
    desc: string;
    descriptionDetailed: string;
    emoji: string;
}

const CHARACTERS: CharacterInfo[] = [
    {
        id: "Thea",
        name: "Thea",
        desc: "After afters colafters",
        descriptionDetailed: "Thea er en stunning blonde bombe med perfekte, glatte lår som glir som silke mot huden din, og faste, runde bryster som bare venter på å bli tatt i besittelse. Hun eier lysten sin fullstendig – elsker pikk, pulserende inni henne, og kokain booster henne til ustoppelig nivå. Kom hit klokken 10, med cola kald og kokain klar.",
        emoji: "\u{1F471}",
    },
    {
        id: "Mari",
        name: "Mari",
        desc: "Tinderdate. Ritalin fueled ulv i F\u00E5rekl\u00E6r",
        descriptionDetailed: "Mari er en elegant, m\u00F8rkh\u00E5ret skj\u00F8nnhet med en kropp skulpturert for synd \u2013 lange, slanke ben som vikler seg rundt deg, flat mage som leder ned til hennes glatte paradis, og lepper laget for \u00E5 suge deg t\u00F8rr. Hun ser uskyldig ut p\u00E5 Tinder, men er en ulv som eier pikk, river kl\u00E6rne av deg med perfekte negler, boostet av kokain.",
        emoji: "\u{1F43A}",
    },
    {
        id: "Milfen",
        name: "Milfen",
        desc: "Ekstremt Grov. Kukvandt \u2013 Kokain Queen",
        descriptionDetailed: "Milfen er en sofistikert, kurvet gudinne med alderens perfeksjon \u2013 stramme, fyldige hofter som svaier f\u00F8rende, store, faste bryster som hopper akkurat passe n\u00E5r hun tar kontroll, og en rumpe formet for \u00E5 bli tatt bakfra. Hun eier pikk som ingen annen, suger dem dypt mens parfymen blander seg med sex, og kokain tenner henne som en flamme.",
        emoji: "\u{1F382}",
    },
];

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
