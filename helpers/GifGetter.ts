import { HttpStatusCode, IHttp, ILogger, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { GiphyResult } from '../helpers/GiphyResult';

interface IGiphySearchResponse {
    data?: Array<Record<string, unknown>>;
    pagination?: {
        total_count?: number;
    };
}

interface IGiphySingleResponse {
    data?: Record<string, unknown>;
}

export const GIF_GETTER_MODULE = 'gif-getter';

interface ISearchOptions {
    limit?: number;
    randomPage?: boolean;
}

interface ISearchRequest {
    key: string;
    langCode: string;
    limit: number;
    rating: string;
    search: string;
}

export class GifGetter {
    private readonly url = 'https://api.giphy.com/v1/gifs/';
    private readonly defaultKey = 'kICM0DRhpfvIcGLhtmCjqEigApnPMLXf';

    public async search(
        logger: ILogger,
        http: IHttp,
        phase: string,
        read: IRead,
        options?: ISearchOptions,
    ): Promise<Array<GiphyResult>> {
        const request = await this.buildSearchRequest(phase, read, options);
        let payload = await this.fetchSearchResponse(logger, http, request, 0);

        if (request.langCode.toLowerCase().startsWith('de') && payload.data.length === 0) {
            payload = await this.fetchSearchResponse(logger, http, { ...request, langCode: 'en' }, 0);
        }

        if (options?.randomPage) {
            const randomOffset = this.getRandomOffset(payload.pagination?.total_count, request.limit);

            if (randomOffset > 0) {
                payload = await this.fetchSearchResponse(logger, http, request, randomOffset);
            }
        }

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

    private async buildSearchRequest(phase: string, read: IRead, options?: ISearchOptions): Promise<ISearchRequest> {
        let search = phase.trim();

        if (!search) {
            search = 'random';
        }

        const key = await this.getStringSetting(read, 'giphy_apikey', this.defaultKey);
        const langCode = await this.getStringSetting(read, 'giphy_lang_code', 'en');
        const rating = await this.getStringSetting(read, 'giphy_rating', 'g');
        const limit = await this.getPreviewLimit(read, options?.limit);

        return {
            key,
            langCode,
            limit,
            rating,
            search,
        };
    }

    private async fetchSearchResponse(
        logger: ILogger,
        http: IHttp,
        request: ISearchRequest,
        offset: number,
    ): Promise<Required<IGiphySearchResponse>> {
        const response = await http.get(
            `${this.url}search?api_key=${request.key}&q=${encodeURIComponent(request.search)}&limit=${request.limit}&offset=${offset}&lang=${request.langCode}&rating=${request.rating}`,
        );
        const payload = response?.data as IGiphySearchResponse | undefined;

        if (!response || response.statusCode !== HttpStatusCode.OK || !payload?.data) {
            logger.debug('Did not get a valid response', response);
            throw new Error('Unable to retrieve gifs.');
        }

        if (!Array.isArray(payload.data)) {
            logger.debug('The response data is not an Array:', payload.data);
            throw new Error('Data is in a format we don\'t understand.');
        }

        return {
            data: payload.data,
            pagination: payload.pagination ?? {},
        };
    }

    private getRandomOffset(totalCount: number | undefined, limit: number): number {
        if (!totalCount || totalCount <= limit) {
            return 0;
        }

        const maxOffset = Math.max(0, Math.min(totalCount - limit, limit * 9));
        const pageCount = Math.floor(maxOffset / limit) + 1;

        if (pageCount <= 1) {
            return 0;
        }

        const pageIndex = Math.floor(Math.random() * (pageCount - 1)) + 1;

        return pageIndex * limit;
    }

    private async getPreviewLimit(read: IRead, requestedLimit?: number): Promise<number> {
        if (requestedLimit && Number.isInteger(requestedLimit)) {
            return this.clampPreviewLimit(requestedLimit);
        }

        const settingValue = await this.getStringSetting(read, 'giphy_preview_limit', '10');
        const parsed = Number.parseInt(settingValue, 10);

        if (Number.isNaN(parsed)) {
            return 10;
        }

        return this.clampPreviewLimit(parsed);
    }

    private clampPreviewLimit(value: number): number {
        return Math.min(25, Math.max(1, value));
    }
}
