namespace Lore.Basvuru.Dal.Repository
{
    public interface IGenericRepository<T> where T : class
    {
        T? Get(long id);
        T? Get(string whereQuery, object? param = null, OrderOption orderOption = OrderOption.asc, params Enum[] orderProp);
        List<T> GetList();
        List<T> GetList(string whereQuery, object? param = null, OrderOption orderOption = OrderOption.asc, params Enum[] orderProp);
        List<T> GetListWithPagination(int pageNumber, int itemsPerPage, string? whereQuery = null, object? param = null);
        long Count(string? whereQuery = null, object? param = null);
        List<dynamic> QueryDyn(string sql, object? param = null);
        List<T1> Query<T1>(string sql, object? param = null);
        long Insert(T entity);
        void InsertAll(List<T> list);
        bool Update(T entity);
        void UpdateAll(List<T> list);
        int UpdateSqlToplu(string sql, object? parameters = null);
        bool Delete(T entity);
        bool DeleteAll(List<long> ids);
        bool Save(T entity);
        System.Transactions.TransactionScope BeginTransaction();
    }

    public enum OrderOption { asc, desc }
}
