import { ObjectId, Db, Collection} from 'mongodb';
import {Post} from '../interfaces/Post';

async function writeMongo(db: Db, post: Post): Promise<void> {
    const collection: Collection = db.collection('postings');
    const query = { url: post.url };
    const existingPost = await collection.findOne(query);

    if (!existingPost) {
        post._id = new ObjectId();
        await collection.insertOne(post);
    }
}

export {writeMongo}