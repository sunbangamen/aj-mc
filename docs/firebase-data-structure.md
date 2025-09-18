# Firebase 데이터 구조

## Realtime Database 구조

```
/sensors/
├── site1/
│   └── ultrasonic/
│       ├── distance: 150          # 현재 거리값 (cm)
│       ├── timestamp: 1695123456789  # 마지막 업데이트 시간
│       ├── status: "normal"        # 상태 (normal/warning/alert/offline)
│       └── history/                # 측정 이력
│           ├── -push_id_1/
│           │   ├── distance: 145
│           │   ├── timestamp: 1695123456789
│           │   └── status: "normal"
│           └── -push_id_2/
│               ├── distance: 152
│               ├── timestamp: 1695123456890
│               └status: "normal"
├── site2/
│   └── ultrasonic/
│       ├── distance: 200
│       ├── timestamp: 1695123456789
│       ├── status: "warning"
│       └── history/
└── test/
    └── ultrasonic/
        ├── distance: 100
        ├── timestamp: 1695123456789
        ├── status: "normal"
        └── history/
```

## 상태 정의

- **normal**: < 100cm (정상)
- **warning**: 100-200cm (주의)
- **alert**: > 200cm (경고)
- **offline**: 데이터 수신 안됨 (5분 이상)

## 데이터 타입

```typescript
interface SensorData {
  distance: number        // 거리값 (cm)
  timestamp: number      // Unix timestamp (ms)
  status: 'normal' | 'warning' | 'alert' | 'offline'
}

interface SiteData {
  ultrasonic: SensorData & {
    history: Record<string, SensorData>
  }
}
```