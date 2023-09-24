import {ObjectId} from 'mongodb';

interface Post {
    _id?: ObjectId,
    url?: string | null,
    url2?: string,
    title?: string,
    salary?: string | null,
    tags?: string[],
    company?: string,
    location?: string,
    exactLocation?: { text: string, url: string | null } | null,
}

export {Post}