/**
 * 하드웨어 메타데이터 관리 패널 (Phase 14D)
 * 센서별 하드웨어 정보 편집 및 관리
 */

import React, { useState, useEffect } from 'react'
import { useAllSensorData } from '../hooks/useSensorData'
import { useSites } from '../hooks/useSiteManagement'
import { extractSensorsFromSiteData, formatDateTime } from '../types/sensor.js'

const HardwareMetadataPanel = () => {
  const { allSites, loading, error } = useAllSensorData()
  const { sites, loading: sitesLoading } = useSites()
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedSensor, setSelectedSensor] = useState('')
  const [editingMetadata, setEditingMetadata] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // 사이트 정보 맵 생성
  const siteMap = {}
  sites.forEach(site => {
    siteMap[site.id] = site
  })

  // 전체 센서 정보 수집
  const allSensorsData = []
  allSites.forEach(({ siteId, ...siteData }) => {
    const sensors = extractSensorsFromSiteData(siteData)
    const site = siteMap[siteId]
    sensors.forEach(sensor => {
      allSensorsData.push({
        siteId,
        siteName: site ? site.name : siteId,
        sensorKey: sensor.key,
        sensorName: sensor.displayName,
        data: sensor.data
      })
    })
  })

  // 현장별로 필터링된 센서 데이터
  const filteredSensorsData = selectedSite
    ? allSensorsData.filter(sensor => sensor.siteId === selectedSite)
    : allSensorsData

  // 현장 목록
  const availableSites = [...new Set(allSensorsData.map(s => s.siteId))]
    .map(siteId => ({
      id: siteId,
      name: siteMap[siteId] ? siteMap[siteId].name : siteId
    }))

  const handleEditMetadata = (sensorInfo) => {
    setEditingMetadata({
      ...sensorInfo,
      editableData: {
        location: sensorInfo.data.location || '',
        hardwareModel: sensorInfo.data.hardwareModel || '',
        firmwareVersion: sensorInfo.data.firmwareVersion || '',
        installDate: sensorInfo.data.installDate || Date.now(),
        lastMaintenance: sensorInfo.data.lastMaintenance || Date.now(),
        calibrationDate: sensorInfo.data.calibrationDate || Date.now(),
        warrantyExpire: sensorInfo.data.warrantyExpire || (Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    })
    setIsEditing(true)
  }

  const handleSaveMetadata = () => {
    // 실제 구현에서는 Firebase에 저장
    console.log('메타데이터 저장:', editingMetadata)
    alert('메타데이터가 저장되었습니다. (시뮬레이션 모드)')
    setIsEditing(false)
    setEditingMetadata(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingMetadata(null)
  }

  const updateEditableData = (field, value) => {
    setEditingMetadata(prev => ({
      ...prev,
      editableData: {
        ...prev.editableData,
        [field]: value
      }
    }))
  }

  // 하드웨어 상태 요약 통계 (필터링된 데이터 기준)
  const hardwareStats = {
    total: filteredSensorsData.length,
    lowBattery: filteredSensorsData.filter(s => s.data.batteryLevel < 30).length,
    weakSignal: filteredSensorsData.filter(s => s.data.signalStrength < -60).length,
    withErrors: filteredSensorsData.filter(s => s.data.errorCount > 0).length,
    needMaintenance: filteredSensorsData.filter(s => {
      const maintenanceThreshold = Date.now() - (90 * 24 * 60 * 60 * 1000) // 90일
      return s.data.lastMaintenance < maintenanceThreshold
    }).length
  }

  if (loading) return <div className="text-center py-4" style={{ color: '#000' }}>데이터 로딩 중...</div>
  if (error) return <div className="text-red-600 py-4" style={{ color: '#dc2626' }}>오류: {error}</div>

  return (
    <div className="space-y-6 hardware-metadata-panel">
      {/* 현장 필터링 */}
      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800">🔧 하드웨어 메타데이터 관리</h3>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-600">현장 선택:</label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 현장</option>
            {availableSites.map(site => (
              <option key={site.id} value={site.id}>
                📍 {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 하드웨어 상태 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{hardwareStats.total}</div>
          <div className="text-sm text-blue-800">총 센서</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{hardwareStats.lowBattery}</div>
          <div className="text-sm text-red-800">배터리 부족</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{hardwareStats.weakSignal}</div>
          <div className="text-sm text-yellow-800">신호 약함</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{hardwareStats.withErrors}</div>
          <div className="text-sm text-orange-800">오류 발생</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{hardwareStats.needMaintenance}</div>
          <div className="text-sm text-purple-800">점검 필요</div>
        </div>
      </div>

      {/* 편집 모달 */}
      {isEditing && editingMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto" style={{ color: '#000' }}>
            <h3 className="text-lg font-semibold mb-4">
              하드웨어 메타데이터 편집 - {editingMetadata.sensorName}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설치 위치
                </label>
                <input
                  type="text"
                  value={editingMetadata.editableData.location}
                  onChange={(e) => updateEditableData('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 동쪽벽, 천장, 출입구"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  하드웨어 모델
                </label>
                <input
                  type="text"
                  value={editingMetadata.editableData.hardwareModel}
                  onChange={(e) => updateEditableData('hardwareModel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: HC-SR04, DHT22"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  펌웨어 버전
                </label>
                <input
                  type="text"
                  value={editingMetadata.editableData.firmwareVersion}
                  onChange={(e) => updateEditableData('firmwareVersion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: v1.2.3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설치일
                  </label>
                  <input
                    type="date"
                    value={new Date(editingMetadata.editableData.installDate).toISOString().split('T')[0]}
                    onChange={(e) => updateEditableData('installDate', new Date(e.target.value).getTime())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    마지막 점검일
                  </label>
                  <input
                    type="date"
                    value={new Date(editingMetadata.editableData.lastMaintenance).toISOString().split('T')[0]}
                    onChange={(e) => updateEditableData('lastMaintenance', new Date(e.target.value).getTime())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    교정일
                  </label>
                  <input
                    type="date"
                    value={new Date(editingMetadata.editableData.calibrationDate).toISOString().split('T')[0]}
                    onChange={(e) => updateEditableData('calibrationDate', new Date(e.target.value).getTime())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    보증 만료일
                  </label>
                  <input
                    type="date"
                    value={new Date(editingMetadata.editableData.warrantyExpire).toISOString().split('T')[0]}
                    onChange={(e) => updateEditableData('warrantyExpire', new Date(e.target.value).getTime())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleSaveMetadata}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 센서 목록 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">하드웨어 메타데이터 관리</h3>
          <p className="text-sm text-gray-600 mt-1">
            센서별 하드웨어 정보를 확인하고 편집할 수 있습니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  센서 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  하드웨어 상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유지보수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSensorsData.map((sensorInfo, index) => (
                <tr key={`${sensorInfo.siteId}-${sensorInfo.sensorKey}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {sensorInfo.sensorName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {sensorInfo.siteName} - {sensorInfo.data.location || '위치 미설정'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {sensorInfo.data.hardwareModel || '모델 미설정'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">배터리:</span>
                        <span className={`text-xs font-medium ${
                          sensorInfo.data.batteryLevel >= 60 ? 'text-green-600' :
                          sensorInfo.data.batteryLevel >= 30 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {sensorInfo.data.batteryLevel}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">신호:</span>
                        <span className={`text-xs font-medium ${
                          sensorInfo.data.signalStrength >= -40 ? 'text-green-600' :
                          sensorInfo.data.signalStrength >= -60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {sensorInfo.data.signalStrength}dBm
                        </span>
                      </div>
                      {sensorInfo.data.errorCount > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">오류:</span>
                          <span className="text-xs font-medium text-red-600">
                            {sensorInfo.data.errorCount}회
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-500">설치:</span> {formatDateTime(sensorInfo.data.installDate)}
                      </div>
                      <div>
                        <span className="text-gray-500">점검:</span> {formatDateTime(sensorInfo.data.lastMaintenance)}
                      </div>
                      <div>
                        <span className="text-gray-500">교정:</span> {formatDateTime(sensorInfo.data.calibrationDate)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditMetadata(sensorInfo)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      편집
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSensorsData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {selectedSite ? '선택한 현장에 센서 데이터가 없습니다.' : '관리할 센서 데이터가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default HardwareMetadataPanel