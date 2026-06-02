/**
 * HttpHelper — Model bazlı HTTP yardımcısı
 *
 * Backend ile olan tüm iletişim buradan geçer.
 * Generic tip parametresi ile request/response modelleri otomatik cast edilir.
 * EidDTO alanları serileştirme/deserileştirme sırasında doğal olarak işlenir
 * (JSON.stringify/parse EidDTO'yu { "eid": "..." } nesnesi olarak taşır).
 *
 * Örnek kullanım:
 *   const res = await HttpHelper.post<WorkflowAdimIslemReqDTO, ServiceResponse<void>>(
 *     '/api/Workflow/AdimIslemYap',
 *     { adimEid: { eid: 'abc' }, userBasvuruEid: { eid: 'xyz' }, islemTipi: 2 }
 *   );
 */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '';

/** Backend'in her zaman döndüğü genel sarmalayıcı */
export interface ServiceResponse<T> {
  isSuccess: boolean;
  message: string;
  error_message?: {
    messageHeader: string;
    code: number;
    message: string;
  };
  data?: T;
  pageNumber?: number;
  itemsPerPage?: number;
  totalItems?: number;
}

let _authToken: string | null = null;

export const HttpHelper = {
  /** Oturum token'ını set et */
  setToken(token: string | null) {
    _authToken = token;
  },

  /** Mevcut token'ı al */
  getToken(): string | null {
    return _authToken;
  },

  /** Ortak header'lar */
  _headers(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;
    return headers;
  },

  /** Ham fetch + ServiceResponse sarmalayıcısı */
  async _fetch<TRes>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<ServiceResponse<TRes>> {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method,
      headers: this._headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      return {
        isSuccess: false,
        message: 'error',
        error_message: {
          messageHeader: 'HTTP Hatası',
          code: res.status,
          message: `Sunucu ${res.status} döndü`,
        },
      };
    }

    const json = await res.json();
    return json as ServiceResponse<TRes>;
  },

  /** GET — model bazlı, query param varsa URL'e ekle */
  async get<TRes>(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<ServiceResponse<TRes>> {
    let fullUrl = url;
    if (params) {
      const query = Object.entries(params)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (query) fullUrl += (url.includes('?') ? '&' : '?') + query;
    }
    return this._fetch<TRes>('GET', fullUrl);
  },

  /** POST — body model bazlı cast (EidDTO alanları otomatik { eid: "..." } olarak gider) */
  async post<TReq, TRes>(url: string, body: TReq): Promise<ServiceResponse<TRes>> {
    return this._fetch<TRes>('POST', url, body);
  },

  /** PUT */
  async put<TReq, TRes>(url: string, body: TReq): Promise<ServiceResponse<TRes>> {
    return this._fetch<TRes>('PUT', url, body);
  },

  /** DELETE */
  async delete<TRes>(url: string, params?: Record<string, string>): Promise<ServiceResponse<TRes>> {
    return this.get<TRes>(url, params);
  },

  /**
   * Dosya yükleme — multipart/form-data
   * Content-Type header'ı browser tarafından otomatik set edilir (boundary dahil).
   */
  async upload<TRes>(url: string, formData: FormData): Promise<ServiceResponse<TRes>> {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const headers: Record<string, string> = {};
    if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;

    const res = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      return {
        isSuccess: false,
        message: 'error',
        error_message: {
          messageHeader: 'Yükleme Hatası',
          code: res.status,
          message: `Dosya yüklenemedi: HTTP ${res.status}`,
        },
      };
    }

    return (await res.json()) as ServiceResponse<TRes>;
  },

  /**
   * Dosya indirme — blob olarak alır, tarayıcıda otomatik indirir
   */
  async download(url: string, body: unknown, dosyaAdi: string): Promise<void> {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`İndirme başarısız: HTTP ${res.status}`);

    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = dosyaAdi;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};
