import {Parameters} from '../interfaces/Parameters';
import {regions} from '../constants/regions';

const countries: string[] = [
    'slovensko',
    'nemecko',
    'polsko',
    'rakousko',
    'velka-britanie-a-severni-irsko',
    'irsko',
];

const radiuses: number[] = [10, 20, 30, 40, 50,];
const dates: string[] = ['24h', '3d', '7d',];
const education: string[] = ['primary', 'high', 'uni'];
const arrangements: string[] = ['partial-work-from-home', 'work-mostly-from-home', 'flexible-hours',];
const employers: string[] = ['direct', 'agency', 'ngo'];
const suitableFor: string[] = ['graduates', 'retired', 'maternity', 'ukraine_refugees'];

function parseArgs(): Parameters {
    const args: string[] = process.argv.slice(2);
    const params: Parameters = {};

    for (let i: number = 0; i < args.length; i++) {
        const value: string = args[++i];
        switch (args[i - 1]) {
            case '--tags':
                params.tags = value.split(',');
                break;
            case '--locality':
                if (regions.includes(value) || countries.includes(value)) {
                    params.locality = value as Parameters['locality'];
                }
                break;
            case '--radius':
                if (radiuses.includes(Number(value))) {
                    params.radius = Number(value) as Parameters['radius'];
                }
                break;
            case '--date':
                if (dates.includes(value)) {
                    params.date = value as Parameters['date'];
                }
                break;
            case '--salary':
                params.salary = Number(value);
                break;
            case '--employmentContract':
                params.employmentContract = value.split(',');
                break;
            case '--education':
                if (education.includes(value)) {
                    params.education = value as Parameters['education'];
                }
                break;
            case '--languageSkill':
                params.languageSkill = value.split(',');
                break;
            case '--arrangement':
                if (arrangements.includes(value)) {
                    params.arrangement = value as Parameters['arrangement'];
                }
                break;
            case '--employer':
                if (employers.includes(value)) {
                    params.employer = value as Parameters['employer'];
                }
                break;
            case '--suitableFor':
                if (suitableFor.includes(value)) {
                    params.suitableFor = value as Parameters['suitableFor'];
                }
                break;
            case '--disabled':
                params.disabled = value === 'true';
                break;
            default:
                console.log(`Unknown argument: ${args[i - 1]}`);
                break;
        }
    }
    return params;
}

export {parseArgs}