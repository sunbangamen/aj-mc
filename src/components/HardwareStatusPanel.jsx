/**
 * 하드웨어 상태 정보 표시 패널 (Phase 14D)
 * 배터리, 신호강도, 펌웨어 버전 등 하드웨어 메타데이터 표시
 */

import React from 'react'
import { formatDateTime } from '../types/sensor.js'

const HardwareStatusPanel = React.memo(({ sensorData, sensorKey }) => {
  if (!sensorData) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
        <h4 className="font-medium text-gray-900 mb-2">하드웨어 상태</h4>
        <p className="text-gray-500 text-sm">데이터 없음</p>
      </div>
    )
  }

  // 배터리 레벨에 따른 색상 결정
  const getBatteryColor = (level) => {
    if (level >= 60) return 'text-green-600 bg-green-50 border-green-200'
    if (level >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // 신호 강도에 따른 색상 결정 (-30이 최고, -80이 최저)
  const getSignalColor = (strength) => {
    if (strength >= -40) return 'text-green-600 bg-green-50 border-green-200'
    if (strength >= -60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // 신호 강도 텍스트 변환
  const getSignalStrengthText = (strength) => {
    if (strength >= -40) return '강함'
    if (strength >= -60) return '보통'
    return '약함'
  }

  // 신뢰도에 따른 색상 결정
  const getReliabilityColor = (reliability) => {
    if (reliability === 'high') return 'text-green-600 bg-green-50 border-green-200'
    if (reliability === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getReliabilityText = (reliability) => {
    const map = { high: '높음', medium: '보통', low: '낮음' }
    return map[reliability] || reliability
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900">하드웨어 상태 정보</h4>
        <p className="text-sm text-gray-600 mt-1">{sensorKey}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* 기본 하드웨어 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 배터리 상태 */}
          {sensorData.batteryLevel !== undefined && (
            <div className={`p-3 rounded-lg border ${getBatteryColor(sensorData.batteryLevel)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">배터리</span>
                <span className="text-lg font-bold">{sensorData.batteryLevel}%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    sensorData.batteryLevel >= 60 ? 'bg-green-500' :
                    sensorData.batteryLevel >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, sensorData.batteryLevel))}%` }}
                />
              </div>
            </div>
          )}

          {/* WiFi 신호 강도 */}
          {sensorData.signalStrength !== undefined && (
            <div className={`p-3 rounded-lg border ${getSignalColor(sensorData.signalStrength)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WiFi 신호</span>
                <span className="text-lg font-bold">{getSignalStrengthText(sensorData.signalStrength)}</span>
              </div>
              <div className="text-xs mt-1 opacity-75">
                {sensorData.signalStrength} dBm
              </div>
            </div>
          )}

          {/* 펌웨어 버전 */}
          {sensorData.firmwareVersion && (
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">펌웨어</span>
                <span className="text-lg font-bold">{sensorData.firmwareVersion}</span>
              </div>
            </div>
          )}

          {/* 하드웨어 모델 */}
          {sensorData.hardwareModel && (
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-600">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">모델</span>
                <span className="text-lg font-bold">{sensorData.hardwareModel}</span>
              </div>
            </div>
          )}
        </div>

        {/* 측정 품질 지표 */}
        <div className="border-t border-gray-200 pt-4">
          <h5 className="font-medium text-gray-900 mb-3">측정 품질 지표</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 정확도 */}
            {sensorData.accuracy !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{sensorData.accuracy}%</div>
                <div className="text-sm text-gray-600">정확도</div>
              </div>
            )}

            {/* 신뢰도 */}
            {sensorData.reliability && (
              <div className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getReliabilityColor(sensorData.reliability)}`}>
                  {getReliabilityText(sensorData.reliability)}
                </div>
                <div className="text-sm text-gray-600 mt-1">신뢰도</div>
              </div>
            )}

            {/* 오류 횟수 */}
            {sensorData.errorCount !== undefined && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${sensorData.errorCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sensorData.errorCount}
                </div>
                <div className="text-sm text-gray-600">총 오류</div>
                {sensorData.consecutiveErrors > 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    연속 오류: {sensorData.consecutiveErrors}회
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 유지보수 정보 */}
        <div className="border-t border-gray-200 pt-4">
          <h5 className="font-medium text-gray-900 mb-3">유지보수 정보</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {sensorData.installDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">설치일:</span>
                <span className="font-medium">{formatDateTime(sensorData.installDate)}</span>
              </div>
            )}

            {sensorData.lastMaintenance && (
              <div className="flex justify-between">
                <span className="text-gray-600">마지막 점검:</span>
                <span className="font-medium">{formatDateTime(sensorData.lastMaintenance)}</span>
              </div>
            )}

            {sensorData.calibrationDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">교정일:</span>
                <span className="font-medium">{formatDateTime(sensorData.calibrationDate)}</span>
              </div>
            )}

            {sensorData.warrantyExpire && (
              <div className="flex justify-between">
                <span className="text-gray-600">보증 만료:</span>
                <span className={`font-medium ${
                  sensorData.warrantyExpire < Date.now() ? 'text-red-600' :
                  sensorData.warrantyExpire < Date.now() + (30 * 24 * 60 * 60 * 1000) ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {formatDateTime(sensorData.warrantyExpire)}
                </span>
              </div>
            )}

            {sensorData.deviceId && (
              <div className="flex justify-between col-span-1 md:col-span-2">
                <span className="text-gray-600">디바이스 ID:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {sensorData.deviceId}
                </span>
              </div>
            )}

            {sensorData.location && (
              <div className="flex justify-between col-span-1 md:col-span-2">
                <span className="text-gray-600">설치 위치:</span>
                <span className="font-medium">{sensorData.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default HardwareStatusPanel
