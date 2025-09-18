import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSites, useSiteManagement } from '../hooks/useSiteManagement'
import {
  SITE_STATUS_COLORS,
  SITE_STATUS_LABELS,
  SENSOR_TYPE_ICONS,
  SENSOR_TYPE_LABELS,
  calculateSiteStats,
  sortSites,
} from '../types/site'
import SiteForm from '../components/SiteForm'

function AdminDashboard() {
  const { sites, loading, error, connectionStatus } = useSites()
  const { createSite, updateSite, deleteSite, updateSiteStatus, isLoading } = useSiteManagement()
  const [sortBy, setSortBy] = useState('name')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSite, setEditingSite] = useState(null)

  // 통계 계산
  const stats = calculateSiteStats(sites)
  const sortedSites = sortSites(sites, sortBy)

  const handleDeleteSite = async (siteId, siteName) => {
    if (window.confirm(`정말로 "${siteName}" 현장을 삭제하시겠습니까?`)) {
      const result = await deleteSite(siteId)
      if (result.success) {
        alert('현장이 삭제되었습니다.')
      } else {
        alert(`삭제 실패: ${result.error}`)
      }
    }
  }

  const handleStatusChange = async (siteId, newStatus) => {
    const result = await updateSiteStatus(siteId, newStatus)
    if (!result.success) {
      alert(`상태 변경 실패: ${result.error}`)
    }
  }

  // 현장 생성 처리
  const handleCreateSite = async (siteData) => {
    const result = await createSite(siteData)
    if (result.success) {
      setShowCreateModal(false)
      alert('현장이 생성되었습니다.')
    } else {
      alert(`생성 실패: ${result.error}`)
    }
  }

  // 현장 편집 시작
  const handleEditSite = (site) => {
    setEditingSite(site)
    setShowEditModal(true)
  }

  // 현장 편집 처리
  const handleUpdateSite = async (siteData) => {
    if (!editingSite) return

    const result = await updateSite(editingSite.id, siteData)
    if (result.success) {
      setShowEditModal(false)
      setEditingSite(null)
      alert('현장 정보가 수정되었습니다.')
    } else {
      alert(`수정 실패: ${result.error}`)
    }
  }

  // 모달 닫기
  const handleCloseModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingSite(null)
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <h1>관리자 대시보드</h1>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>현장 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <h1>관리자 대시보드</h1>
        <div className="error-message">
          <h3>❌ 연결 오류</h3>
          <p>{error}</p>
          <p className="error-detail">
            연결 상태: {connectionStatus === 'error' ? '연결 실패' : connectionStatus}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>관리자 대시보드</h1>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={isLoading}
            >
              ➕ 현장 추가
            </button>
            <div className="connection-status">
              <span className={`status-indicator ${connectionStatus}`}>
                {connectionStatus === 'connected'
                  ? '🟢 실시간 연결'
                  : '🔴 연결 안됨'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏗️</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>전체 현장</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>활성 현장</p>
          </div>
        </div>
        <div className="stat-card maintenance">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>{stats.maintenance}</h3>
            <p>점검중</p>
          </div>
        </div>
        <div className="stat-card sensors">
          <div className="stat-icon">📡</div>
          <div className="stat-content">
            <h3>{stats.totalSensors}</h3>
            <p>총 센서</p>
          </div>
        </div>
      </div>

      {/* 현장 목록 */}
      <div className="sites-section">
        <div className="section-header">
          <h2>현장 목록</h2>
          <div className="section-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">이름순</option>
              <option value="createdAt">생성일순</option>
              <option value="updatedAt">수정일순</option>
              <option value="status">상태순</option>
            </select>
          </div>
        </div>

        {sortedSites.length === 0 ? (
          <div className="no-sites">
            <p>등록된 현장이 없습니다.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              첫 번째 현장 추가하기
            </button>
          </div>
        ) : (
          <div className="sites-grid">
            {sortedSites.map((site) => (
              <div key={site.id} className="site-card">
                <div className="site-card-header">
                  <div className="site-title">
                    <h3>{site.name}</h3>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: SITE_STATUS_COLORS[site.status],
                        color: 'white',
                      }}
                    >
                      {SITE_STATUS_LABELS[site.status]}
                    </span>
                  </div>
                  <div className="site-actions">
                    <select
                      value={site.status}
                      onChange={(e) => handleStatusChange(site.id, e.target.value)}
                      className="status-select"
                      disabled={isLoading}
                    >
                      <option value="active">활성</option>
                      <option value="maintenance">점검중</option>
                      <option value="inactive">비활성</option>
                    </select>
                    <button
                      className="btn btn-edit"
                      onClick={() => handleEditSite(site)}
                      title="현장 편집"
                      disabled={isLoading}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-delete"
                      onClick={() => handleDeleteSite(site.id, site.name)}
                      title="현장 삭제"
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="site-info">
                  <div className="info-row">
                    <span className="info-label">📍 위치:</span>
                    <span className="info-value">{site.location || '미설정'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📝 설명:</span>
                    <span className="info-value">
                      {site.description || '설명 없음'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📊 센서:</span>
                    <span className="info-value">
                      {site.sensorCount}개 -{' '}
                      {site.sensorTypes.map(type => SENSOR_TYPE_ICONS[type]).join(' ')}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">🕐 생성:</span>
                    <span className="info-value">
                      {new Date(site.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>

                <div className="site-card-footer">
                  <Link
                    to={`/site/${site.id}`}
                    className="btn btn-outline"
                  >
                    📈 모니터링 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 현장 생성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>새 현장 추가</h3>
              <button
                className="modal-close"
                onClick={handleCloseModals}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <SiteForm
                onSubmit={handleCreateSite}
                onCancel={handleCloseModals}
                isLoading={isLoading}
                mode="create"
              />
            </div>
          </div>
        </div>
      )}

      {/* 현장 편집 모달 */}
      {showEditModal && editingSite && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>현장 정보 수정</h3>
              <button
                className="modal-close"
                onClick={handleCloseModals}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <SiteForm
                initialData={editingSite}
                onSubmit={handleUpdateSite}
                onCancel={handleCloseModals}
                isLoading={isLoading}
                mode="edit"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard