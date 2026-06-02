using Lore.Basvuru.Bal.Managers.DisServis.Interfaces;
using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;

namespace Lore.Basvuru.Bal.Managers.DisServis
{
    public class DisServisManager : IDisServisManager
    {
        private readonly IGenericRepository<t_frm_soru> _soruRepo;
        private readonly HttpClient _httpClient;

        public DisServisManager(
            IGenericRepository<t_frm_soru> soruRepo,
            IHttpClientFactory httpClientFactory)
        {
            _soruRepo = soruRepo;
            _httpClient = httpClientFactory.CreateClient("DisServis");
        }

        public List<SelectItemDTO> SecenekleriGetir(
            long soruId,
            string? aramaMetni = null,
            Dictionary<string, string>? ekParametreler = null)
        {
            var soru = _soruRepo.Get(soruId)
                ?? throw new AppException(404, "Soru bulunamadı");

            // KaynakTipi: 1=Manuel, 2=Dış Servis GET, 3=Dış Servis POST
            if (soru.KaynakTipi == 1)
                throw new AppException(400, "Manuel seçenekler ayrı endpoint ile getirilir");

            // DisServis JSON yapılandırması EkBilgi alanında saklanır
            var config = JsonConvert.DeserializeObject<DisServisConfig>(soru.EkBilgi ?? "{}");
            if (config == null || string.IsNullOrEmpty(config.url))
                throw new AppException(400, "Dış servis yapılandırması eksik");

            // URL parametre ikamesi
            var url = config.url
                .Replace("{aramaMetni}", Uri.EscapeDataString(aramaMetni ?? ""))
                .Replace("{tenantId}", HttpContextHelper.GetTenantId().ToString());

            if (ekParametreler != null)
            {
                foreach (var p in ekParametreler)
                    url = url.Replace($"{{{p.Key}}}", Uri.EscapeDataString(p.Value));
            }

            HttpResponseMessage response;

            using var request = new HttpRequestMessage();

            // Header'lar
            if (config.headers != null)
            {
                foreach (var header in config.headers)
                    request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }

            if (soru.KaynakTipi == 2) // GET
            {
                request.Method = HttpMethod.Get;
                request.RequestUri = new Uri(url);
            }
            else // POST
            {
                var body = config.requestBody ?? "{}";
                if (aramaMetni != null)
                    body = body.Replace("{aramaMetni}", aramaMetni);

                request.Method = HttpMethod.Post;
                request.RequestUri = new Uri(url);
                request.Content = new StringContent(body, Encoding.UTF8, "application/json");
            }

            try
            {
                response = _httpClient.SendAsync(request).Result;
            }
            catch (Exception ex)
            {
                AppLog.Error($"[DisServisManager] Dış servis isteği başarısız: SoruId={soruId}, Url={url}", ex);
                throw new AppException(502, "Dış servis yanıt vermedi");
            }

            if (!response.IsSuccessStatusCode)
                throw new AppException(502, $"Dış servis hata döndü: {(int)response.StatusCode}");

            var json = response.Content.ReadAsStringAsync().Result;
            var items = new List<SelectItemDTO>();

            try
            {
                JToken dataToken = JToken.Parse(json);

                // config.dataPath ile iç diziye ulaş
                if (!string.IsNullOrEmpty(config.dataPath))
                {
                    foreach (var segment in config.dataPath.Split('.'))
                        dataToken = dataToken[segment] ?? dataToken;
                }

                if (dataToken is JArray array)
                {
                    foreach (var item in array)
                    {
                        items.Add(new SelectItemDTO
                        {
                            value = item[config.valueField ?? "id"]?.ToString() ?? "",
                            label = item[config.labelField ?? "ad"]?.ToString() ?? ""
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                AppLog.Error($"[DisServisManager] Yanıt parse hatası: SoruId={soruId}", ex);
                throw new AppException(502, "Dış servis yanıtı işlenemedi");
            }

            return items;
        }
    }
}
