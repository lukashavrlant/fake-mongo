export interface MongoConnectionOptions {
    host: string;
    port: number;
}

export interface MongoEngine {
    start(): Promise<MongoConnectionOptions>;
    stop(): Promise<void>;
}