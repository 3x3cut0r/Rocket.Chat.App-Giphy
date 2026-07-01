import {
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

import { GiphyCommand } from './commands/GiphyCommand';
import { GifGetter } from './helpers/GifGetter';

export class Giphy extends App {
    private gifGetter?: GifGetter;
    private isConfigured = false;

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public getGifGetter(): GifGetter {
        if (!this.gifGetter) {
            this.gifGetter = new GifGetter();
        }

        return this.gifGetter;
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, _environmentRead: IEnvironmentRead): Promise<void> {
        await this.configure(configuration);
    }

    public async initialize(configuration: IConfigurationExtend, _environmentRead: IEnvironmentRead): Promise<void> {
        this.gifGetter = new GifGetter();
        await this.configure(configuration);
    }

    private async configure(configuration: IConfigurationExtend): Promise<void> {
        if (this.isConfigured) {
            return;
        }

        this.isConfigured = true;

        await configuration.settings.provideSetting({
            id: 'giphy_apikey',
            type: SettingType.STRING,
            packageValue: '',
            required: true,
            public: false,
            i18nLabel: 'Customize_GIPHY_APIKey',
            i18nDescription: 'Customize_GIPHY_APIKey_Description',
        });
        await configuration.settings.provideSetting({
            id: 'giphy_lang_code',
            type: SettingType.STRING,
            packageValue: 'en',
            required: true,
            public: false,
            i18nLabel: 'Customize_GIPHY_Language',
            i18nDescription: 'Customize_GIPHY_Language_Description',
        });
        await configuration.settings.provideSetting({
            id: 'giphy_rating',
            type: SettingType.STRING,
            packageValue: 'G',
            required: true,
            public: false,
            i18nLabel: 'Customize_GIPHY_Rating',
            i18nDescription: 'Customize_GIPHY_Rating_Description',
        });
        await configuration.settings.provideSetting({
            id: 'giphy_show_title',
            type: SettingType.BOOLEAN,
            packageValue: true,
            required: true,
            public: false,
            i18nLabel: 'Customize_GIPHY_Show_Title',
            i18nDescription: 'Customize_GIPHY_Show_Title_Description',
        });
        await configuration.settings.provideSetting({
            id: 'giphy_preview_limit',
            type: SettingType.STRING,
            packageValue: '10',
            required: true,
            public: false,
            i18nLabel: 'Customize_GIPHY_Preview_Limit',
            i18nDescription: 'Customize_GIPHY_Preview_Limit_Description',
        });
        await configuration.slashCommands.provideSlashCommand(new GiphyCommand(this));
    }
}
