namespace Lore.Basvuru.Dal.Repository
{
    public class GenericRepository<T> : _BaseRepository<T>, IGenericRepository<T>
        where T : class
    {
        public GenericRepository() : base() { }
    }
}
