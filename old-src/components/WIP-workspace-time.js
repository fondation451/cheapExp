import React from 'react'
import { connect } from 'react-redux'
import { selectDatabase, selectIcicleState } from 'reducers/root-reducer'

import { setParentPath } from 'reducers/database'
import { setNoFocus, unlock } from 'reducers/icicle-state'

import { tr } from 'dict'
import * as Color from 'color'

import Icicle from 'components/icicle'
import Ruler from 'components/ruler'
import BreadCrumbs from 'components/breadcrumbs'
import Report from 'components/report'
import BTRButton from 'components/back-to-root-button'

import RugTimePlot from 'components/rug-time-plot'

const chart_style = {
  stroke: '#fff',
}

const btr_style = {
  textAlign: 'center',
  padding: '1em 0'
}


const Presentational = props => {

  const fWidth = id => {
    const node = props.getById(id)
    return node.get('content').get('size')
  }

  const normalizeWidth = arr => {
    const sum = arr.reduce((a,b)=>a+b,0)
    const ans = arr.map(a=>a/sum)
    return ans
  }

  const trueFHeight = max_height => id => {
    return max_height/props.max_depth
  }

  const root_node = props.getById(props.root_id)
  const last_modified = root_node.get('content').get('last_modified')
  const max_time = last_modified.get('max')
  const min_time = last_modified.get('min')
  const zeroToOne = (id) => {
    const node = props.getById(id)
    const last_modified = node.get('content').get('last_modified')
    const time = last_modified.get('average')
    return (time - min_time) / (max_time - min_time)
  }

  const fillColor = id => {
    return Color.toRgba(
      Color.gradient(
        Color.leastRecentDate(),
        Color.mostRecentDate()
      )(zeroToOne(id))
    )


    const node = props.getById(id)
    const name = node.get('name')

    if (node.get('children').size) {
      if (props.display_root.includes(id)) {
        return Color.parentFolder()
      } else {
        return Color.folder()
      }
    } else {
      return Color.fromFileName(name)
    }
  }


  return (
    <div>
        <Report
          fillColor={fillColor}
        />
        <div className="grid-x">
          <div className="cell small-2"></div>
          <div className="cell small-4" style={btr_style}>
            <BTRButton />
          </div>
          <div className="cell small-6"></div>
        </div>
        <div className="grid-x">
          <div className="cell small-12">
            <RugTimePlot/>
          </div>
        </div>
    </div>
  )
}



const mapStateToProps = state => {
  const database = selectDatabase(state)
  const icicle_state = selectIcicleState(state)

  return {
    max_depth: database.maxDepth(),
    getById: database.getById,
    display_root: icicle_state.display_root(),
    root_id: database.rootId(),
  }
}
 
const mapDispatchToProps = dispatch => {
  return {
    setNoFocus: (...args) => dispatch((setNoFocus(...args))),
    unlock: (...args) => dispatch((unlock(...args))),
    setParentPath: (...args) => dispatch(setParentPath(...args))
  }
}


const Container = connect(
  mapStateToProps,
  mapDispatchToProps
)(Presentational)

export default Container
