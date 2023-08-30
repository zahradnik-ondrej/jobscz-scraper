interface Parameters {
    tags?: string[];
    locality?:
        'praha' |
        'jihocesky-kraj' |
        'jihomoravsky-kraj' |
        'karlovarsky-kraj' |
        'kralovohradecky-kraj' |
        'liberecky-kraj' |
        'moravskoslezsky-kraj' |
        'olomoucky-kraj' |
        'pardubicky-kraj' |
        'plzensky-kraj' |
        'stredocesky-kraj' |
        'ustecky-kraj' |
        'vysocina-kraj' |
        'zlinsky-kraj' |
        'slovensko' |
        'nemecko' |
        'polsko' |
        'rakousko' |
        'velka-britanie-a-severni-irsko' |
        'irsko',
    radius?: 10 | 20 | 30 | 40 | 50,
    date?: '24h' | '3d' | '7d',
    salary?: number,
    employmentContract?: string[],
    education?: 'primary' | 'high' | 'uni',
    languageSkill?: string[],
    arrangement?: 'partial-work-from-home' | 'work-mostly-from-home' | 'flexible-hours',
    employer?: 'direct' | 'agency' | 'ngo',
    suitableFor?: 'graduates' | 'retired' | 'maternity' | 'ukraine_refugees',
    disabled?: boolean,
}

export {Parameters}