import axios, { AxiosInstance } from "axios";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppLogger } from "src/logger/logger.module";
import * as FormData from 'form-data';


@Injectable()
export class MetaHelperService {

  private readonly headers: any;
  private readonly baseUrl: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.baseUrl = this.configService.get('WCA_BASE_URL') || "";
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.configService.get('WCA_TOKEN')}`,
    };
    this.axiosInstance = axios.create();
  }

  public async acceptCall(callData: any, metadata: any) {
    var url = `${this.baseUrl}/${metadata.phoneNumberId}/calls`;
    const payload = {
      messaging_product: 'whatsapp',
      call_id: callData.callId,
      action: 'accept',
      session: { sdp_type: 'answer', sdp: callData.sdpAnswer },
    };

    var apiRes = await this.axiosInstance.post(url, payload, { headers: this.headers });
    return apiRes.data;
  }

  public async terminateCall(callData: any, metadata: any) {
    var url = `${this.baseUrl}/${metadata.phoneNumberId}/calls`;
    const payload = {
      messaging_product: 'whatsapp',
      call_id: callData.callId,
      action: callData.action,
    };

    var apiRes = await this.axiosInstance.post(url, payload, { headers: this.headers });
    return apiRes.data;
  }

  public async initiateCall(callData: any, metadata: any) {
    var url = `${this.baseUrl}/${metadata.phoneNumberId}/calls`;
    const payload = {
      messaging_product: 'whatsapp',
      to: callData.phone,
      action: "connect",
      session: {
        "sdp_type": "offer",
        "sdp": callData.sdpOffer
      }
    };
    var apiRes = await this.axiosInstance.post(url, payload, { headers: this.headers });
    return apiRes.data;
  }

  public async getAccessToken(fbCode: any) {
    var clientId = this.configService.get('WCA_APP_ID');
    var clientSecret = this.configService.get('WCA_APP_SECRET');

    var url = `${this.baseUrl}/oauth/access_token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${fbCode}`;
    var apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async decryptAccessToken(accessToken: any) {
    var url = `${this.baseUrl}/debug_token?input_token=${accessToken}`;

    var apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async getPhoneNumberIdBusinessIdByWABAId(wabaId: any) {
    var url = `${this.baseUrl}/${wabaId}?fields=name,on_behalf_of_business_info,phone_numbers`;

    var apiRes = await this.triggerMetaApi('get', url);

    var apiData = apiRes.data;

    var businessId = apiData.on_behalf_of_business_info?.id;
    var phoneNumberId = apiData.phone_numbers?.data?.length > 0 ? apiData.phone_numbers.data[0].id : "";
    var name = apiData.name;
    var phoneNumber = apiData.phone_numbers?.data?.length > 0 ? apiData.phone_numbers.data[0].display_phone_number : "";

    return { businessId, phoneNumberId, name, phoneNumber };
  }

  public async subscribeWABAToApp(wabaId: string) {
    var url = `${this.baseUrl}/${wabaId}/subscribed_apps`;

    var apiRes = await this.triggerMetaApi('post', url);
    return apiRes.data;
  }

  public async registerPhoneNumber(phoneNumberId: string, pin: number) {
    var url = `${this.baseUrl}/${phoneNumberId}/register`;
    const payload = {
      messaging_product: "whatsapp",
      pin: pin
    };

    var apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data;
  }

  public async getCallSettings(phoneNumberId: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/settings`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async setCallSettings(phoneNumberId: string, payload: any) {
    const url = `${this.baseUrl}/${phoneNumberId}/settings`;
    const apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data;
  }

  public async getWhatsappProfile(phoneNumberId: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async setWhatsappProfile(phoneNumberId: string, payload: any) {
    const url = `${this.baseUrl}/${phoneNumberId}/whatsapp_business_profile`;
    const apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data;
  }

  public async getTemplateByTemplateId(templateId: string) {
    const url = `${this.baseUrl}/${templateId}`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async getAllTemplates(wabaId: string, params: any) {
    const url = `${this.baseUrl}/${wabaId}/message_templates`;
    const apiRes = await this.triggerMetaApi('get', url, null, params);
    return apiRes.data;
  }

  public async getTemplateByTemplateName(wabaId: string, templateName: string) {
    const url = `${this.baseUrl}/${wabaId}/message_templates?name=${templateName}`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async createTemplate(wabaId: string, payload: any) {
    const url = `${this.baseUrl}/${wabaId}/message_templates`;
    const apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data;
  }

  public async getAllForms(wabaId: string) {
    const url = `${this.baseUrl}/${wabaId}/flows`;
    const apiRes = await this.triggerMetaApi('get', url, null);
    return apiRes.data;
  }

  public async getFormById(wabaId: string, formId: string) {
    const url = `${this.baseUrl}/${formId}`;
    const apiRes = await this.triggerMetaApi('get', url, null);
    return apiRes.data;
  }

  public async getFlowPreview(flowId: string) {
    const url = `${this.baseUrl}/${flowId}?fields=preview.invalidate(false)`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async getMediaIdWithMedia(
    phoneNumberId: string,
    file: Express.Multer.File,
  ) {
    const url = `${this.baseUrl}/${phoneNumberId}/media`;

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append('messaging_product', 'whatsapp');

    const headers = {
      ...formData.getHeaders(),
      Authorization: `Bearer ${this.configService.get('WCA_TOKEN')}`,
    };

    const apiRes = await this.axiosInstance.post(url, formData, {
      headers,
    });


    return apiRes.data;
  }

  public async getTemplateLibrary(params?: any) {
    const url = `${this.baseUrl}/message_template_library`;
    const apiRes = await this.triggerMetaApi('get', url, null, params);
    return apiRes.data;
  }

  public async startResumableUpload(
    fileName: string,
    fileLength: number,
    fileType: string,
  ) {
    const appId = this.configService.get('WCA_APP_ID');


    const url = `${this.baseUrl}/${appId}/uploads`;


    const payload = {
      file_name: fileName,
      file_length: fileLength,
      file_type: fileType,
    };


    const apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data; // return upload session id
  }

  public async changeBlockUsers(
    phoneNumberId: string,
    users: string[],
    isBlock: boolean,
  ) {
    const url = `${this.baseUrl}/${phoneNumberId}/block_users`;
    const payload = {
      messaging_product: 'whatsapp',
      block_users: users.map(user => ({ user })),
    };
    const method = isBlock ? 'post' : 'delete';
    const apiRes = await this.triggerMetaApi(method, url, payload);
    return apiRes.data;
  }

  public async blockUsers(phoneNumberId: string, users: string[]) {
    return this.changeBlockUsers(phoneNumberId, users, true);
  }

  public async unblockUsers(phoneNumberId: string, users: string[]) {
    return this.changeBlockUsers(phoneNumberId, users, false);
  }

  public async getBlockedUsers(phoneNumberId: string, params?: any) {
    const url = `${this.baseUrl}/${phoneNumberId}/block_users`;
    const apiRes = await this.triggerMetaApi('get', url, null, params);
    return apiRes.data;
  }

  public async uploadFileToSession(
    uploadSessionId: string,
    file: Express.Multer.File,
  ) {
    const url = `${this.baseUrl}/${uploadSessionId}`;


    const headers = {
      Authorization: `OAuth ${this.configService.get('WCA_TOKEN')}`,
      file_offset: '0',
      'Content-Type': file.mimetype,
    };


    const apiRes = await this.axiosInstance.post(
      url,
      file.buffer,
      { headers },
    );


    return apiRes.data; // returns handle
  }

  public async getfileUploadStatus(uploadSessionId: string) {
    const url = `${this.baseUrl}/${uploadSessionId}`;
    const headers = {
      Authorization: `OAuth ${this.configService.get('WCA_TOKEN')}`,
    };
    const apiRes = await this.axiosInstance.get(url, { headers });
    return apiRes.data; // returns handle
  }

  public async getCatalogProducts(catalogId: string, params?: any) {
    const url = `${this.baseUrl}/${catalogId}/products`;
    const apiRes = await this.triggerMetaApi('get', url, null, params);
    return apiRes.data;
  }

  public async getCatalogData(catalogId: string) {
    const url = `${this.baseUrl}/${catalogId}`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async getConnectedCatalog(wabaId: string) {
    const url = `${this.baseUrl}/${wabaId}/product_catalogs`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async disconnectCatalog(wabaId: string, catalogId: string) {
    const url = `${this.baseUrl}/${wabaId}/product_catalogs?catalog_id=${catalogId}`;
    const apiRes = await this.triggerMetaApi('delete', url);
    return apiRes.data;
  }

  public async connectCatalog(wabaId: string, catalogId: string) {
    const url = `${this.baseUrl}/${wabaId}/product_catalogs`;
    const payload = { catalog_id: catalogId };
    const apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data;
  }

  public async getAllPaymentConfigurations(wabaId: string) {
    const url = `${this.baseUrl}/${wabaId}/payment_configurations`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  public async addPaymentConfiguration(wabaId: string, payload: any) {
    const url = `${this.baseUrl}/${wabaId}/payment_configurations`;
    const apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data;
  }

  public async updatePaymentConfiguration(wabaId: string, configurationName: string, payload: any) {
    const url = `${this.baseUrl}/${wabaId}/payment_configurations/${configurationName}`;
    const apiRes = await this.triggerMetaApi('post', url, payload);
    return apiRes.data;
  }

  public async deletePaymentConfiguration(wabaId: string, configurationName: string) {
    const url = `${this.baseUrl}/${wabaId}/payment_configurations`;
    const payload = {
      configuration_name: configurationName
    }
    const apiRes = await this.triggerMetaApi('delete', url, payload);
    return apiRes.data;
  }

  public async getAnalytics(wabaId: string, params?: any) {
    const url = `${this.baseUrl}/${wabaId}`;
    const apiRes = await this.triggerMetaApi('get', url, null, params);
    return apiRes.data;
  }

  public async getWabaStatus(phoneNumberId: string) {
    const url = `${this.baseUrl}/${phoneNumberId}?fields=whatsapp_business_manager_messaging_limit,verified_name,quality_rating,health_status`;
    const apiRes = await this.triggerMetaApi('get', url);
    return apiRes.data;
  }

  private async triggerMetaApi(type: string, url: string, payload?: any, params?: any) {
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