import fs from "fs";
import {Post} from "../interfaces/Post";

function write(post: Post, firstPost: boolean, writeStream: fs.WriteStream): boolean {
    if (!firstPost) {
        writeStream.write(',\n');
    }

    writeStream.write('  ' + JSON.stringify(post, null, 2));
    return false;
}

export {write}