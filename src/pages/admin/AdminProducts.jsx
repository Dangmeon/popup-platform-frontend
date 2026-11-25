import AdminDetailModal from '../../components/admin/AdminDetailModal.jsx'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getProducts,
  getProduct,
  deleteProduct,
  addProductStock,
} from '../../api/admin/productApi'
import AdminProductForm from '../../components/admin/AdminProductForm'
import './AdminProducts.css'

// 나중에 확인할 부분: 서버의 판매 상태값과 일치시키기
const saleStatuses = {
  ON_SALE: '판매 중',
  UPCOMING: '판매 예정',
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
  if (stock <= 5) return '재고 부족'
  return ''
}

function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const lowStockOnly = searchParams.get('stock') === 'low'
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
  const [stockQuantity, setStockQuantity] = useState('')
  const [stockBusy, setStockBusy] = useState(false)
  const [stockMessage, setStockMessage] = useState('')
  const [stockError, setStockError] = useState('')
  const stockLock = useRef(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // 상품 등록
  const [editing, setEditing] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [notice, setNotice] = useState('')

  // 재조회
  const [listRetryKey, setListRetryKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)

  useEffect(() => {
    setEditing(false)
    setStockQuantity('')
    setStockError('')
    setStockMessage('')
  }, [selectedId])

  // 입고 수량 저장
  async function handleAddStock(event) {
    event.preventDefault()
    if (stockLock.current) return
    const quantity = Number(stockQuantity)
    if (!stockQuantity.trim() || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647) {
      setStockError('입고 수량은 1개 이상의 정수로 입력해 주세요.')
      return
    }
    stockLock.current = true
    setStockBusy(true)
    setStockError('')
    setStockMessage('')
    try {
      const updated = await addProductStock(selectedId, quantity)
      setSelectedProduct(previous => ({...previous, ...updated, popupName: previous.popupName, description: updated.productDesc || previous.description}))
      setStockMessage(`재고 ${quantity.toLocaleString()}개가 추가되었습니다.`)
      setStockQuantity('')
      setListRetryKey(previous => previous + 1)
    } catch (error) {
      setStockError(error.response?.data?.message || '재고 추가 결과를 확인하지 못했습니다. 상품 정보를 다시 조회한 뒤 재고를 확인해 주세요.')
    } finally {
      stockLock.current = false
      setStockBusy(false)
    }
  }

  // 상품 삭제 확인 및 목록 갱신
  async function handleDelete() {
    if (stockLock.current || !window.confirm('이 상품을 삭제하시겠습니까?')) return
    stockLock.current = true
    setStockBusy(true)
    try {
      await deleteProduct(selectedId)
      setSelectedId(null)
      setListRetryKey(value => value + 1)
    } catch (error) {
      setStockError(error.response?.data?.message || '상품을 삭제하지 못했습니다.')
    } finally {
      stockLock.current = false
      setStockBusy(false)
    }
  }

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

  function changeStockSection(low) {
    const next = new URLSearchParams(searchParams)
    if (low) next.set('stock', 'low')
    else next.delete('stock')
    setSearchParams(next)
    handleReset()
  }

  const visibleProducts = lowStockOnly
    ? products.filter(product => Number.isFinite(product.stock) && product.stock >= 0 && product.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
    : products

  // 등록 화면 열기
  function handleOpenCreate() {
    setNotice('')
    setShowCreateForm(true)
  }

  // 등록 성공
  function handleCreateSuccess(product) {
    setShowCreateForm(false)
    setKeyword('')
    setSaleStatus('')
    setSelectedProduct(null)
    setSelectedId(product.prdId)
    setListRetryKey((previous) => previous + 1)

    setNotice(
      `${product.productName} 상품이 등록되었습니다.`
    )
  }

  // 상세 정보 표시
  const detailRows = selectedProduct
    ? [
        ['상품번호', selectedProduct.prdId],
        ['상품명', selectedProduct.productName],
        ['팝업명', selectedProduct.popupName],
        ['가격', formatPrice(selectedProduct.price)],
        ['온라인 재고', `${selectedProduct.stock}개`],
        ['회원 누적 구매 제한', selectedProduct.maxQty == null ? '제한 없음' : `${selectedProduct.maxQty}개`],
        [
          '판매 상태',
          saleStatuses[selectedProduct.saleStatus] ||
            selectedProduct.saleStatus,
        ],
        ['판매 시작일시', formatDateTime(selectedProduct.saleStart)],
        ['판매 종료일시', formatDateTime(selectedProduct.saleEnd)],
        ['상품 설명', selectedProduct.description || '-'],
      ]
    : []

  return (
    <div className="admin-products">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>굿즈 관리</h2>
          <p>상품의 판매 상태와 온라인 재고를 확인하세요.</p>
        </div>

        <div className="product-admin-heading-actions">
          {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}

          <button
            type="button"
            className="product-admin-button primary"
            disabled={showCreateForm}
            aria-expanded={showCreateForm}
            aria-controls="product-admin-create-area"
            onClick={handleOpenCreate}
          >
            상품 등록
          </button>
        </div>
      </div>

      {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}

      {/* 등록 결과 */}
      <p className="product-admin-notice" role="status">
        {notice}
      </p>

      {/* 상품 등록 */}
      <div id="product-admin-create-area">
        {showCreateForm && (
          <AdminProductForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>

      {/* 검색 및 필터 */}
      <nav className="product-admin-stock-tabs" aria-label="상품 재고 분류">
        <button type="button" aria-current={!lowStockOnly ? 'page' : undefined} onClick={() => changeStockSection(false)}>전체 상품</button>
        <button type="button" aria-current={lowStockOnly ? 'page' : undefined} onClick={() => changeStockSection(true)}>재고 부족</button>
        {lowStockOnly && <span>재고 5개 이하 · 품절 포함</span>}
      </nav>
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
          <h3>{lowStockOnly ? '재고 부족 상품' : '상품 목록'}</h3>
          {!listLoading && !listError && (
            <span>
              검색 {lowStockOnly ? visibleProducts.length : total}개 / 전체 {totalAll}개
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
                {visibleProducts.map((product) => (
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
                        aria-haspopup="dialog"
                        onClick={() => setSelectedId(product.prdId)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}

                {visibleProducts.length === 0 && (
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

        {selectedId !== null && (
          <AdminDetailModal title="상품 상세" busy={stockBusy} onClose={() => setSelectedId(null)}>
          <section
            className="admin-panel product-admin-detail"
            aria-busy={detailLoading}
          >

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

            {!detailLoading && !detailError && selectedProduct && (editing ?
              <AdminProductForm product={selectedProduct} onBusyChange={setStockBusy} onCancel={() => setEditing(false)} onSuccess={() => {
                setEditing(false)
                setDetailRetryKey(value => value + 1)
                setListRetryKey(value => value + 1)
              }} /> :
              <>
                <div className="product-admin-heading-actions">
                  <button type="button" className="product-admin-button" disabled={stockBusy} onClick={() => setEditing(true)}>상품 수정</button>
                  <button type="button" className="product-admin-button" disabled={stockBusy} onClick={handleDelete}>상품 삭제</button>
                </div>
                <dl className="product-admin-info">
                  {detailRows.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd className={label === '온라인 재고' ? 'product-admin-stock-detail' : undefined}>
                        <span>{value}</span>
                        {label === '온라인 재고' && (
                          <div className="product-admin-stock-actions">
                            {stockMessage && <p role="status">{stockMessage}</p>}
                            {stockError && <div role="alert"><p>{stockError}</p><button type="button" className="product-admin-button" disabled={stockBusy} onClick={() => { setDetailRetryKey(v => v + 1); setListRetryKey(v => v + 1) }}>상품 정보 다시 조회</button></div>}
                            <form className="product-admin-form-grid" onSubmit={handleAddStock}>
                              <input
                                type="number" min="1" max="2147483647" step="1" required
                                aria-label="입고 수량" placeholder="입고 수량"
                                value={stockQuantity} disabled={stockBusy}
                                onChange={event => setStockQuantity(event.target.value)}
                              />
                              <button type="submit" className="product-admin-button primary" disabled={stockBusy || !stockQuantity}>
                                {stockBusy ? '저장 중…' : '재고 추가'}
                              </button>
                            </form>
                          </div>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

              </>
            )}
          </section>
          </AdminDetailModal>
        )}
    </div>
  )
}

export default AdminProducts
