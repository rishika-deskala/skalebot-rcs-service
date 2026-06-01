import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MetaApiService } from "./meta.api.service";


@Injectable()
export class MetaCatalogHelperService {

    private readonly baseUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly metaApiHelper: MetaApiService,
    ) {
        this.baseUrl = this.configService.get('WCA_BASE_URL') || "";
    }

    public async addProductToCatalog(catalogId: string, product: any) {
        const url = `${this.baseUrl}/${catalogId}/products`;
        const response = await this.metaApiHelper.triggerMetaApi('post', url, product);
        return response.data;
    }

    public async getProduct(productId: string) {
        const url = `${this.baseUrl}/${productId}`;
        const params = {
            fields: 'id,retailer_id,name,description,price,currency,category,image_url,additional_image_urls,availability,url,sale_price',
        };
        const response = await this.metaApiHelper.triggerMetaApi('get', url,null, params);
        return response.data;
    }

    public async updateProduct(productId: string, product: any) {
        const url = `${this.baseUrl}/${productId}`;
        const response = await this.metaApiHelper.triggerMetaApi('post', url, product);
        return response.data;
    }

    public async deleteProduct(productId: string) {
        const url = `${this.baseUrl}/${productId}`;
        const response = await this.metaApiHelper.triggerMetaApi('delete', url);
        return response.data;
    }
}
