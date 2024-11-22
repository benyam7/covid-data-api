import { Schema, model } from 'mongoose';

interface IApiKey {
    key: string;
    clientName: string;
    createdAt: Date;
    expiresAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
    key: { type: String, required: true, unique: true },
    clientName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

export const ApiKey = model<IApiKey>('ApiKey', ApiKeySchema);
