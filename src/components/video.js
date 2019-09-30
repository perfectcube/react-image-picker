import React, { Component } from 'react'
import PropTypes from 'prop-types'

const VideoStyle = (width, height) => {
  return {
    width,
    height,
    objectFit: "cover"
  }
}

export default class Video extends Component {
  render() {
    const { src, isSelected, onImageClick } = this.props
    return (
      <div className={`responsive${isSelected ? " selected" : ""}`}
            onClick={onImageClick}>
        <img src={src}
              className={`thumbnail${isSelected ? " selected" : ""}`}
              style={VideoStyle(150, 150)}
              alt="selectable thumbnail"
        />
        <div className="checked">
            <div className="icon"/>
        </div>
      </div>
    )
  }
}

Video.propTypes = {
  src: PropTypes.string,
  isSelected: PropTypes.bool
}