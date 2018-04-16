// @flow


import React from 'react'

import ReactDOM from 'react-dom'

import MainSpace from 'components/main-space'
import Dashboard from 'components/dashboard'

import unsafeStyle from 'css/stats.css'

import { readError } from 'api-call'

window.onload = () => {
  let root_div = document.createElement('main')
  root_div.setAttribute('id','root')

  if (document.body !== null) {
    document.body.appendChild(root_div)
  }

  ReactDOM.render(<Root/>,root_div)
}

class Root extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      val:10,
      arr:[]
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleClick(e) {
    readError(this.state.val)
    .then(arr => {
      this.setState({arr: JSON.parse(arr)})
    })
  }

  handleChange(e) {
    this.setState({val: e.target.value})
  }

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Fetch</button>
        <input onChange={this.handleChange} value={this.state.val}></input>
        <Table arr={this.state.arr}/>
      </div>
    )
  }
}

function Table(props) {
  const header = (
    <tr>
      <th>user_agent</th>
      <th>date</th> 
      <th>stack</th>
      <th>componentStack</th>
    </tr>
  )
  
  const listItems = props.arr.map((e,i) =>
    <tr key={i}>
      <td>{e.user_agent}</td>
      <td>{new Date(e.date).toString()}</td> 
      <td>{e.stack}</td>
      <td>{e.componentStack}</td>
    </tr>
  )
  if (listItems.length) {
    return (
      <div>
        <table>
          <tbody>
            {header}
            {listItems}
          </tbody>
        </table>
      </div>
    )
  } else {
    return (<div></div>)
  }
}