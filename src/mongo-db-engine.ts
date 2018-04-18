import {MongoConnectionOptions, MongoEngine} from './mongo-engine';
import {MongoDBDownload} from 'mongodb-download';
import {MongoBins, MongoDBPrebuilt, MongodHelper} from 'mongodb-prebuilt';
import {join} from 'path';
import {getPortPromise} from 'portfinder';

export interface MongoDbEngineOptions {
    mongoDbVersion?: string;
    binariesDir?: string;
    dataDir?: string;
}

export class MongoDbEngine implements MongoEngine {
    private static MaxNumberOfStartTries = 5;
    private mongoDbDownload: MongoDBDownload;

    public constructor(private readonly options: MongoDbEngineOptions = {}) {
        this.mongoDbDownload = new MongoDBDownload({
            version: options.mongoDbVersion,
            downloadDir: options.binariesDir
        });
    }

    public async start(): Promise<MongoConnectionOptions> {
        await this.downloadBinariesIfNotExist();
        return this.tryStartMongoEngine();
    }

    public async stop(): Promise<void> {
        return undefined;
    }

    private async tryStartMongoEngine(): Promise<MongoConnectionOptions> {
        for (let i = 0; i < MongoDbEngine.MaxNumberOfStartTries; i++) {
            try {
                const helper = await this.setUpMongoHelper();
                await helper.mongodHelper.run();
                return helper.connectionOptions;
            } catch (err) {
                console.log(`Cannot start mongo because of '${err}'.`, i !== (MongoDbEngine.MaxNumberOfStartTries - 1) ? `I'll try again.` : '');
            }
        }

        throw new Error(`Cannot start Mongo Engine after ${MongoDbEngine.MaxNumberOfStartTries} retries`);
    }

    private async downloadBinariesIfNotExist() {
        await this.mongoDbDownload.downloadAndExtract();
    }

    private async setUpMongoHelper(): Promise<{mongodHelper: MongodHelper, connectionOptions: MongoConnectionOptions}> {
        const config = await this.getMongoDbParams();
        const params = this.convertToUnixParams(config);
        const mongoDbPrebuilt = new MongoDBPrebuilt(this.mongoDbDownload);
        const mongodHelper = new MongodHelper();
        console.log(`starting mongo with params ${JSON.stringify(params)}`);
        const mongoBins = new MongoBins('mongod', params);
        mongoBins.mongoDBPrebuilt = mongoDbPrebuilt;
        mongodHelper.mongoBin = mongoBins;

        return {
            mongodHelper,
            connectionOptions: {
                port: config.port,
                host: config.bind_ip
            }
        };
    }

    private async getMongoDbParams(): Promise<any> {
        const freePort = await this.getFreePort();

        return {
            port: freePort,
            dbpath: this.options.binariesDir || join(__dirname, '../data'),
            storageEngine: 'ephemeralForTest',
            bind_ip: '127.0.0.1'
        };
    }

    private async getFreePort(): Promise<number> {
        return getPortPromise();
    }

    private convertToUnixParams(object: { [key: string]: string | number }): Array<string> {
        const params: Array<string> = [];

        Object.keys(object).forEach((paramName) => {
            params.push(`--${paramName}`);
            params.push(`${object[paramName]}`);
        });

        return params;
    }
}
