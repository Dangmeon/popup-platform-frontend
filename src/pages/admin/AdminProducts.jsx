import { useEffect, useState } from 'react'
import {
  getProducts,
  getProduct,
} from '../../api/admin/productApi'
import './AdminProducts.css'

// 나중에 확인할 부분: 서버의 판매 상태값과 일치시키기
const saleStatuses = {
  ON_SALE: '판매 중',
  SOLD_OUT: '품절',
  ENDED: '판매 종료',
}

// 금액 표시
function formatPrice(value) {
  return `${value.toLocaleString('ko-KR')}원`
}

// 날짜 표시
function formatDateTime(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 재고 안내
function getStockNotice(stock) {
  if (stock === 0) return '재고 없음'
  if (stock < 3) return '재고 부족'
  return ''
}

function AdminProducts() {
  // 상품 목록
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [saleStatus, setSaleStatus] = useState('')

  // 상품 상세
  const [selectedId, setSelectedId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // 재조회
  const [listRetryKey, setListRetryKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)

  // 상품 목록 조회
  useEffect(() => {
    let active = true

    async function loadProducts() {
      setListLoading(true)
      setListError('')

      try {
        const response = await getProducts({ keyword, saleStatus })

        if (!active) return

        setProducts(response.items)
        setTotal(response.total)
        setTotalAll(response.totalAll)
      } catch (error) {
        if (!active) return

        setProducts([])
        setTotal(0)
        setTotalAll(0)
        setListError(
          error.message || '상품 목록을 불러오지 못했습니다.'
        )
      } finally {
        if (active) setListLoading(false)
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [keyword, saleStatus, listRetryKey])

  // 상품 상세 조회
  useEffect(() => {
    let active = true

    async function loadProduct() {
      setSelectedProduct(null)
      setDetailError('')

      if (selectedId === null) {
        setDetailLoading(false)
        return
      }

      setDetailLoading(true)

      try {
        const response = await getProduct(selectedId)

        if (active) setSelectedProduct(response)
      } catch (error) {
        if (active) {
          setDetailError(
            error.message || '상품 상세 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    }

    loadProduct()

    return () => {
      active = false
    }
  }, [selectedId, detailRetryKey])

  // 필터 초기화
  function handleReset() {
    setKeyword('')
    setSaleStatus('')
  }

  return (
    <div className="admin-products">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>굿즈 관리</h2>
          <p>상품의 판매 상태와 온라인 재고를 확인하세요.</p>
        </div>

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}
      <p className="product-admin-demo">
        가상 상품을 사용하는 조회 화면입니다.
        판매 상태는 고정된 예시이며 실제 서버와 연결되지 않습니다.
        모든 상품은 한정판이며 재고는 온라인 판매 재고입니다.
      </p>

      {/* 검색 및 필터 */}
      <section className="admin-panel" aria-label="상품 검색">
        <div className="product-admin-filters">
          <label>
            상품명 / 팝업명
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="상품명 또는 팝업명 입력"
            />
          </label>

          <label>
            판매 상태
            <select
              value={saleStatus}
              onChange={(event) => setSaleStatus(event.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(saleStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="product-admin-button"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>
      </section>

      {/* 상품 목록 */}
      <section
        className="admin-panel product-admin-list"
        aria-busy={listLoading}
      >
        <div className="admin-panel-header">
          <h3>상품 목록</h3>
          {!listLoading && !listError && (
            <span>
              검색 {total}개 / 전체 {totalAll}개
            </span>
          )}
        </div>

        {listLoading && (
          <p role="status">상품 목록을 불러오는 중입니다.</p>
        )}

        {listError && (
          <div>
            <p role="alert">{listError}</p>
            <button
              type="button"
              className="product-admin-button"
              onClick={() =>
                setListRetryKey((previous) => previous + 1)
              }
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!listLoading && !listError && (
          <div className="admin-table-wrapper">
            <table className="admin-table product-admin-table">
              <caption className="product-admin-sr-only">
                상품 검색 결과
              </caption>

              <thead>
                <tr>
                  <th scope="col">상품번호</th>
                  <th scope="col">상품명</th>
                  <th scope="col">팝업명</th>
                  <th scope="col">가격</th>
                  <th scope="col">재고</th>
                  <th scope="col">판매 상태</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.prdId}>
                    <td>{product.prdId}</td>
                    <td>{product.productName}</td>
                    <td>{product.popupName}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      {product.stock}개
                      {getStockNotice(product.stock) && (
                        <span className="product-admin-stock-warning">
                          {getStockNotice(product.stock)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`product-admin-status ${product.saleStatus.toLowerCase()}`}
                      >
                        {saleStatuses[product.saleStatus] ||
                          product.saleStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="product-admin-button"
                        aria-label={`${product.productName} 상세 보기`}
                        aria-expanded={selectedId === product.prdId}
                        aria-controls="product-admin-detail"
                        onClick={() => setSelectedId(product.prdId)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="product-admin-empty">
                      검색 조건에 맞는 상품이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 상품 상세 */}
      <div id="product-admin-detail">
        {selectedId !== null && (
          <section
            className="admin-panel product-admin-detail"
            aria-labelledby="product-admin-detail-title"
            aria-busy={detailLoading}
          >
            <div className="admin-panel-header">
              <h3 id="product-admin-detail-title">상품 상세</h3>
              <button
                type="button"
                className="product-admin-button"
                onClick={() => setSelectedId(null)}
              >
                닫기
              </button>
            </div>

            {detailLoading && (
              <p role="status">상품 정보를 불러오는 중입니다.</p>
            )}

            {detailError && (
              <div>
                <p role="alert">{detailError}</p>
                <button
                  type="button"
                  className="product-admin-button"
                  onClick={() =>
                    setDetailRetryKey((previous) => previous + 1)
                  }
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!detailLoading && !detailError && selectedProduct && (
              <>
                <dl className="product-admin-info">
                  <div>
                    <dt>상품번호</dt>
                    <dd>{selectedProduct.prdId}</dd>
                  </div>
                  <div>
                    <dt>상품명</dt>
                    <dd>{selectedProduct.productName}</dd>
                  </div>
                  <div>
                    <dt>팝업명</dt>
                    <dd>{selectedProduct.popupName}</dd>
                  </div>
                  <div>
                    <dt>가격</dt>
                    <dd>{formatPrice(selectedProduct.price)}</dd>
                  </div>
                  <div>
                    <dt>온라인 재고</dt>
                    <dd>{selectedProduct.stock}개</dd>
                  </div>
                  <div>
                    <dt>회원 누적 구매 제한</dt>
                    <dd>{selectedProduct.maxQty}개</dd>
                  </div>
                  <div>
                    <dt>판매 상태</dt>
                    <dd>
                      {saleStatuses[selectedProduct.saleStatus] ||
                        selectedProduct.saleStatus}
                    </dd>
                  </div>
                  <div>
                    <dt>판매 시작일시</dt>
                    <dd>{formatDateTime(selectedProduct.saleStart)}</dd>
                  </div>
                  <div>
                    <dt>판매 종료일시</dt>
                    <dd>{formatDateTime(selectedProduct.saleEnd)}</dd>
                  </div>
                  <div>
                    <dt>상품 설명</dt>
                    <dd>{selectedProduct.description || '-'}</dd>
                  </div>
                </dl>

                <p className="product-admin-help">
                  구매 제한은 회원의 누적 구매 수량 기준입니다.
                  재고 선점과 구매 대기열 권한 검증은 실제 주문 API에서
                  처리해야 합니다.
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminProducts