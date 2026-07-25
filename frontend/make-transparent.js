const { Jimp } = require('jimp');

async function makeTransparent() {
  try {
    const image = await Jimp.read('public/gdg-logo.png');
    // iterate over all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];

      // If the pixel is mostly black, make it transparent
      if (red < 20 && green < 20 && blue < 20) {
        this.bitmap.data[idx + 3] = 0; // set alpha to 0
      }
    });

    image.write('public/gdg-logo.png');
    console.log('Background removed!');
  } catch (err) {
    console.error(err);
  }
}

makeTransparent();
