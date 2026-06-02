using Dapper;
using DapperExtensions;
using DapperExtensions.Sql;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.Helpers;
using Npgsql;
using System.Data;
using System.Reflection;
using System.Transactions;

namespace Lore.Basvuru.Dal.Repository
{
    public abstract class _BaseRepository<T> where T : class
    {
        private NpgsqlConnection Connection => new NpgsqlConnection(CoreConfig.ConnectionString);

        private static readonly string _tableName;
        private static readonly string _idField;

        static _BaseRepository()
        {
            DapperExtensions.DapperExtensions.SqlDialect = new PostgreSqlDialect();

            var type = typeof(T);
            var tableAttr = type.GetCustomAttributes(false)
                .FirstOrDefault(a => a.GetType().Name == "TableAttribute");
            _tableName = tableAttr != null
                ? (string)(tableAttr.GetType().GetProperty("Value")?.GetValue(tableAttr) ?? type.Name)
                : type.Name;

            _idField = CoreConfig.IDProperty ?? "Id";
        }

        // ── OKUMA ─────────────────────────────────────────────

        public T? Get(long id)
        {
            using var conn = Connection;
            return conn.Get<T>(id);
        }

        public T? Get(string whereQuery, object? param = null,
                      OrderOption orderOption = OrderOption.asc, params Enum[] orderProp)
        {
            var sql = BuildSelect(whereQuery, orderOption, orderProp) + " LIMIT 1";
            using var conn = Connection;
            return conn.QueryFirstOrDefault<T>(sql, param);
        }

        public List<T> GetList()
        {
            using var conn = Connection;
            var sql = $"SELECT * FROM \"{_tableName}\" WHERE \"{CoreConfig.IsDeletedProperty}\" = FALSE";
            return conn.Query<T>(sql).ToList();
        }

        public List<T> GetList(string whereQuery, object? param = null,
                               OrderOption orderOption = OrderOption.asc, params Enum[] orderProp)
        {
            var sql = BuildSelect(whereQuery, orderOption, orderProp);
            using var conn = Connection;
            return conn.Query<T>(sql, param).ToList();
        }

        public List<T> GetListWithPagination(int pageNumber, int itemsPerPage,
                                              string? whereQuery = null, object? param = null)
        {
            var where = string.IsNullOrWhiteSpace(whereQuery)
                ? $"\"{CoreConfig.IsDeletedProperty}\" = FALSE"
                : whereQuery;
            var offset = (pageNumber - 1) * itemsPerPage;
            var sql = $"SELECT * FROM \"{_tableName}\" WHERE {where} LIMIT {itemsPerPage} OFFSET {offset}";
            using var conn = Connection;
            return conn.Query<T>(sql, param).ToList();
        }

        public long Count(string? whereQuery = null, object? param = null)
        {
            var where = string.IsNullOrWhiteSpace(whereQuery)
                ? $"\"{CoreConfig.IsDeletedProperty}\" = FALSE"
                : whereQuery;
            var sql = $"SELECT COUNT(*) FROM \"{_tableName}\" WHERE {where}";
            using var conn = Connection;
            return conn.ExecuteScalar<long>(sql, param);
        }

        public List<dynamic> QueryDyn(string sql, object? param = null)
        {
            using var conn = Connection;
            return conn.Query(sql, param).ToList();
        }

        public List<T1> Query<T1>(string sql, object? param = null)
        {
            using var conn = Connection;
            return conn.Query<T1>(sql, param).ToList();
        }

        // ── YAZMA ─────────────────────────────────────────────

        public long Insert(T entity)
        {
            SetCreatedFields(entity);
            SetDeletedFalse(entity);
            using var conn = Connection;
            // PostgreSQL için RETURNING "Id" ile ID alınır
            var props = typeof(T).GetProperties()
                .Where(p => p.Name != _idField
                         && !IsComputed(p)
                         && p.CanRead && p.CanWrite)
                .ToList();

            var cols = string.Join(", ", props.Select(p => $"\"{p.Name}\""));
            var vals = string.Join(", ", props.Select(p => $"@{p.Name}"));
            var sql = $"INSERT INTO \"{_tableName}\" ({cols}) VALUES ({vals}) RETURNING \"{_idField}\"";

            var id = conn.ExecuteScalar<long>(sql, entity);
            typeof(T).GetProperty(_idField)?.SetValue(entity, id);
            return id;
        }

        public void InsertAll(List<T> list)
        {
            if (!list.Any()) return;
            using var conn = Connection;
            conn.Open();
            using var tx = conn.BeginTransaction();
            try
            {
                foreach (var entity in list)
                {
                    SetCreatedFields(entity);
                    SetDeletedFalse(entity);
                    var props = typeof(T).GetProperties()
                        .Where(p => p.Name != _idField && !IsComputed(p) && p.CanRead && p.CanWrite)
                        .ToList();
                    var cols = string.Join(", ", props.Select(p => $"\"{p.Name}\""));
                    var vals = string.Join(", ", props.Select(p => $"@{p.Name}"));
                    var sql = $"INSERT INTO \"{_tableName}\" ({cols}) VALUES ({vals}) RETURNING \"{_idField}\"";
                    var id = conn.ExecuteScalar<long>(sql, entity, tx);
                    typeof(T).GetProperty(_idField)?.SetValue(entity, id);
                }
                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public bool Update(T entity)
        {
            SetModifiedFields(entity);
            using var conn = Connection;
            var props = typeof(T).GetProperties()
                .Where(p => p.Name != _idField
                         && !IsCreatedField(p.Name)
                         && !IsComputed(p)
                         && p.CanRead && p.CanWrite)
                .ToList();
            var sets = string.Join(", ", props.Select(p => $"\"{p.Name}\" = @{p.Name}"));
            var sql = $"UPDATE \"{_tableName}\" SET {sets} WHERE \"{_idField}\" = @{_idField}";
            var rows = conn.Execute(sql, entity);
            return rows > 0;
        }

        public void UpdateAll(List<T> list)
        {
            if (!list.Any()) return;
            using var conn = Connection;
            conn.Open();
            using var tx = conn.BeginTransaction();
            try
            {
                foreach (var entity in list) Update(entity);
                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public int UpdateSqlToplu(string sql, object? parameters = null)
        {
            using var conn = Connection;
            return conn.Execute(sql, parameters);
        }

        public bool Delete(T entity)
        {
            var idProp = typeof(T).GetProperty(_idField);
            if (idProp == null) return false;
            var id = idProp.GetValue(entity);

            SetModifiedFields(entity);
            var sql = $"UPDATE \"{_tableName}\" SET \"{CoreConfig.IsDeletedProperty}\" = TRUE, " +
                      $"\"{CoreConfig.ModifiedUserProperty}\" = @mu, " +
                      $"\"{CoreConfig.ModifiedDateProperty}\" = @md, " +
                      $"\"{CoreConfig.ModifiedIpAdressProperty}\" = @mip " +
                      $"WHERE \"{_idField}\" = @id";
            using var conn = Connection;
            var rows = conn.Execute(sql, new
            {
                mu = HttpContextHelper.GetUserId(),
                md = DateTime.Now,
                mip = HttpContextHelper.GetClientIP(),
                id
            });
            return rows > 0;
        }

        public bool DeleteAll(List<long> ids)
        {
            if (!ids.Any()) return false;
            var sql = $"UPDATE \"{_tableName}\" SET \"{CoreConfig.IsDeletedProperty}\" = TRUE, " +
                      $"\"{CoreConfig.ModifiedUserProperty}\" = @mu, " +
                      $"\"{CoreConfig.ModifiedDateProperty}\" = @md, " +
                      $"\"{CoreConfig.ModifiedIpAdressProperty}\" = @mip " +
                      $"WHERE \"{_idField}\" = ANY(@ids)";
            using var conn = Connection;
            conn.Execute(sql, new
            {
                mu = HttpContextHelper.GetUserId(),
                md = DateTime.Now,
                mip = HttpContextHelper.GetClientIP(),
                ids = ids.ToArray()
            });
            return true;
        }

        public bool Save(T entity)
        {
            var idProp = typeof(T).GetProperty(_idField);
            var idVal = idProp != null ? (long)(idProp.GetValue(entity) ?? 0L) : 0L;
            if (idVal > 0)
                return Update(entity);
            Insert(entity);
            return true;
        }

        public TransactionScope BeginTransaction()
        {
            return new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
        }

        // ── YARDIMCI METODLAR ─────────────────────────────────

        private string BuildSelect(string whereQuery, OrderOption orderOption, Enum[] orderProp)
        {
            var order = orderProp.Length > 0
                ? $" ORDER BY \"{string.Join("\", \"", orderProp.Select(p => p.ToString()))}\" {orderOption.ToString().ToUpper()}"
                : string.Empty;
            return $"SELECT * FROM \"{_tableName}\" WHERE {whereQuery}{order}";
        }

        private void SetCreatedFields(T entity)
        {
            var type = typeof(T);
            var userId = HttpContextHelper.GetUserId();
            var ip = HttpContextHelper.GetClientIP();
            var now = DateTime.Now;

            SetPropIfExists(type, entity, CoreConfig.CreatedUserProperty, userId);
            SetPropIfExists(type, entity, CoreConfig.CreatedDateProperty, now);
            SetPropIfExists(type, entity, CoreConfig.CreatedIpAdressProperty, ip);
            // Bazı tablolarda CreatedIP (farklı isim)
            SetPropIfExists(type, entity, "CreatedIP", ip);
            SetPropIfExists(type, entity, "CreatedIpAdress", ip);
        }

        private void SetModifiedFields(T entity)
        {
            var type = typeof(T);
            var userId = HttpContextHelper.GetUserId();
            var ip = HttpContextHelper.GetClientIP();
            var now = DateTime.Now;

            SetPropIfExists(type, entity, CoreConfig.ModifiedUserProperty, userId);
            SetPropIfExists(type, entity, CoreConfig.ModifiedDateProperty, now);
            SetPropIfExists(type, entity, CoreConfig.ModifiedIpAdressProperty, ip);
            SetPropIfExists(type, entity, "ModifiedIP", ip);
            SetPropIfExists(type, entity, "ModifiedIpAdress", ip);
        }

        private void SetDeletedFalse(T entity)
        {
            SetPropIfExists(typeof(T), entity, CoreConfig.IsDeletedProperty, false);
        }

        private static void SetPropIfExists(Type type, T entity, string propName, object? value)
        {
            var prop = type.GetProperty(propName);
            if (prop != null && prop.CanWrite)
            {
                var current = prop.GetValue(entity);
                // Sadece default/null değerleri set et (override etme)
                if (current == null ||
                    (current is long l && l == 0 && propName.Contains("User")) ||
                    (current is DateTime dt && dt == default) ||
                    (current is string s && string.IsNullOrEmpty(s) && propName.Contains("IP") || propName.Contains("Ip")))
                {
                    try { prop.SetValue(entity, Convert.ChangeType(value, prop.PropertyType)); } catch { }
                }
            }
        }

        private static bool IsComputed(PropertyInfo p)
        {
            return p.GetCustomAttributes(typeof(Dapper.Contrib.Extensions.ComputedAttribute), false).Any();
        }

        private static bool IsCreatedField(string name)
        {
            return name == CoreConfig.CreatedUserProperty
                || name == CoreConfig.CreatedDateProperty
                || name == CoreConfig.CreatedIpAdressProperty
                || name == "CreatedIP"
                || name == "CreatedDate"
                || name == "CreatedUser"
                || name == "CreatedIpAdress";
        }
    }
}
