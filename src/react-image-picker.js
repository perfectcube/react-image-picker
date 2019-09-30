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

    // FIXME: method is deprecated: https://reactjs.org/docs/react-component.html#unsafe_componentwillreceiveprops
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

    /**
     * Calls props.onPick if it's a valid function after transforming state.picked into an array of image objects where an 
     * image object is {src:"path to image",index:n} and n is the position of the image within your image collection you passed 
     * in through props.images
     * @param {Map} data the Map storing our selected images
     * @param {object} image an object with the following shape:
     *                       @src {string} the path to the image
     *                       @index {int} the position of the image within your set of selectable images
     * @param {bool} removed true of the {image} was removed from our Map
     * @returns {call} calls props.onPick if its a valid function, sending the following arguments:
     *                 @collection {array} an array of image objects
     *                 @image {object}
     *                 @removed {bool}
     */
    onData(data,image,removed){
      // get the multiple and picked callback out of props
      const { onPick } = this.props;
      // if onPick was defined as a function then transcode our Map into an array and send it back to the caller
      const valid_callback = (typeof onPick === 'function');
      if (valid_callback) {
        // collect an array version of what we have in state
        const collection = [];
        data.forEach((index,src) => {
          collection.push({src: src, index: index});
        });
        // if onPick is a function then send back an array of the selected images in our Map
        onPick(collection,image,removed);
      }
    }

    /**
     * Manage component state for the last clicked image
     * @param {object} image an object with the following shape:
     *                       @src {string} the path to the image
     *                       @index {int} the position of the image within your set of selectable images
     */
    handleImageClick(image) {
      // get the multiple and picked callback out of props
      const { multiple } = this.props;
      let removed = null;
      // by default we send back the image that was clicked on. if an image is removed
      // because !props.multiple mode then the image that was removed is sent back
      let send = image;
      // use a clean map if we're not in multiple mode
      // const picked = (multiple) ? this.state.picked : new Map();
      const picked = this.state.picked;
      // if the clicked image src exists in our Map then remove it, otherwise add it
      let remove = picked.has(image.src);
      // get the new state for our selected items
      let selected = (remove) ?
        // if the image is already set then remove it from the collection
        this.removeSelection(picked,image.src) :
        // otherwise add it to the collection with the source as the key
        // we don't use index position, stored in image.value, internally
        picked.set(image.src,image.index);
 
      // we're not allowing multiple images &&
      // an already selected image wasn't removed
      if (!multiple && !remove) {
        // get items that will be removed. these are items that don't match the last
        // item clicked on. 
        removed = selected.filter((index,src) => {
          return (src !== image.src);
        });

        // did we find an item to remove?
        if (removed.size !== 0) { 
          // because we're in multiple mode, an image is getting removed even though 
          // we didn't originally have this image in the list
          remove = true; 
          // turn the item to remove into an object hta matches our callback spec; {src:index}
          const packed = [];
          // send back the removed image instead of the selected image
          removed.forEach((index,src) => {
            packed.push({src:src,index:index});
          });
          // send back the first (and only) item in the list of packed entries
          send = packed[0];
        }

        // get all items that we'll keep. this will be only the last selected image
        // NOTE: we don't use index but it has to be in the filter call if we're going to filter off the maps key
        selected = selected.filter((index,src) => {
          return (src === image.src);
        });
      }

      // push the collection back into state
      this.setState({picked: selected},()=>{
        // now that state is set, send back data to the caller.
        this.onData(selected,send,remove);
      });
    }

    renderImage(image, i) {
      const {picked} = this.state;
      // does our map of selected images have this image in it? if so then set this image as selected 
      const selected = picked.has(image.src);
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
  // Picked is passed in as an array of image paths. Internally we store this in an immutable Map()
  picked: [],

  // By default, don't bother sniffing the indexes of the pre-selected items in picked from the images array
  sniffPicked: false,

  // By default we'll multiselect
  multiple: true,

  // By default we don't pass you back the images selected. Define a callback if you want to get a list of what's been picked so far.
  onPick: null,
}

ImagePicker.propTypes = {
  
  // An array of images that you want to pick from. Each array member has this shape: {src: 'some src', index: some_index}.
  // To get this array do this: <ImagePicker images={yourImageArray.map((image, index) => ({src: image, index: index}))}
  images: PropTypes.array.isRequired,
  
  // A bool, Can you select multiple images?
  multiple: PropTypes.bool,
  
  // A function that we call when you pick an image. You're passed back:
  //  • as the first argument, an array of the images that the image picker has chosen so far
  //  • as the second argument, an object with the following shape:
  //       src: the image path 
  //       index: the position withing props.images where your image exists 
  //              ... unless you're using picked && sniffPicked = false then you get -1
  //    if !props.multiple then this is the last image removed from the list
  //    else this is the last image that you clicked on
  //  • as the third argument, a boolean letting you know if second argument was removed from the list
  onPick: PropTypes.func,
  
  // An array of paths that are pre-chosen. If you pass in an array of objects, each with this
  // shape: {src: 'some src', index: some_index}, then we'll persist the index where the chosen
  // item was in the original collection. If you pass in a plain array of source paths then we'll
  // pass you back -1 for the indexes on items that we don't know where they came from, even if we
  // are tracking that were selected
  picked: PropTypes.array,

  // If you want to sniff for the index of the picked items, because you don't want to pass in an
  // array of objects for picked that is shaped like [{src: 'some src', index: some_index},{src: 'some src', index: some_index}]
  // then we can sniff the selected indexes for you. This is super useful if the indexes change in
  // search results but you still want to select the same images in the refined
  // search results. Set this to true if you want to get back the indexes of each item that we select.
  // This defaults to false meaning we'll pass you back a -1 for the index of the picked items.
  sniffPicked: PropTypes.bool,
}

export default ImagePicker