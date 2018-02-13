import React from 'react';
import ImagePicker from '../src/react-image-picker';
import renderer from 'react-test-renderer';
import { Map } from 'immutable';

import img1 from '../src/assets/images/kitten/200.jpg'
import img2 from '../src/assets/images/kitten/201.jpg'
import img3 from '../src/assets/images/kitten/202.jpg'
import img4 from '../src/assets/images/kitten/203.jpg'

const imageList = [img1, img2, img3, img4]

test('should accept a default image picked', () => {
    const picked = Map().set(0, img1 + "0");
    const component = renderer.create(
        <ImagePicker
            images={imageList.map((image, i) => ({src: image + i, value: i}))}
            picked={picked}
            />
    );

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});