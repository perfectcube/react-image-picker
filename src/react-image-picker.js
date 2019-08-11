import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Map } from 'immutable';

import './index.scss';
import Image from './components/image';

const getPicked = (props) => {
  // our picked values are always put into a map in state.
  let chosen = new Map();
  // do we have a non-empty array to fill preselected values with?
  const have_choices = (Array.isArray(props.picked) && (props.picked.length > 0)) ? true : false;
  if (have_choices) {
    // we have an array of objects, each with the shape of {src: 'some src', index: some_index} if the first 
    // item in the array is an object
    const have_indexes = (
      // the item in array index 0 is an object
      (typeof props.picked[0] === 'object') && 
      // the item in array index 0 has in index attribute
      (typeof props.picked[0].index !== undefined)
    ) ? true : false;
    // iterate over the pre-selections, placing them into our map
    props.picked.forEach((choice) => {
      // assume that we don't find an index
      let index = -1;
      // src will be a string
      let src = '';
      if (!have_indexes) {
        // only sniff indexes if its been asked for
        if (props.sniffPicked === true) {
          // look through the images and pull out the index that matches this chosen item
          index = props.images.findIndex((item)=>{
            // exit as soon as the choice in this list matches the selected item
            return (item.src === choice)
          });              
        }
        // cross assign the choice into src for this iteration
        src = choice;
      }
      else {
        index = choice.index;
        src = choice.src;
      }
      // push another item into the stack
      chosen = chosen.set(src,index);
    });
  }
  return chosen;
}

class ImagePicker extends Component {
    constructor(props) {
      super(props)

      // get the initial state for the picked items
      const chosen = getPicked(props);

      this.state = {
        // assign the preselected items into the state container
        picked: chosen,
      }
      // const json = this.state.picked.toJS(); console.log(json);
      this.handleImageClick = this.handleImageClick.bind(this)
      this.renderImage = this.renderImage.bind(this)
    }

    componentWillReceiveProps(nextProps) {
      if(this.props.picked !== nextProps.picked) {
        this.setState({picked: nextProps.picked});
      }
    }

    removeSelection(from,item){
      // remove the requested item from the map
      const altered = from.delete(item);
      // return the altered map
      return altered;
    }

    onData(data){
      // get the multiple and picked callback out of props
      const { multiple, onPick } = this.props;
      // if onPick was defined as a function then transcode our Map into an array and send it back to the caller
      if (typeof onPick === 'function') {
        // collect an array version of what we have in state
        const collection = [];
        data.forEach((index,src) => {
          collection.push({src: src, index: index});
        });
        // decide what to send back based on if we're in multiple mode or single mode
        const send = (multiple) ? collection : collection[0];
        // if onPick is a function then send back an array of the selected images in our Map
        onPick(send);
      }
    }

    handleImageClick(image) {
      // get the multiple and picked callback out of props
      const { multiple } = this.props;
      // use a clean map if we're not in multiple mode
      const pickedImage = multiple ? this.state.picked : new Map();
      // we have images selected if the clicked image src exists in our Map
      const have_selection =  pickedImage.has(image.src);
      // get the new state for our selected items
      const newerPickedImage = (have_selection) ?
        // if the image is already set then remove it from the collection
        this.removeSelection(pickedImage,image.src) :
        // otherwise add it to the collection with the source in both the key and the value
        // we don't use index position, stored in image.value, internally
        pickedImage.set(image.src,image.index);
      // push the collection back into state
      this.setState({picked: newerPickedImage});
      // send back data to the caller if we need to
      this.onData(newerPickedImage);
    }

    renderImage(image, i) {
      // does our map of selected images have this image in it? if so then set this image as selected 
      const selected = (this.state.picked.has(image.src)) ? true : false;
      return (
        <Image
          src={image.src}
          isSelected={selected}
          onImageClick={() => this.handleImageClick(image)}
          key={i}
        />
      )
    }

    render() {
      const { images } = this.props
      // const json = this.state.picked.toJS(); console.log({picked: json});
      return (
        <div className="image_picker">
          { images.map(this.renderImage) }
          <div className="clear"/>
        </div>
      )
    }
}

ImagePicker.defaultProps = {
  // picked is passed in as an array of image paths. internally we store this in an immutable map
  picked: [], 
  // by default, don't bother sniffing the indexes of the pre-selected items in picked from the images array
  sniffPicked: false,
  // by default we'll multiselect
  multiple: true,
  // by default we don't pass you back the images selected. define a callback that takes a single argument, 
  // which is an array of the picked images if you want to get a list of what's been picked so far.
  onPick: null,
}

ImagePicker.propTypes = {
  // an array of images that you want to pick from
  images: PropTypes.array.isRequired,
  // can you select multiple images? bool value
  multiple: PropTypes.bool,
  // a function that we call when you pick an image. You're passed back 
  // an array of the images that the image picker has chosen so far
  onPick: PropTypes.func,
  // An array of paths that are pre-chosen. If you pass in an array of objects, each with this shape: {src: 'some src', index: some_index}
  // then we'll persist the index where the chosen item was in the original collection. If you pass in a plain array of 
  // source paths then we'll pass you back -1 for the indexes on items that we don't know where they came from, even if we 
  // ar tracking that they were selected
  picked: PropTypes.array,
  // if you want to sniff for the index of the picked items, because you don't want to pass in an array of objects for picked that is 
  // shaped like [{src: 'some src', index: some_index},{src: 'some src', index: some_index}] then se can sniff the indexes for you.
  // set this to true if you want to get back the indexes of each item that we select. This defaults to false meaning we'll 
  // pass you back a -1 for the index of the picked items.
  sniffPicked: PropTypes.bool,
}

export default ImagePicker