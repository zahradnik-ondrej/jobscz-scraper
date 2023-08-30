import {Post} from '../interfaces/Post';
import chalk from 'chalk';
import {DEBUG} from '../constants/DEBUG';

function print(post: Post, url: boolean = false): void {
    if (post.title) {
        console.log(chalk.bold(post.title));
    }

    if (url) {
        if (post.url) {
            console.log(chalk.gray(`(${post.url})`))
        }
        if (post.url2) {
            console.log(chalk.gray(`(${post.url2})`))
        }
    }
    if (post.salary) {
        console.log(post.salary);
    } else if (DEBUG) {
        console.log(chalk.red('salary not found'));
    }

    if (post.tags && post.tags.length) {
        console.log(post.tags);
    } else if (DEBUG) {
        console.log(chalk.red('tags not found'));
    }

    if (post.company) {
        console.log(post.company);
    }

    if (post.exactLocation && post.location) {
        let exactLocationUrl: string | null;
        if (post.exactLocation.url) {
            exactLocationUrl = chalk.gray(`(${post.exactLocation.url})`);
            if (!url) {
                exactLocationUrl = '';
            }
        } else {
            exactLocationUrl = '';
        }
        if (post.exactLocation.text.includes(post.location)) {
            console.log(`${post.exactLocation.text} ${exactLocationUrl}`);
        } else if (post.location.includes(post.exactLocation.text)) {
            console.log(`${post.location} ${exactLocationUrl}`);
        } else {
            console.log(post.location);
        }
    } else if (post.location) {
        console.log(post.location);
        if (DEBUG) {
            //console.log(chalk.red('exact location not found'));
        }
    }

    console.log();
}

export {print}