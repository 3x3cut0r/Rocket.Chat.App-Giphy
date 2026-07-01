import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { Giphy } from '../Giphy';
import { GiphyResult } from '../helpers/GiphyResult';

export const GIPHY_COMMAND_MODULE = 'giphy-command';

type CommandMode = 'default' | 'more' | 'shuffle';

interface ICommandOptions {
    mode: CommandMode;
    query: string;
}

export class GiphyCommand implements ISlashCommand {
    public command = 'giphy';
    public i18nParamsExample = 'GIPHY_Search_Term';
    public i18nDescription = 'GIPHY_Command_Description';
    public providesPreview = true;

    constructor(private readonly app: Giphy) { }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        _persistence: IPersistence,
    ): Promise<void> {
        const options = this.parseArguments(context.getArguments());

        try {
            const gifs = await this.app.getGifGetter().search(this.app.getLogger(), http, options.query, read, {
                randomPage: options.mode !== 'default',
            });

            if (!gifs.length) {
                await this.notifyFailure(context, modify, 'No GIFs were found for your query.');
                return;
            }

            const gif = gifs[Math.floor(Math.random() * gifs.length)];

            await this.sendGif(context, read, modify, gif, options.query);
        } catch (error) {
            this.app.getLogger().error('Failed getting a gif', error);
            await this.notifyFailure(context, modify, 'An error occurred when trying to send the gif :disappointed_relieved:');
        }
    }

    public async previewer(
        context: SlashCommandContext,
        read: IRead,
        _modify: IModify,
        http: IHttp,
        _persistence: IPersistence,
    ): Promise<ISlashCommandPreview> {
        const options = this.parseArguments(context.getArguments());
        let gifs: Array<GiphyResult>;
        let items: Array<ISlashCommandPreviewItem>;

        try {
            gifs = await this.app.getGifGetter().search(this.app.getLogger(), http, options.query, read, {
                randomPage: options.mode !== 'default',
            });
            items = gifs.map((gif) => gif.toPreviewItem());
        } catch (e) {
            this.app.getLogger().error('Failed on something:', e);
            return {
                i18nTitle: 'ERROR',
                items: [],
            };
        }

        return {
            i18nTitle: this.getPreviewTitle(options.mode),
            items,
        };
    }

    public async executePreviewItem(
        item: ISlashCommandPreviewItem,
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        _persistence: IPersistence,
    ): Promise<void> {
        try {
            const gif = await this.app.getGifGetter().getOne(this.app.getLogger(), http, item.id, read);
            const options = this.parseArguments(context.getArguments());
            await this.sendGif(context, read, modify, gif, options.query);
        } catch (error) {
            this.app.getLogger().error('Failed getting a gif', error);
            await this.notifyFailure(context, modify, 'An error occurred when trying to send the gif :disappointed_relieved:');
        }
    }

    private async sendGif(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        gif: GiphyResult,
        trigger: string,
    ): Promise<void> {
        const builder = modify.getCreator().startMessage().setSender(context.getSender()).setRoom(context.getRoom());
        const showTitle = await read.getEnvironmentReader().getSettings().getValueById('giphy_show_title');
        const tid = context.getThreadId();
        const searchTerm = trigger || 'random';
        const title = this.getAttachmentTitle(gif, showTitle === true);

        if (tid) {
            builder.setThreadId(tid);
        }

        builder.addAttachment({
            title: {
                value: title,
            },
            author: {
                icon: 'https://raw.githubusercontent.com/wreiske/Rocket.Chat.App-Giphy/master/images/Giphy-256.png',
                name: `/giphy ${searchTerm}`,
                link: `https://giphy.com/search/${encodeURIComponent(searchTerm)}`,
            },
            imageUrl: gif.originalUrl,
        });

        await modify.getCreator().finish(builder);
    }

    private async notifyFailure(context: SlashCommandContext, modify: IModify, message: string): Promise<void> {
        const builder = modify.getCreator().startMessage().setSender(context.getSender()).setRoom(context.getRoom());
        const tid = context.getThreadId();

        if (tid) {
            builder.setThreadId(tid);
        }

        builder.setText(message);
        await modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
    }

    private parseArguments(args: Array<string>): ICommandOptions {
        const [firstArg, ...rest] = args;
        const normalized = firstArg?.trim().toLowerCase();

        if (normalized === 'more' || normalized === 'next') {
            return {
                mode: 'more',
                query: rest.join(' ').trim(),
            };
        }

        if (normalized === 'shuffle' || normalized === 'random') {
            return {
                mode: 'shuffle',
                query: rest.join(' ').trim(),
            };
        }

        return {
            mode: 'default',
            query: args.join(' ').trim(),
        };
    }

    private getPreviewTitle(mode: CommandMode): string {
        switch (mode) {
            case 'more':
                return 'More results for';
            case 'shuffle':
                return 'Shuffled results for';
            default:
                return 'Results for';
        }
    }

    private getAttachmentTitle(gif: GiphyResult, showTitle: boolean): string {
        const gifTitle = gif.title.trim();

        if (showTitle && gifTitle) {
            return gifTitle;
        }

        return 'Powered by GIPHY';
    }
}
