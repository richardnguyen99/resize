import React from 'react'
import ReactDOM from 'react-dom'

import Resize from './Resize'

const App: React.FC = () => {
  return <Resize>Hello, World!</Resize>
}

ReactDOM.render(<App />, document.getElementById('root'))
