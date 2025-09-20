import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production, this could report to an error service
    // eslint-disable-next-line no-console
    console.error('Uncaught error in ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem' }}>
          <h2>예기치 못한 오류가 발생했습니다.</h2>
          <p>페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

