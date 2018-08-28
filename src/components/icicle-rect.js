import React from 'react'

import * as ObjectUtil from 'util/object-util'


class SvgRectangle extends React.PureComponent {
  // shouldComponentUpdate(nextProps, nextState) {
  //   let ans = true
  //   let logs = []
  //   for (let key in this.props) {
  //     ans = ans && this.props[key] === nextProps[key]
  //     if (this.props[key] !== nextProps[key]) {
  //       logs.push(key)
  //     }
  //   }
  //   if (!ans) {
  //     // console.log(ans, logs)
  //   }
  //   return false
  // }

  render() {
    const props = this.props
    const x = props.x
    const y = props.y
    const dx = props.dx
    const dy = props.dy
    const onClickHandler = props.onClickHandler
    const onDoubleClickHandler = props.onDoubleClickHandler
    const onMouseOverHandler = props.onMouseOverHandler
    const fill = props.fill
    const opacity = props.opacity


    return (
      <rect
        className='node'
        x={x}
        y={y}
        width={dx}
        height={dy}
        onClick={onClickHandler}
        onDoubleClick={onDoubleClickHandler}
        onMouseOver={onMouseOverHandler}
        style={{'fill': fill, 'opacity': opacity, stroke: '#fff'}}
      />
    )
  }
}


class Presentational extends React.PureComponent {
  constructor(props) {
    super(props)

    this.dims = this.dims.bind(this)

    this.onClickHandler = this.onClickHandler.bind(this)
    this.onDoubleClickHandler = this.onDoubleClickHandler.bind(this)
    this.onMouseOverHandler = this.onMouseOverHandler.bind(this)
  }

  dims() {
    return {
      x:this.props.x,
      y:this.props.y,
      dx:this.props.dx,
      dy:this.props.dy,
    }
  }

  onClickHandler(e) {
    this.props.onClickHandler({
      node_id:this.props.node_id,
      dims:this.dims,
    },e)
  }
  onDoubleClickHandler(e) {
    this.props.onDoubleClickHandler({
      node_id:this.props.node_id,
      dims:this.dims,
    },e)
  }
  onMouseOverHandler(e) {
    this.props.onMouseOverHandler({
      node_id:this.props.node_id,
      dims:this.dims,
      isLocked:this.props.isLocked,
    },e)
  }

  render() {
    const node_id = this.props.node_id

    const isLocked = this.props.isLocked
    const isFocused = this.props.isFocused
    const isInHoverSeq = this.props.isInHoverSeq
    const isInLockSeq = this.props.isInLockSeq

    const opacity =
      (isLocked ?
        (isInLockSeq ?
          1
        :
          (isInHoverSeq ? 0.6 : 0.3)
        )
      :
        (isFocused ?
          (isInHoverSeq ? 1 : 0.3)
        :
          1
        )
      )

    const fill = this.props.fillColor(node_id)

    const res = [
      <SvgRectangle
        key='rect'
        x={this.props.x}
        y={this.props.y}
        dx={this.props.dx}
        dy={this.props.dy}
        onClickHandler={this.onClickHandler}
        onDoubleClickHandler={this.onDoubleClickHandler}
        onMouseOverHandler={this.onMouseOverHandler}
        fill={fill}
        opacity={opacity}
      />
    ]


    if(this.props.hasTags) {
      const stroke_opacity = this.props.highlightingATag ? (this.props.hasTagToHighlight ? 1 : 0.2) : 1

      res.push(
        (<rect
            key='stroke'
            x={this.props.x + 1}
            y={this.props.y + 1}
            width={this.props.dx - 2}
            height='6'
            onClick={this.onClickHandler}
            onDoubleClick={this.onDoubleClickHandler}
            onMouseOver={this.onMouseOverHandler}
            style={{'fill': 'rgb(10, 50, 100)', 'stroke':'none', 'opacity':stroke_opacity}}
          />
        )
      )
    }

    return res
  }
}

export default (props) => {
  const api = props.api
  const icicle_state = api.icicle_state
  const database = api.database

  const hover_sequence = icicle_state.hover_sequence()
  const lock_sequence = icicle_state.lock_sequence()
  const tag_id_to_highlight = icicle_state.tagIdToHighlight()

  const node_tag_ids = database.getTagIdsByFfId(props.node_id)

  const isInHoverSeq = hover_sequence.includes(props.node_id)
  const isInLockSeq = lock_sequence.includes(props.node_id)
  const hasTags = node_tag_ids.size > 0
  const highlightingATag = tag_id_to_highlight.length > 0
  const hasTagToHighlight = node_tag_ids.includes(tag_id_to_highlight)


  props = ObjectUtil.compose({
    isFocused: icicle_state.isFocused(),
    isLocked: icicle_state.isLocked(),
    isInHoverSeq,
    isInLockSeq,
    hasTags,
    highlightingATag,
    hasTagToHighlight,
  },props)

  return (<Presentational {...props}/>)
}
