import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPopups } from '../../api/admin/popupApi.js'
import { getProducts } from '../../api/admin/productApi.js'
import { getQnas } from '../../api/qnaApi.js'
import PopqIcon from '../../components/common/PopqIcon.jsx'

export default function AdminDashboard() {
  const [data,setData]=useState({}),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0)
  useEffect(()=>{
    let active=true;setLoading(true)
    Promise.allSettled([getPopups(),getProducts(),getQnas({status:'WAITING',size:1})]).then(results=>{
      if(!active)return
      const [popups,products,qnas]=results
      setData({popups:popups.status==='fulfilled'?popups.value.totalAll:null,products:products.status==='fulfilled'?products.value.items:null,waiting:qnas.status==='fulfilled'?qnas.value.totalElements:null})
    }).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[retry])
  const stats=[['전체 팝업',data.popups,'개','calendar','/admin/popups'],['판매 중인 상품',data.products?data.products.filter(p=>p.saleStatus==='ON_SALE').length:null,'개','bag','/admin/products'],['재고 부족 상품',data.products?data.products.filter(p=>Number.isFinite(p.stock)&&p.stock>=0&&p.stock<3).length:null,'개','bag','/admin/products?stock=low'],['답변 대기 문의',data.waiting,'건','ticket','/admin/qnas']]
  return <div className="admin-dashboard" aria-busy={loading}><div className="admin-page-heading"><div><h2>운영 대시보드</h2><p>실제 팝업·상품·문의 현황을 확인하세요.</p></div><button className="admin-chart-select" disabled={loading} onClick={()=>setRetry(v=>v+1)}>새로고침</button></div><div className="admin-stat-grid">{stats.map(([title,value,unit,icon,to])=><Link className="admin-stat-card" key={title} to={to} style={{textDecoration:'none',color:'inherit'}}><div className="admin-stat-top"><span>{title}</span><PopqIcon name={icon} size={20}/></div><strong>{loading?'…':value===null?'—':value.toLocaleString()}<small>{unit}</small></strong><span className="admin-stat-change">{!loading&&value===null?'조회하지 못했습니다. 새로고침해 주세요.':'관리 화면으로 이동 →'}</span></Link>)}</div></div>
}
