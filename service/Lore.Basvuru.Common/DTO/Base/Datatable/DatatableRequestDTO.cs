namespace Lore.Basvuru.Common.DTO.Base.Datatable
{
    public class DatatableRequestDTO
    {
        public int pageNumber { get; set; } = 1;
        public int pageSize { get; set; } = 10;
        public string? sortField { get; set; }
        public string sortOrder { get; set; } = "asc";
    }

    public class DatatableRequestDTO<T> : DatatableRequestDTO
    {
        public T? filter { get; set; }
    }
}
