import { useEffect, useRef, useState } from 'react'
import { getPopups } from '../../api/admin/popupApi'
import { createProduct } from '../../api/admin/productApi'
import AdminSaleDatePicker from './AdminSaleDatePicker'

// 초기 입력값
function createInitialForm() {
  return {
    popId: '',
    productName: '',
    price: '',
    stock: '',
    maxQty: '1',
    startDate: '',
    startHour: '10',
    startMinute: '00',
    endDate: '',
    endHour: '18',
    endMinute: '00',
    description: '',
  }
}

function AdminProductForm({ onSuccess, onCancel }) {
  // 입력 정보
  const [form, setForm] = useState(createInitialForm)

  // 소속 팝업
  const [popups, setPopups] = useState([])
  const [popupLoading, setPopupLoading] = useState(true)
  const [popupError, setPopupError] = useState('')
  const [popupRetryKey, setPopupRetryKey] = useState(0)

  // 등록 상태
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const submitting = useRef(false)

  // 팝업 목록 조회
  useEffect(() => {
    let active = true

    async function loadPopups() {
      setPopupLoading(true)
      setPopupError('')

      try {
        // 나중에 확인할 부분: 등록용 팝업 목록의 페이지 조회 방식
        const response = await getPopups()

        if (active) setPopups(response.items)
      } catch (error) {
        if (active) {
          setPopupError(
            error.message || '팝업 목록을 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setPopupLoading(false)
      }
    }

    loadPopups()

    return () => {
      active = false
    }
  }, [popupRetryKey])

  // 입력값 변경
  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setSaveError('')
  }

  function handleChange(event) {
    updateField(event.target.name, event.target.value)
  }

  // 상품 등록
  async function handleSubmit(event) {
    event.preventDefault()

    if (
      submitting.current ||
      popupLoading ||
      popupError ||
      popups.length === 0
    ) {
      return
    }

    setSaveError('')

    if (!form.productName.trim()) {
      setSaveError('상품명을 입력해 주세요.')
      return
    }

    const popId = Number(form.popId)
    const price = Number(form.price)
    const stock = Number(form.stock)
    const maxQty = Number(form.maxQty)

    if (!form.popId || !Number.isSafeInteger(popId) || popId < 1) {
      setSaveError('소속 팝업을 선택해 주세요.')
      return
    }

    if (
      !form.price.trim() ||
      !Number.isSafeInteger(price) ||
      price < 0
    ) {
      setSaveError('가격은 0 이상의 정수로 입력해 주세요.')
      return
    }

    if (
      !form.stock.trim() ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setSaveError('초기 재고는 0 이상의 정수로 입력해 주세요.')
      return
    }

    if (
      !form.maxQty.trim() ||
      !Number.isSafeInteger(maxQty) ||
      maxQty < 1
    ) {
      setSaveError('회원 누적 구매 제한은 1 이상의 정수로 입력해 주세요.')
      return
    }

    if (!form.startDate || !form.endDate) {
      setSaveError('판매 시작일과 종료일을 달력에서 선택해 주세요.')
      return
    }

    // 한국 시간 기준 변환
    const saleStart = new Date(
      `${form.startDate}T${form.startHour}:${form.startMinute}:00+09:00`
    )

    const saleEnd = new Date(
      `${form.endDate}T${form.endHour}:${form.endMinute}:00+09:00`
    )

    if (
      Number.isNaN(saleStart.getTime()) ||
      Number.isNaN(saleEnd.getTime()) ||
      saleStart.getTime() >= saleEnd.getTime()
    ) {
      setSaveError('판매 종료일시는 시작일시보다 늦어야 합니다.')
      return
    }

    submitting.current = true
    setSaving(true)

    let createdProduct

    try {
      createdProduct = await createProduct({
        popId,
        productName: form.productName.trim(),
        price,
        stock,
        maxQty,
        saleStart: saleStart.toISOString(),
        saleEnd: saleEnd.toISOString(),
        description: form.description.trim(),
      })
    } catch (error) {
      setSaveError(
        error.message || '상품을 등록하지 못했습니다.'
      )
      return
    } finally {
      submitting.current = false
      setSaving(false)
    }

    onSuccess(createdProduct)
  }

  return (
    <section
      className="admin-panel product-admin-create"
      aria-labelledby="product-admin-create-title"
      aria-busy={saving}
    >
      <div className="admin-panel-header">
        <div>
          <h3 id="product-admin-create-title">굿즈 등록</h3>
          <p>상품 정보와 초기 온라인 재고를 입력해 주세요.</p>
        </div>
      </div>

      <p className="product-admin-form-guide">
        데모 등록 정보는 새로고침하면 초기화됩니다.
        이미지 업로드는 아직 지원하지 않습니다.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset
          className="product-admin-fieldset"
          disabled={saving}
        >
          <legend className="product-admin-sr-only">
            상품 등록 정보
          </legend>

          {/* 기본 정보 */}
          <div className="product-admin-form-grid">
            <label>
              소속 팝업
              <select
                name="popId"
                value={form.popId}
                onChange={handleChange}
                disabled={popupLoading || Boolean(popupError)}
                required
              >
                <option value="">
                  {popupLoading
                    ? '팝업 불러오는 중…'
                    : '팝업을 선택하세요'}
                </option>

                {popups.map((popup) => (
                  <option key={popup.popId} value={popup.popId}>
                    {popup.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              상품명
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="상품명을 입력하세요"
                required
              />
            </label>

            <label>
              가격 (원)
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="예: 10000"
                min="0"
                step="1"
                required
              />
            </label>

            <label>
              초기 온라인 재고
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="예: 5"
                min="0"
                step="1"
                required
              />
            </label>

            <label>
              회원 누적 구매 제한
              <input
                type="number"
                name="maxQty"
                value={form.maxQty}
                onChange={handleChange}
                min="1"
                step="1"
                required
              />
            </label>
          </div>

          {/* 판매기간 */}
          <div className="product-admin-period-heading">
            <h4>판매기간</h4>
            <p>큰 날짜 버튼으로 선택한 뒤 시·분을 설정해 주세요.</p>
          </div>

          <div className="product-admin-period-grid">
            <AdminSaleDatePicker
              label="판매 시작"
              date={form.startDate}
              hour={form.startHour}
              minute={form.startMinute}
              disabled={saving}
              onDateChange={(value) =>
                updateField('startDate', value)
              }
              onHourChange={(value) =>
                updateField('startHour', value)
              }
              onMinuteChange={(value) =>
                updateField('startMinute', value)
              }
            />

            <AdminSaleDatePicker
              label="판매 종료"
              date={form.endDate}
              hour={form.endHour}
              minute={form.endMinute}
              disabled={saving}
              onDateChange={(value) =>
                updateField('endDate', value)
              }
              onHourChange={(value) =>
                updateField('endHour', value)
              }
              onMinuteChange={(value) =>
                updateField('endMinute', value)
              }
            />
          </div>

          {/* 상품 설명 */}
          <div className="product-admin-form-grid">
            <label className="product-admin-form-wide">
              상품 설명
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="상품에 대한 설명을 입력하세요"
              />
            </label>
          </div>
        </fieldset>

        {/* 팝업 조회 오류 */}
        {popupError && (
          <div className="product-admin-form-error">
            <p role="alert">{popupError}</p>

            <button
              type="button"
              className="product-admin-button"
              disabled={saving || popupLoading}
              onClick={() =>
                setPopupRetryKey((previous) => previous + 1)
              }
            >
              팝업 다시 불러오기
            </button>
          </div>
        )}

        {!popupLoading && !popupError && popups.length === 0 && (
          <p className="product-admin-help" role="status">
            선택할 팝업이 없습니다. 팝업 등록 후 이용해 주세요.
          </p>
        )}

        {/* 등록 오류 */}
        {saveError && (
          <p className="product-admin-form-error" role="alert">
            {saveError}
          </p>
        )}

        {/* 등록 버튼 */}
        <div className="product-admin-form-actions">
          <button
            type="button"
            className="product-admin-button"
            disabled={saving}
            onClick={onCancel}
          >
            닫기
          </button>

          <button
            type="submit"
            className="product-admin-button primary"
            disabled={
              saving ||
              popupLoading ||
              Boolean(popupError) ||
              popups.length === 0
            }
          >
            {saving ? '등록 중…' : '데모 상품 등록'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminProductForm