import AdminSalesSummary from '../../components/admin/AdminSalesSummary'

export default function AdminSales() {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h2>매출 관리</h2>
          <p>지난달과 이번 달 매출, 다음 달 예상 매출을 확인하세요.</p>
        </div>
      </div>

      <AdminSalesSummary />
    </>
  )
}