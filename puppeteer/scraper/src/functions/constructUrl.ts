import chalk from 'chalk';

import {DEBUG} from '../constants/DEBUG';
import {Parameters} from '../interfaces/Parameters';
import {regions} from '../constants/regions';

function constructUrl(parameters: Parameters): string {
    let url: string = 'https://www.jobs.cz/prace/';

    if (parameters.locality) {
        if (regions.includes(parameters.locality)) {
            url = `${url}${parameters.locality}/?`;
        }
    } else {
        url = `${url}?`
    }

    if (parameters.tags) {
        for (let t: number = 0; t < parameters.tags.length; t++) {
            url = `${url}q[]=${parameters.tags[t]}&`;
        }
    }

    if (parameters.locality) {
        switch (parameters.locality) {
            case 'slovensko':
                url = `${url}locality[code]=C217&locality[label]=Slovensko&`;
                break;
            case 'nemecko':
                url = `${url}locality[code]=C91&locality[label]=Německo&`;
                break;
            case 'polsko':
                url = `${url}locality[code]=C196&locality[label]=Polsko&`;
                break;
            case 'rakousko':
                url = `${url}locality[code]=C15&locality[label]=Rakousko&`;
                break;
            case 'velka-britanie-a-severni-irsko':
                url = `${url}locality[code]=C250&locality[label]=Velká Británie a Severní Irsko&`;
                break;
            case 'irsko':
                url = `${url}locality[code]=C117&locality[label]=Irsko&`;
                break;
        }
    }

    if (parameters.date) {
        url = `${url}date=${parameters.date}&`;
    }

    if (parameters.salary) {
        if (parameters.salary >= 0 && parameters.salary <= 200000) {
            url = `${url}salary=${parameters.salary}&`;
        }
    }

    if(parameters.education) {
        url = `${url}education=${parameters.education}&`;
    }

    if (parameters.arrangement) {
        url = `${url}arrangement=${parameters.arrangement}&`;
    }

    if (parameters.employer) {
        url = `${url}employer=${parameters.employer}&`;
    }

    if (parameters.disabled) {
        url = `${url}disabled=1&`;
    } else if (parameters.suitableFor) {
        url = `${url}suitable-for=${parameters.suitableFor}&`;
    }

    if (parameters.locality === 'praha') {
        if (parameters.radius) {
            url = `${url}locality[radius]=${parameters.radius}`;
        } else {
            url = `${url}locality[radius]=0`;
        }
    }

    if (DEBUG) {
        console.log(chalk.bold('URL: ') + chalk.reset(chalk.gray(url)));
        console.log();
    }

    return url;
}

export {constructUrl}