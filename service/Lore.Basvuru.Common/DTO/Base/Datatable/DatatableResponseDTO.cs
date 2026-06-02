namespace Lore.Basvuru.Common.DTO.Base.Datatable
{
    public class DatatableResponseDTO<T>
    {
        public List<T> data { get; set; } = new();
        public int totalRecords { get; set; }
        public int pageNumber { get; set; }
        public int pageSize { get; set; }
        public int totalPages => pageSize > 0 ? (int)Math.Ceiling((double)totalRecords / pageSize) : 0;
    }
}
