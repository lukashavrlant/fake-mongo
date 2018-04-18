import {MongoDbEngine} from "../src/mongo-db-engine";

const mongoEngine = new MongoDbEngine({
    mongoDbVersion: '3.4.0',
    binariesDir: './bin'
});

mongoEngine.start().then((data) => {
    console.log('hotovo');
    console.log(data);
}).catch((err) => {
    console.log('nastala chybiucka...');
    console.error(err);
});