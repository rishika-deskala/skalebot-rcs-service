import axios, { AxiosInstance } from "axios";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppLogger } from "src/logger/logger.module";


@Injectable()
export class MetaApiService {

    private readonly headers: any;
    private readonly axiosInstance: AxiosInstance;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: AppLogger,
    ) {
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.configService.get('WCA_TOKEN')}`,
        };
        this.axiosInstance = axios.create();
    }

    public async triggerMetaApi(type: string, url: string, payload?: any, params?: any) {
        try {
            switch (type) {
                case 'get':
                    return await this.axiosInstance.get(url, { headers: this.headers, params: params });
                case 'post':
                    return await this.axiosInstance.post(url, payload, { headers: this.headers });
                case 'delete':
                    return await this.axiosInstance.delete(url, { headers: this.headers, data: payload });
                case 'put':
                    return await this.axiosInstance.put(url, payload, { headers: this.headers });
                default:
                    throw new Error('Invalid request type');
            }
        }
        catch (error) {
            this.logger.error(`Meta API Error: ${error}`, 'MetaHelperService');
            if (axios.isAxiosError(error) && error.response) {
                if (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404) {
                    throw new BadRequestException(error.response.data.error, error.response.data.error.message);
                }
            }
            throw error;
        }
    }
}