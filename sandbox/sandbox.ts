import {MongoDbEngine} from '../src/mongo-db-engine';
import {MongoClient} from 'mongodb';

const mongoEngine = new MongoDbEngine({
    mongoDbVersion: '3.4.0',
    binariesDir: './bin'
});

mongoEngine.start().then((data) => {
    console.log('hotovo');
    console.log(data);

    MongoClient.connect(`mongodb://${data.host}:${data.port}`, async (err, client) => {
         if (err) {
             return console.error(err);
         } else {
             console.log('Connected successfully to server');
             const db = client.db('testDb');
             const collection = db.collection('testCollection');
             await collection.insertOne({foo: 'bar'});
             const result = await collection.find({}).toArray();
             console.log(result);
         }
    });

}).catch((err) => {
    console.log('nastala chybiucka...');
    console.error(err);
});
