# 06 — Manager (BAL) Katmanı

## Genel Prensipler
- Her manager bir `I{Adi}Manager` interface'i implement eder
- Metodlar Türkçe isimlendirilir: `Getir`, `Kaydet`, `Sil`, `Listele`, `Dogrula` vb.
- Business hataları `throw new AppException(kod, mesaj)` ile fırlatılır
- Önemli işlemler `AppLog.Info(...)` ile loglanır
- Repository bağımlılıkları constructor injection ile alınır
- `IMapper` AutoMapper için inject edilir

---

## Örnek: AuthManager (Login/Token)

```csharp
// Lore.Basvuru.Bal/Managers/Security/AuthManager.cs
public interface IAuthManager
{
    LoginResponseDTO KullaniciGiris(LoginRequestDTO req);
    LoginResponseDTO SSOIleGiris(SSOLoginRequestDTO req);
    LoginResponseDTO JWTIleGiris(JWTLoginRequestDTO req);
    bool CikisYap(string token);
    KullaniciTokenDTO TokenDogrula(string token);
    void TokenYenile(string token);
}

public class AuthManager : IAuthManager
{
    private readonly IGenericRepository<t_sis_user> _userRepo;
    private readonly IGenericRepository<t_sis_user_token> _tokenRepo;
    private readonly IGenericRepository<t_sis_login_provider> _providerRepo;
    private readonly IMapper _mapper;
    private readonly ISSOManager _ssoManager;

    public AuthManager(
        IGenericRepository<t_sis_user> userRepo,
        IGenericRepository<t_sis_user_token> tokenRepo,
        IGenericRepository<t_sis_login_provider> providerRepo,
        IMapper mapper,
        ISSOManager ssoManager)
    {
        _userRepo = userRepo;
        _tokenRepo = tokenRepo;
        _providerRepo = providerRepo;
        _mapper = mapper;
        _ssoManager = ssoManager;
    }

    public LoginResponseDTO KullaniciGiris(LoginRequestDTO req)
    {
        if (string.IsNullOrWhiteSpace(req.kullaniciAdi) || string.IsNullOrWhiteSpace(req.parola))
            throw new AppException(MessageCode.ERROR_400_GECERSIZ_ISTEK, "Kullanıcı adı ve parola gereklidir");

        var user = _userRepo.Get(
            $"(KullaniciAdi = @k OR Email = @k) AND IsDeleted = 0",
            new { k = req.kullaniciAdi });

        if (user == null)
            throw new AppException(MessageCode.ERROR_500_KULLANICI_BULUNAMADI, "Kullanıcı bulunamadı");

        if (!user.AktifMi)
            throw new AppException(MessageCode.ERROR_403_ERISIM_YASAK, "Hesap aktif değil");

        var parolaHash = CryptoHelper.HashParola(req.parola, user.ParolaTuz);
        if (parolaHash != user.ParolaHash)
            throw new AppException(MessageCode.ERROR_500_PAROLA_HATALI, "Parola hatalı");

        return TokenOlusturVeDon(user);
    }

    public KullaniciTokenDTO TokenDogrula(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new AppException(MessageCode.ERROR_500_TOKEN_GECERSIZ, "Token boş");

        // Super token kontrolü (dev/test)
        if (token == CoreConfig.superToken)
            return SuperTokenDon();

        var tokenRecord = _tokenRepo.Get(
            $"Token = @t AND AktifMi = 1 AND IsDeleted = 0",
            new { t = token });

        if (tokenRecord == null)
            throw new AppException(MessageCode.ERROR_500_TOKEN_GECERSIZ, "Token geçersiz");

        if (tokenRecord.TokenExpiry < DateTime.Now)
            throw new AppException(MessageCode.ERROR_500_TOKEN_SURESI_DOLDU, "Token süresi doldu");

        // Token süresini uzat
        tokenRecord.TokenExpiry = DateTime.Now.AddMinutes(
            Convert.ToDouble(CoreConfig.TokenExpAddMin));
        _tokenRepo.Update(tokenRecord);

        var user = _userRepo.Get(tokenRecord.UserId);
        if (user == null)
            throw new AppException(MessageCode.ERROR_500_KULLANICI_BULUNAMADI, "Kullanıcı bulunamadı");

        var dto = _mapper.Map<KullaniciTokenDTO>(user);
        dto.isLogin = true;
        dto.token = token;
        dto.tokenExpiry = tokenRecord.TokenExpiry;
        return dto;
    }

    private LoginResponseDTO TokenOlusturVeDon(t_sis_user user)
    {
        // Eski token'ları pasife çek
        var eskiTokenlar = _tokenRepo.GetList(
            $"UserId = @uid AND AktifMi = 1 AND IsDeleted = 0",
            new { uid = user.Id });
        foreach (var t in eskiTokenlar)
        {
            t.AktifMi = false;
            _tokenRepo.Update(t);
        }

        var tokenStr = CryptoHelper.GenerateToken();
        var token = new t_sis_user_token
        {
            UserId = user.Id,
            TenantId = user.TenantId,
            Token = tokenStr,
            TokenExpiry = DateTime.Now.AddMinutes(
                Convert.ToDouble(CoreConfig.TokenCreateMin)),
            AktifMi = true
        };
        _tokenRepo.Insert(token);

        // Son giriş tarihini güncelle
        user.SonGirisTarih = DateTime.Now;
        _userRepo.Update(user);

        AppLog.Info($"[AuthManager] Login: UserId={user.Id}, IP={HttpContextHelper.GetClientIP()}");

        return new LoginResponseDTO
        {
            kullaniciTokenDto = new KullaniciTokenDTO
            {
                isLogin = true,
                token = tokenStr,
                tokenExpiry = token.TokenExpiry,
                kullaniciDto = _mapper.Map<KullaniciDTO>(user)
            }
        };
    }
}
```

---

## Örnek: FormBuildManager (Form Tasarımı)

```csharp
// Lore.Basvuru.Bal/Managers/Form/FormBuildManager.cs
public interface IFormBuildManager
{
    DatatableResponseDTO<BasvuruFormListDTO> FormListesiGetir(
        DatatableRequestDTO<BasvuruFormListDTO> req);
    BasvuruFormDTO FormGetir(long formId);
    BasvuruFormDTO FormKaydet(BasvuruFormDTO dto);
    void FormSil(long formId);
    void FormYayinla(long formId);
    void FormGeriCek(long formId);
    BasvuruFormDTO FormKopyala(long kaynakFormId);

    BasvuruSayfaDTO SayfaKaydet(BasvuruSayfaDTO dto);
    void SayfaSil(long sayfaId);
    void SayfaSirala(List<SiraDTO> siralar);

    BasvuruSoruDTO SoruKaydet(BasvuruSoruDTO dto);
    void SoruSil(long soruId);
    void SoruSirala(List<SiraDTO> siralar);

    void SecenekKaydet(BasvuruSecenekDTO dto);
    void SecenekSil(long secenekId);

    void KuralKaydet(BasvuruKuralDTO dto);
    void KuralSil(long kuralId);
}

public class FormBuildManager : IFormBuildManager
{
    private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;
    private readonly IGenericRepository<t_frm_sayfa> _sayfaRepo;
    private readonly IGenericRepository<t_frm_soru> _soruRepo;
    private readonly IGenericRepository<t_frm_soru_secenek> _secenekRepo;
    private readonly IGenericRepository<t_frm_kural> _kuralRepo;
    private readonly IMapper _mapper;

    // Constructor injection...

    public BasvuruFormDTO FormGetir(long formId)
    {
        var form = _formRepo.Get(formId);
        if (form == null)
            throw new AppException(404, "Form bulunamadı");

        var tenantId = HttpContextHelper.GetTenantId();
        if (form.TenantId != tenantId)
            throw new AppException(403, "Bu forma erişim yetkiniz yok");

        var dto = _mapper.Map<BasvuruFormDTO>(form);

        // Sayfaları ve soruları getir
        var sayfalar = _sayfaRepo.GetList(
            "BasvuruFormId = @fid AND IsDeleted = 0",
            new { fid = formId },
            OrderOption.asc,
            t_frm_sayfa_properties.SiraNo);

        dto.sayfalar = new List<BasvuruSayfaDTO>();
        foreach (var sayfa in sayfalar)
        {
            var sayfaDto = _mapper.Map<BasvuruSayfaDTO>(sayfa);

            var sorular = _soruRepo.GetList(
                "SayfaId = @sid AND IsDeleted = 0",
                new { sid = sayfa.Id },
                OrderOption.asc,
                t_frm_soru_properties.SiraNo);

            sayfaDto.sorular = new List<BasvuruSoruDTO>();
            foreach (var soru in sorular)
            {
                var soruDto = _mapper.Map<BasvuruSoruDTO>(soru);

                if (soru.KaynakTipi == 1) // Manuel seçenekler
                {
                    var secenekler = _secenekRepo.GetList(
                        "SoruId = @sid AND AktifMi = 1 AND IsDeleted = 0",
                        new { sid = soru.Id },
                        OrderOption.asc,
                        t_frm_soru_secenek_properties.SiraNo);
                    soruDto.secenekler = _mapper.Map<List<BasvuruSecenekDTO>>(secenekler);
                }

                sayfaDto.sorular.Add(soruDto);
            }

            dto.sayfalar.Add(sayfaDto);
        }

        return dto;
    }

    public void FormYayinla(long formId)
    {
        var form = _formRepo.Get(formId);
        if (form == null)
            throw new AppException(404, "Form bulunamadı");

        if (form.Durum == 2)
            throw new AppException(400, "Form zaten yayında");

        // Validasyon: En az 1 sayfa ve 1 soru olmalı
        var sayfaSayisi = _sayfaRepo.Query<int>(
            "SELECT COUNT(*) FROM t_frm_sayfa WHERE BasvuruFormId = @id AND IsDeleted = 0",
            new { id = formId }).FirstOrDefault();

        if (sayfaSayisi == 0)
            throw new AppException(400, "Form yayınlanabilmesi için en az 1 sayfa gerekli");

        form.Durum = 2; // Yayında
        _formRepo.Update(form);

        AppLog.Info($"[FormBuildManager] FormYayinla: FormId={formId}, User={HttpContextHelper.GetUserId()}");
    }
}
```

---

## Örnek: UserBasvuruManager (Başvurucu tarafı)

```csharp
// Lore.Basvuru.Bal/Managers/Form/UserBasvuruManager.cs
public interface IUserBasvuruManager
{
    List<BasvuruFormListDTO> AcikBasvurulariGetir(long tenantId);
    BasvuruOturumDTO BasvuruBaslat(long formId);
    BasvuruOturumDTO SayfaCevaplariniKaydet(SayfaCevapKaydetReqDTO req);
    BasvuruSonucDTO BasvuruTamamla(long userBasvuruId);
    BasvuruDetayDTO BasvuruDetayiGetir(long userBasvuruId);
    void BasvuruIptalEt(long userBasvuruId);
}

public class UserBasvuruManager : IUserBasvuruManager
{
    private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
    private readonly IGenericRepository<t_bsv_cevap> _cevapRepo;
    private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;
    private readonly IGenericRepository<t_lnk_basvuru_link> _linkRepo;
    private readonly IWorkflowManager _workflowManager;
    private readonly IMapper _mapper;

    public BasvuruOturumDTO BasvuruBaslat(long formId)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        var userId = HttpContextHelper.GetUserId();

        // Form kontrol
        var form = _formRepo.Get(formId);
        if (form == null || form.IsDeleted || form.TenantId != tenantId)
            throw new AppException(404, "Başvuru formu bulunamadı");

        if (form.Durum != 2)
            throw new AppException(MessageCode.ERROR_500_FORM_BULUNAMADI, "Bu başvuru şu an aktif değil");

        // Tarih kontrolü
        if (form.BaslamaTarihi.HasValue && form.BaslamaTarihi.Value > DateTime.Now)
            throw new AppException(MessageCode.ERROR_500_BASVURU_SURESI_DOLDU,
                $"Başvuru henüz başlamamış. Başlangıç: {form.BaslamaTarihi:dd.MM.yyyy HH:mm}");

        if (form.BitisTarihi.HasValue && form.BitisTarihi.Value < DateTime.Now)
            throw new AppException(MessageCode.ERROR_500_BASVURU_SURESI_DOLDU,
                "Başvuru süresi dolmuştur");

        // Çoklu başvuru kontrolü
        if (!form.CokluBasvuruIzinliMi)
        {
            var mevcutBasvuru = _basvuruRepo.Get(
                "BasvuruFormId = @fid AND UserId = @uid AND Durum != 6 AND IsDeleted = 0",
                new { fid = formId, uid = userId });

            if (mevcutBasvuru != null)
                throw new AppException(MessageCode.ERROR_500_BASVURU_ZATEN_YAPILDI,
                    "Bu başvuruya daha önce başvurdunuz");
        }

        // Cross-application link kontrolü
        BasvuruLinkKontrolEt(formId, userId, tenantId);

        // Devam eden başvuru var mı?
        var devamdaBasvuru = _basvuruRepo.Get(
            "BasvuruFormId = @fid AND UserId = @uid AND Durum = 1 AND IsDeleted = 0",
            new { fid = formId, uid = userId });

        if (devamdaBasvuru != null)
        {
            // Devam eden başvuruyu döndür
            return BasvuruOturumOlustur(devamdaBasvuru, form);
        }

        // Yeni başvuru oluştur
        var yeniBasvuru = new t_bsv_user_basvuru
        {
            TenantId = tenantId,
            BasvuruFormId = formId,
            UserId = userId,
            Durum = 1, // Devam
            BasvuruTarihi = DateTime.Now
        };
        var basvuruId = _basvuruRepo.Insert(yeniBasvuru);

        yeniBasvuru.Id = basvuruId;
        AppLog.Info($"[UserBasvuruManager] YeniBasvuru: FormId={formId}, UserId={userId}, BasvuruId={basvuruId}");

        return BasvuruOturumOlustur(yeniBasvuru, form);
    }

    private void BasvuruLinkKontrolEt(long formId, long userId, long tenantId)
    {
        var linkler = _linkRepo.GetList(
            "HedefFormId = @fid AND TenantId = @tid AND AktifMi = 1 AND IsDeleted = 0",
            new { fid = formId, tid = tenantId });

        foreach (var link in linkler)
        {
            var kaynakBasvuru = _basvuruRepo.Get(
                "BasvuruFormId = @kfid AND UserId = @uid AND Durum = 2 AND IsDeleted = 0",
                new { kfid = link.KaynakFormId, uid = userId });

            if (link.LinkTipi == 1 && kaynakBasvuru == null)
            {
                // MutlakaBasvurmusOlmali — başvurmamış
                throw new AppException(MessageCode.ERROR_500_BASVURU_LINK_IHLALI,
                    link.AciklamaMetni ?? "Bu başvuruya katılabilmek için önce ilgili başvuruyu tamamlamalısınız");
            }

            if (link.LinkTipi == 2 && kaynakBasvuru != null)
            {
                // BasvurmamisOlmali — başvurmuş
                throw new AppException(MessageCode.ERROR_500_BASVURU_LINK_IHLALI,
                    link.AciklamaMetni ?? "Daha önceki bir başvurunuz nedeniyle bu başvuruya katılamazsınız");
            }
        }
    }

    public BasvuruSonucDTO BasvuruTamamla(long userBasvuruId)
    {
        var userId = HttpContextHelper.GetUserId();
        var basvuru = _basvuruRepo.Get(userBasvuruId);

        if (basvuru == null || basvuru.UserId != userId)
            throw new AppException(403, "Bu başvuruya erişim yetkiniz yok");

        if (basvuru.Durum != 1)
            throw new AppException(400, "Bu başvuru zaten tamamlanmış veya iptal edilmiş");

        // Zorunlu alan kontrolü
        ZorunluAlanlariKontrolEt(basvuru);

        using var scope = _basvuruRepo.BeginTransaction();

        basvuru.Durum = 2; // Tamamlandı
        basvuru.TamamlanmaTarih = DateTime.Now;
        _basvuruRepo.Update(basvuru);

        // Workflow varsa başlat
        var form = _formRepo.Get(basvuru.BasvuruFormId);
        if (form.WorkflowId.HasValue)
        {
            basvuru.Durum = 3; // Onay Bekliyor
            _basvuruRepo.Update(basvuru);
            _workflowManager.WorkflowBaslat(userBasvuruId, form.WorkflowId.Value);
        }

        scope.Complete();

        AppLog.Info($"[UserBasvuruManager] BasvuruTamamla: BasvuruId={userBasvuruId}, UserId={userId}");

        return new BasvuruSonucDTO
        {
            basvuruEid = CryptoHelper.EncryptString(userBasvuruId.ToString()),
            mesaj = "Başvurunuz başarıyla alınmıştır",
            durum = basvuru.Durum
        };
    }
}
```

---

## Örnek: WorkflowManager (Onay Akışı)

```csharp
// Lore.Basvuru.Bal/Managers/Workflow/WorkflowManager.cs
public interface IWorkflowManager
{
    void WorkflowBaslat(long userBasvuruId, long workflowId);
    void AdimIslemYap(WorkflowAdimIslemReqDTO req);
    List<WorkflowAdimDTO> AdimListesiGetir(long workflowId);
    List<BasvuruOnayListDTO> OnayBekleyenlerGetir(
        DatatableRequestDTO<BasvuruOnayFiltrDTO> req);
}

public class WorkflowManager : IWorkflowManager
{
    private readonly IGenericRepository<t_wf_workflow> _wfRepo;
    private readonly IGenericRepository<t_wf_adim> _adimRepo;
    private readonly IGenericRepository<t_wf_adim_rol> _adimRolRepo;
    private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
    private readonly IGenericRepository<t_bsv_wf_adim_durum> _adimDurumRepo;

    public void WorkflowBaslat(long userBasvuruId, long workflowId)
    {
        var ilkAdim = _adimRepo.Get(
            "WorkflowId = @wid AND IlkAdimMi = 1 AND IsDeleted = 0",
            new { wid = workflowId });

        if (ilkAdim == null)
            throw new AppException(500, "Workflow için başlangıç adımı tanımlı değil");

        // İlk adım kaydı oluştur
        var adimDurum = new t_bsv_wf_adim_durum
        {
            TenantId = HttpContextHelper.GetTenantId(),
            UserBasvuruId = userBasvuruId,
            WorkflowAdimId = ilkAdim.Id,
            Durum = 1 // Bekliyor
        };
        _adimDurumRepo.Insert(adimDurum);

        // Başvuruyu aktif adıma bağla
        var basvuru = _basvuruRepo.Get(userBasvuruId);
        basvuru.AktifAdimId = ilkAdim.Id;
        _basvuruRepo.Update(basvuru);
    }

    public void AdimIslemYap(WorkflowAdimIslemReqDTO req)
    {
        // req.islemTipi: 2=Onayla, 3=Reddet, 4=Iade
        var userId = HttpContextHelper.GetUserId();
        var tenantId = HttpContextHelper.GetTenantId();

        // Yetki kontrolü: Bu adımı bu kullanıcı yapabilir mi?
        var adimRol = _adimRolRepo.Query<dynamic>(
            @"SELECT ar.* FROM t_wf_adim_rol ar
              INNER JOIN t_sis_rol_kullanici rk ON rk.RolId = ar.RolId
              WHERE ar.WorkflowAdimId = @adimId AND rk.UserId = @uid
              AND ar.IsDeleted = 0 AND rk.IsDeleted = 0",
            new { adimId = req.adimId, uid = userId });

        if (!adimRol.Any())
            throw new AppException(403, "Bu işlemi yapma yetkiniz yok");

        // Adım durumunu güncelle
        var adimDurum = _adimDurumRepo.Get(
            "UserBasvuruId = @bid AND WorkflowAdimId = @aid AND Durum = 1 AND IsDeleted = 0",
            new { bid = req.userBasvuruId, aid = req.adimId });

        if (adimDurum == null)
            throw new AppException(404, "İşlem yapılacak adım bulunamadı");

        adimDurum.Durum = req.islemTipi;
        adimDurum.IslemYapanId = userId;
        adimDurum.IslemTarihi = DateTime.Now;
        adimDurum.Yorum = req.yorum;
        _adimDurumRepo.Update(adimDurum);

        // Onaylandıysa sonraki adıma geç
        if (req.islemTipi == 2)
            SonrakiAdimGec(req.userBasvuruId, req.adimId, tenantId);
        else if (req.islemTipi == 3)
            BasvuruSonlandir(req.userBasvuruId, 5); // Reddedildi
        else if (req.islemTipi == 4)
            BasvuruSonlandir(req.userBasvuruId, 6); // İade

        AppLog.Info($"[WorkflowManager] Adım İşlem: BasvuruId={req.userBasvuruId}, " +
                    $"AdimId={req.adimId}, IslemTipi={req.islemTipi}, UserId={userId}");
    }

    private void SonrakiAdimGec(long userBasvuruId, long mevcutAdimId, long tenantId)
    {
        var mevcutAdim = _adimRepo.Get(mevcutAdimId);

        if (mevcutAdim.SonAdimMi)
        {
            // Son adım — başvuruyu tamamla
            BasvuruSonlandir(userBasvuruId, 4); // Onaylandı
            return;
        }

        // Sonraki adımı bul (SiraNo'ya göre)
        var sonrakiAdim = _adimRepo.Get(
            "WorkflowId = @wid AND SiraNo > @sira AND IsDeleted = 0",
            new { wid = mevcutAdim.WorkflowId, sira = mevcutAdim.SiraNo },
            OrderOption.asc,
            t_wf_adim_properties.SiraNo);

        if (sonrakiAdim == null)
        {
            BasvuruSonlandir(userBasvuruId, 4);
            return;
        }

        // Sonraki adım için kayıt oluştur
        var yeniAdimDurum = new t_bsv_wf_adim_durum
        {
            TenantId = tenantId,
            UserBasvuruId = userBasvuruId,
            WorkflowAdimId = sonrakiAdim.Id,
            Durum = 1 // Bekliyor
        };
        _adimDurumRepo.Insert(yeniAdimDurum);

        // Başvuruyu güncelle
        var basvuru = _basvuruRepo.Get(userBasvuruId);
        basvuru.AktifAdimId = sonrakiAdim.Id;
        _basvuruRepo.Update(basvuru);
    }
}
```

---

## AutoMapper MappingProfile

```csharp
// Lore.Basvuru.Bal/AutoMapper/MappingProfile.cs
using AutoMapper;
using Lore.Basvuru.Common.DTO.Form.Common;
using Lore.Basvuru.Common.DTO.Security.Auth;
using Lore.Basvuru.Dal.Model;

namespace Lore.Basvuru.Bal.AutoMapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Entity → DTO (id → eid otomatik BaseDTO sayesinde)
            CreateMap<t_frm_basvuru_form, BasvuruFormDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));

            CreateMap<t_frm_sayfa, BasvuruSayfaDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));

            CreateMap<t_frm_soru, BasvuruSoruDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.sayfaEid, o => o.Ignore()); // ayrıca set edilecek

            CreateMap<t_frm_soru_secenek, BasvuruSecenekDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));

            CreateMap<t_sis_user, KullaniciDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.adSoyad, o => o.MapFrom(s => $"{s.Ad} {s.Soyad}"));

            // DTO → Entity (eid → id otomatik BaseDTO sayesinde)
            CreateMap<BasvuruFormDTO, t_frm_basvuru_form>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.CreatedUser, o => o.Ignore())
                .ForMember(d => d.CreatedDate, o => o.Ignore())
                .ForMember(d => d.CreatedIP, o => o.Ignore());

            CreateMap<BasvuruSoruDTO, t_frm_soru>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.CreatedUser, o => o.Ignore())
                .ForMember(d => d.CreatedDate, o => o.Ignore())
                .ForMember(d => d.CreatedIP, o => o.Ignore());
        }
    }
}
```
