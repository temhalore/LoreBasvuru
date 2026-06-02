# 05 — Repository Katmanı

## _BaseRepository<T>

Referans projeden alınmış, doğrudan kullanılacak base repository. Aşağıdaki metodları içerir:
- `Get(long id)` — ID ile tek kayıt
- `Get(string where, object param)` — where clause ile tek kayıt
- `GetList()` — Tüm liste (IsDeleted filtreli)
- `GetList(string where, object param)` — Filtrelenmiş liste
- `GetListWithPagination(pageNumber, itemsPerPage)` — Sayfalı liste
- `Query<T1>(string sql, object param)` — Typed custom SQL
- `QueryDyn(string sql, object param)` — Dynamic custom SQL
- `Insert(T entity)` — Ekle, ID döner; CreatedUser/Date/IP otomatik set edilir
- `InsertAll(List<T>)` — Toplu ekle (batch)
- `Update(T entity)` — Güncelle; ModifiedUser/Date/IP otomatik; CreatedX alanları güncellenmez
- `UpdateAll(List<T>)` — Toplu güncelle (batch)
- `UpdateSqlToplu(string sql, object params)` — Custom UPDATE SQL
- `Delete(T entity)` — Soft delete (IsDeleted=1)
- `DeleteAll(List<long> ids)` — Batch soft delete
- `Save(T entity)` — id > 0 ise Update, değilse Insert
- `Count()` — Kayıt sayısı
- `BeginTransaction()` — TransactionScope

```csharp
// Lore.Basvuru.Dal/Repository/_BaseRepository.cs
// Referans projedeki ile AYNI implementasyon
// Sadece namespace ve using'ler değişiyor
using Dapper;
using DapperExtensions;
using DapperExtensions.Sql;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.Helpers;
using System.Data;
using System.Data.SqlClient;    // SQL Server için
// NOT: PostgreSQL için Npgsql.Dapper kullanılır
using System.Transactions;

namespace Lore.Basvuru.Dal.Repository
{
    public abstract class _BaseRepository<T> where T : class
    {
        private SqlConnection Connection => new SqlConnection(_constr);

        static Type type;
        static string _tableName;

        static _BaseRepository()
        {
            // SQL Server dialect (PostgreSQL için değiştir)
            DapperExtensions.DapperExtensions.SqlDialect = new SqlServerDialect();
            type = typeof(T);
            _tableName = type.CustomAttributes
                .Where(x => x.AttributeType.Name == "TableAttribute")
                .FirstOrDefault()
                .ConstructorArguments.FirstOrDefault().Value.ToString();
        }

        private readonly string _constr = CoreConfig.ConnectionString;
        private readonly string _idField = CoreConfig.IDProperty;
        private readonly string _createdDateField = CoreConfig.CreatedDateProperty;
        private readonly string _createdUserField = CoreConfig.CreatedUserProperty;
        private readonly string _createdIpField = CoreConfig.CreatedIpAdressProperty;
        private readonly string _modifiedDateField = CoreConfig.ModifiedDateProperty;
        private readonly string _modifiedUserField = CoreConfig.ModifiedUserProperty;
        private readonly string _modifiedIpField = CoreConfig.ModifiedIpAdressProperty;
        private readonly string _isDeletedField = CoreConfig.IsDeletedProperty;

        // ... (referans projedeki implementasyonun aynısı)
        // Tüm metodlar Lore.Basvuru.Common.Helpers.HttpContextHelper.GetUserId() ve GetClientIP() kullanır
    }

    public enum OrderOption { asc, desc }
}
```

---

## IGenericRepository<T>

```csharp
// Lore.Basvuru.Dal/Repository/IGenericRepository.cs
namespace Lore.Basvuru.Dal.Repository
{
    public interface IGenericRepository<T> where T : class
    {
        T Get(long id);
        T Get(string whereQuery, object param = null,
              OrderOption orderOption = OrderOption.asc, params Enum[] orderProp);
        List<T> GetList();
        List<T> GetList(string whereQuery, object param = null,
                        OrderOption orderOption = OrderOption.asc, params Enum[] orderProp);
        List<T> GetListWithPagination(int pageNumber, int itemsPerPage);
        long Count();
        List<dynamic> QueryDyn(string sql, object param);
        List<T1> Query<T1>(string sql, object param);
        long Insert(T entity);
        void InsertAll(List<T> list);
        bool Update(T entity);
        void UpdateAll(List<T> list);
        int UpdateSqlToplu(string sql, object parameters = null);
        bool Delete(T entity);
        bool DeleteAll(List<long> ids);
        bool Save(T entity);
        System.Transactions.TransactionScope BeginTransaction();
    }
}
```

---

## GenericRepository<T>

```csharp
// Lore.Basvuru.Dal/Repository/GenericRepository.cs
namespace Lore.Basvuru.Dal.Repository
{
    public class GenericRepository<T> : _BaseRepository<T>, IGenericRepository<T>
        where T : class
    {
        public GenericRepository() : base() { }
    }
}
```

---

## PostgreSQL Desteği

`CoreConfig.SqlDialect == "PostgreSql"` ise `_BaseRepository` static constructor'ında:

```csharp
static _BaseRepository()
{
    if (CoreConfig.SqlDialect == "PostgreSql")
        DapperExtensions.DapperExtensions.SqlDialect = new PostgreSqlDialect();
    else
        DapperExtensions.DapperExtensions.SqlDialect = new SqlServerDialect();
    // ...
}
```

Connection için PostgreSQL:
```csharp
private NpgsqlConnection Connection => new NpgsqlConnection(_constr);
```

---

## Manager'da Repository Kullanım Örneği

```csharp
public class FormBuildManager : IFormBuildManager
{
    private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;
    private readonly IGenericRepository<t_frm_sayfa> _sayfaRepo;
    private readonly IGenericRepository<t_frm_soru> _soruRepo;
    private readonly IMapper _mapper;

    public FormBuildManager(
        IGenericRepository<t_frm_basvuru_form> formRepo,
        IGenericRepository<t_frm_sayfa> sayfaRepo,
        IGenericRepository<t_frm_soru> soruRepo,
        IMapper mapper)
    {
        _formRepo = formRepo;
        _sayfaRepo = sayfaRepo;
        _soruRepo = soruRepo;
        _mapper = mapper;
    }

    // --- Örnek: Form listesi getir ---
    public DatatableResponseDTO<BasvuruFormListDTO> FormListesiGetir(
        DatatableRequestDTO<BasvuruFormListDTO> request, long tenantId)
    {
        var sql = @"
            SELECT f.Id, f.Ad, f.Durum, f.BaslamaTarihi, f.BitisTarihi,
                   f.CreatedDate,
                   (SELECT COUNT(*) FROM t_bsv_user_basvuru b
                    WHERE b.BasvuruFormId = f.Id AND b.IsDeleted = 0) AS BasvuruSayisi
            FROM t_frm_basvuru_form f
            WHERE f.TenantId = @tenantId AND f.IsDeleted = 0
            ORDER BY f.CreatedDate DESC
            OFFSET (@pageNumber - 1) * @pageSize ROWS FETCH NEXT @pageSize ROWS ONLY";

        var countSql = @"
            SELECT COUNT(*) FROM t_frm_basvuru_form
            WHERE TenantId = @tenantId AND IsDeleted = 0";

        var param = new { tenantId, pageNumber = request.pageNumber, pageSize = request.pageSize };

        var data = _formRepo.Query<BasvuruFormListDTO>(sql, param);
        var total = _formRepo.Query<int>(countSql, new { tenantId }).FirstOrDefault();

        // EID mapping
        foreach (var item in data)
        {
            item.id = item.rawId; // mapper veya manuel
        }

        return new DatatableResponseDTO<BasvuruFormListDTO>
        {
            data = data,
            totalRecords = total,
            pageNumber = request.pageNumber,
            pageSize = request.pageSize
        };
    }

    // --- Örnek: Form kaydet ---
    public BasvuruFormDTO FormKaydet(BasvuruFormDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ad))
            throw new AppException(400, "Form adı boş olamaz");

        var entity = _mapper.Map<t_frm_basvuru_form>(dto);
        entity.TenantId = HttpContextHelper.GetTenantId(); // SecurityFilter'dan set edildi

        if (dto.id > 0)
        {
            // Güncelleme — Entity'yi DB'den al, sonra güncelle (CreatedX korunur)
            var existing = _formRepo.Get(dto.id);
            if (existing == null || existing.TenantId != entity.TenantId)
                throw new AppException(404, "Form bulunamadı");

            entity.Id = dto.id;
            _formRepo.Update(entity);
        }
        else
        {
            // Yeni kayıt
            entity.Durum = 1; // Taslak
            var newId = _formRepo.Insert(entity);
            dto.id = newId;
        }

        AppLog.Info($"[FormBuildManager] FormKaydet: FormId={dto.id}, User={HttpContextHelper.GetUserId()}");
        return dto;
    }

    // --- Örnek: Transaction ile çok tablolu işlem ---
    public void FormKopyala(long kaynakFormId, long tenantId)
    {
        using var scope = _formRepo.BeginTransaction();

        var kaynakForm = _formRepo.Get(kaynakFormId);
        if (kaynakForm == null)
            throw new AppException(404, "Kopyalanacak form bulunamadı");

        // Form kopyala
        kaynakForm.Id = 0;
        kaynakForm.Ad = $"{kaynakForm.Ad} (Kopya)";
        kaynakForm.Durum = 1; // Taslak
        kaynakForm.KopyalandiFormId = kaynakFormId;
        var yeniFormId = _formRepo.Insert(kaynakForm);

        // Sayfaları kopyala
        var sayfalar = _sayfaRepo.GetList(
            $"BasvuruFormId = @id AND IsDeleted = 0",
            new { id = kaynakFormId });

        foreach (var sayfa in sayfalar)
        {
            var eskiSayfaId = sayfa.Id;
            sayfa.Id = 0;
            sayfa.BasvuruFormId = yeniFormId;
            var yeniSayfaId = _sayfaRepo.Insert(sayfa);

            // Soruları kopyala
            var sorular = _soruRepo.GetList(
                $"SayfaId = @sid AND IsDeleted = 0",
                new { sid = eskiSayfaId });
            foreach (var soru in sorular)
            {
                soru.Id = 0;
                soru.SayfaId = yeniSayfaId;
                soru.BasvuruFormId = yeniFormId;
                _soruRepo.Insert(soru);
            }
        }

        scope.Complete(); // Transaction commit
        AppLog.Info($"[FormBuildManager] FormKopyala: KaynakId={kaynakFormId} → YeniId={yeniFormId}");
    }
}
```

---

## HttpContextHelper

```csharp
// Lore.Basvuru.Common/Helpers/HttpContextHelper.cs
// Referans projeden birebir alınır
// Repository'ler bu static class üzerinden UserId ve IP alır

namespace Lore.Basvuru.Common.Helpers
{
    public static class HttpContextHelper
    {
        private static IHttpContextAccessor _httpContextAccessor;

        public static void Configure(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public static long GetUserId()
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return 0;

            if (context.Items.TryGetValue("UserId", out var userId))
                return Convert.ToInt64(userId);

            return 0;
        }

        public static string GetClientIP()
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return string.Empty;

            if (context.Items.TryGetValue("ClientIP", out var ip))
                return ip?.ToString() ?? string.Empty;

            return context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        }

        public static long GetTenantId()
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return 0;

            if (context.Items.TryGetValue("TenantId", out var tenantId))
                return Convert.ToInt64(tenantId);

            return 0;
        }

        public static void SetUserInfo(long userId, string ip, long tenantId)
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return;

            context.Items["UserId"] = userId;
            context.Items["ClientIP"] = ip;
            context.Items["TenantId"] = tenantId;
        }
    }
}
```
