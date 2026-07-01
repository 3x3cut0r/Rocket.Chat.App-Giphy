import { ISlashCommandPreviewItem, SlashCommandPreviewItemType } from '@rocket.chat/apps-engine/definition/slashcommands';

export const GIPHY_RESULT_MODULE = 'giphy-result';

export class GiphyResult {
    public id: string;
    public title: string;
    public previewUrl: string;
    public originalUrl: string;

    // Returns data we care about from the gif endpoints
    constructor(data?: Record<string, any>) {
        if (data) {
            this.id = data.id as string;
            this.title = data.title as string;
            this.previewUrl = data.images.fixed_height_small.url as string;
            this.originalUrl = data.images.original.url as string;
        }
    }

    public toPreviewItem(): ISlashCommandPreviewItem {
        if (!this.id || !this.previewUrl) {
            throw new Error('Invalid result');
        }
        return {
            id: this.id,
            type: SlashCommandPreviewItemType.IMAGE,
            value: this.previewUrl,
        };
    }
}
