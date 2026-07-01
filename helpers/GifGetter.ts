import { HttpStatusCode, IHttp, ILogger, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { GiphyResult } from '../helpers/GiphyResult';

interface IGiphySearchResponse {
    data?: Array<Record<string, unknown>>;
}

interface IGiphySingleResponse {
    data?: Record<string, unknown>;
}

export const GIF_GETTER_MODULE = 'gif-getter';

export class GifGetter {
    private readonly url = 'https://api.giphy.com/v1/gifs/';
    private readonly defaultKey = 'kICM0DRhpfvIcGLhtmCjqEigApnPMLXf';

    public async search(logger: ILogger, http: IHttp, phase: string, read: IRead): Promise<Array<GiphyResult>> {
        // TODO: Maybe error out when they don't provide us with something?
        let search = phase.trim();
        if (!search) {
            search = 'random';
        }

        const key = await this.getStringSetting(read, 'giphy_apikey', this.defaultKey);
        const langCode = await this.getStringSetting(read, 'giphy_lang_code', 'en');
        const rating = await this.getStringSetting(read, 'giphy_rating', 'g');
        const response = await http.get(`${this.url}search?api_key=${key}&q=${encodeURIComponent(search)}&limit=10&lang=${langCode}&rating=${rating}`);
        const payload = response?.data as IGiphySearchResponse | undefined;

        if (!response || response.statusCode !== HttpStatusCode.OK || !payload?.data) {
            logger.debug('Did not get a valid response', response);
            throw new Error('Unable to retrieve gifs.');
        } else if (!Array.isArray(payload.data)) {
            logger.debug('The response data is not an Array:', payload.data);
            throw new Error('Data is in a format we don\'t understand.');
        }

        // logger.debug('We got this many results:', response.data.data.length);
        return payload.data.map((result) => new GiphyResult(result));
    }

    public async getOne(logger: ILogger, http: IHttp, gifId: string, read: IRead): Promise<GiphyResult> {
        const key = await this.getStringSetting(read, 'giphy_apikey', this.defaultKey);
        const response = await http.get(`${this.url}${gifId}?api_key=${key}`);
        const payload = response?.data as IGiphySingleResponse | undefined;

        if (!response || response.statusCode !== HttpStatusCode.OK || !payload?.data) {
            logger.debug('Did not get a valid response', response);
            throw new Error('Unable to retrieve the gif.');
        } else if (Array.isArray(payload.data) || typeof payload.data !== 'object') {
            logger.debug('The response data is not an Object:', payload.data);
            throw new Error('Data is in a format we don\'t understand.');
        }

        // logger.debug('The returned data:', response.data.data);
        return new GiphyResult(payload.data);
    }

    private async getStringSetting(read: IRead, settingId: string, fallback: string): Promise<string> {
        const value = await read.getEnvironmentReader().getSettings().getValueById(settingId);

        return typeof value === 'string' && value.trim() ? value : fallback;
    }
}
